import { generateObject } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 30

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
  try {
    const { moduleId, userId, difficulty } = await req.json()

    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return new Response("Unauthorized", { status: 401 })
    }

    // Get module details
    const { data: module } = await supabase.from("learning_modules").select("*").eq("id", moduleId).single()

    if (!module) {
      return new Response("Module not found", { status: 404 })
    }

    // Generate dynamic assessment using Grok-4-fast-non-reasoning for simpler task
    const { object } = await generateObject({
      model: "xai/grok-4-fast-non-reasoning",
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

    // Store assessment in database
    const { data: assessment } = await supabase
      .from("assessments")
      .insert({
        module_id: moduleId,
        title: `${module.title} Assessment`,
        questions: object.questions,
        passing_score: object.passingScore,
        time_limit: object.timeLimit,
      })
      .select()
      .single()

    return Response.json({ assessment })
  } catch (error) {
    console.error("[v0] Generate assessment error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
