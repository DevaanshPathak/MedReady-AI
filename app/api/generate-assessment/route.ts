import { generateObject } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 30

// Fallback questions for when AI generation fails
function generateFallbackQuestions(module: any) {
  const baseQuestions = [
    {
      question: `What is the primary purpose of ${module.title} in healthcare settings?`,
      options: [
        "To provide emergency care only",
        "To prevent and manage health conditions",
        "To replace professional medical care",
        "To diagnose complex diseases"
      ],
      correctAnswer: 1,
      explanation: "This module focuses on preventing and managing health conditions as part of comprehensive healthcare delivery.",
      difficulty: "easy"
    },
    {
      question: `In rural healthcare settings, what is the most important consideration when applying ${module.title}?`,
      options: [
        "Advanced medical equipment availability",
        "Resource limitations and local context",
        "Patient insurance coverage",
        "Hospital infrastructure"
      ],
      correctAnswer: 1,
      explanation: "Rural settings require adaptation to resource limitations and local context for effective healthcare delivery.",
      difficulty: "medium"
    },
    {
      question: `When should a healthcare worker refer a patient for specialized care related to ${module.title}?`,
      options: [
        "Never, handle all cases independently",
        "Only when the patient requests it",
        "When symptoms exceed basic care capabilities",
        "Only during emergencies"
      ],
      correctAnswer: 2,
      explanation: "Patients should be referred when symptoms or conditions exceed the scope of basic healthcare capabilities.",
      difficulty: "medium"
    },
    {
      question: `What is the correct first step when encountering a patient with symptoms related to ${module.title}?`,
      options: [
        "Begin treatment immediately",
        "Assess the situation and ensure safety",
        "Call for advanced medical support",
        "Document the case first"
      ],
      correctAnswer: 1,
      explanation: "Always assess the situation and ensure safety before proceeding with any healthcare intervention.",
      difficulty: "easy"
    },
    {
      question: `In the context of ${module.title}, what does 'evidence-based practice' mean?`,
      options: [
        "Using traditional methods only",
        "Following procedures based on scientific evidence",
        "Relying on personal experience",
        "Using the most expensive treatments"
      ],
      correctAnswer: 1,
      explanation: "Evidence-based practice involves using treatments and procedures supported by scientific research and clinical evidence.",
      difficulty: "medium"
    }
  ]

  // Add more questions based on module category
  if (module.category === "Emergency Care") {
    baseQuestions.push({
      question: "What is the priority order in emergency care?",
      options: [
        "Airway, Breathing, Circulation",
        "Circulation, Breathing, Airway", 
        "Breathing, Airway, Circulation",
        "Any order is acceptable"
      ],
      correctAnswer: 0,
      explanation: "The ABC (Airway, Breathing, Circulation) approach is the standard priority order in emergency care.",
      difficulty: "hard"
    })
  }

  return baseQuestions
}

const assessmentSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()),
      correctAnswer: z.number(),
      explanation: z.string(),
      difficulty: z.enum(["easy", "medium", "hard"]),
    }),
  ),
  passingScore: z.number(),
  timeLimit: z.number(),
})

export async function POST(req: Request) {
  let moduleId: string | undefined
  let userId: string | undefined
  try {
    const parsed = await req.json()
    moduleId = parsed.moduleId
    userId = parsed.userId
    const { difficulty } = parsed

    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return new Response("Unauthorized", { status: 401 })
    }

    // Get module details
    const { data: module } = await supabase.from("modules").select("*").eq("id", moduleId).single()

    if (!module) {
      return new Response("Module not found", { status: 404 })
    }

    // Generate dynamic assessment using AI, with fallback to basic questions
    let object
    try {
      const result = await generateObject({
        model: "xai/grok-4-fast-reasoning",
        schema: assessmentSchema,
        prompt: `Generate a comprehensive assessment for healthcare workers on: ${module.title}

Module Description: ${module.description}
Category: ${module.category}
Difficulty Level: ${difficulty || "medium"}

Requirements:
1. Create 10 multiple-choice questions
2. Each question should have:
   - Clear, scenario-based question
   - 4 options (A, B, C, D)
   - Correct answer index (0-3)
   - Detailed explanation of why the answer is correct
   - Difficulty level (easy, medium, hard)
3. Mix of difficulty levels: 3 easy, 5 medium, 2 hard
4. Focus on practical application and clinical decision-making
5. Include questions on:
   - Diagnosis and assessment
   - Treatment protocols
   - Emergency management
   - When to refer
   - Drug dosages and interactions
6. Follow Indian national health protocols
7. Consider rural healthcare settings

Passing score should be 70% (7/10 correct)
Time limit should be 15 minutes (900 seconds)`,
        temperature: 0.9,
      })
      object = result.object
    } catch (aiError) {
      console.error("[v0] AI generation failed, using fallback questions:", aiError)
      
      // Fallback to basic questions based on module category
      object = {
        questions: generateFallbackQuestions(module),
        passingScore: 70,
        timeLimit: 900
      }
    }

    // Check if assessment already exists
    const { data: existingAssessment } = await supabase
      .from("assessments")
      .select("*")
      .eq("module_id", moduleId)
      .single()

    let assessment
    if (existingAssessment) {
      // Update existing assessment
      const { data: updatedAssessment } = await supabase
        .from("assessments")
        .update({
          questions: object.questions,
          passing_score: object.passingScore,
          time_limit_minutes: Math.round(object.timeLimit / 60), // Convert seconds to minutes
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingAssessment.id)
        .select()
        .single()
      assessment = updatedAssessment
    } else {
      // Create new assessment
      const { data: newAssessment } = await supabase
        .from("assessments")
        .insert({
          module_id: moduleId,
          title: `${module.title} Assessment`,
          questions: object.questions,
          passing_score: object.passingScore,
          time_limit_minutes: Math.round(object.timeLimit / 60), // Convert seconds to minutes
        })
        .select()
        .single()
      assessment = newAssessment
    }

    return Response.json({ assessment })
  } catch (error) {
    console.error("[v0] Generate assessment error:", error)
    console.error("[v0] Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      moduleId,
      userId
    })
    return new Response(JSON.stringify({ 
      error: "Internal Server Error", 
      details: error instanceof Error ? error.message : 'Unknown error',
      moduleId,
      userId 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
