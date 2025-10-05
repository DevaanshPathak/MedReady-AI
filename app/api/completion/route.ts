import { streamText } from "ai"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 30

const systemPrompts = {
  general: `You are MedReady AI, an expert medical assistant for healthcare workers in rural India. Provide accurate, evidence-based medical information following Indian healthcare protocols and WHO guidelines. Be concise, practical, and focus on resource-limited settings.`,

  emergency: `You are MedReady AI specializing in emergency care. Provide rapid, actionable guidance for emergency situations in rural healthcare settings. Focus on triage, stabilization, and when to refer. Always prioritize patient safety.`,

  maternal: `You are MedReady AI specializing in maternal and child health. Provide guidance on antenatal care, safe delivery practices, postpartum care, and newborn care following Indian national guidelines and WHO recommendations.`,

  pediatric: `You are MedReady AI specializing in pediatric care. Provide age-appropriate guidance for common childhood illnesses, growth monitoring, immunizations, and emergency pediatric care in resource-limited settings.`,

  infectious: `You are MedReady AI specializing in infectious diseases. Provide guidance on diagnosis, treatment, and prevention of infectious diseases common in India, including malaria, tuberculosis, dengue, and waterborne diseases.`,

  drugs: `You are MedReady AI specializing in pharmacology. Provide information on drug dosages, interactions, contraindications, and side effects. Always mention generic names and consider availability in rural Indian healthcare settings.`,
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("Completion API received body:", JSON.stringify(body, null, 2))
    console.log("Body keys:", Object.keys(body))
    
    const { prompt, userId, userRole, specialization, location, category } = body
    
    console.log("Extracted values:", { prompt, userId, userRole, specialization, location, category })

    const supabase = await createClient()

    // Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("Authenticated user:", user?.id, "Expected userId:", userId)

    if (!user || user.id !== userId) {
      console.log("Authentication failed - no user or ID mismatch")
      return new Response("Unauthorized", { status: 401 })
    }

    // Build context-aware system prompt
    const systemPrompt = systemPrompts[category as keyof typeof systemPrompts] || systemPrompts.general

    const contextPrompt = `${systemPrompt}

User Context:
- Role: ${userRole || "Healthcare Worker"}
- Specialization: ${specialization || "General"}
- Location: ${location || "Rural India"}

Guidelines:
1. Provide evidence-based information
2. Consider resource limitations in rural settings
3. Follow Indian national health protocols
4. Mention when to refer to higher facilities
5. Be practical and actionable
6. Use simple, clear language
7. Include safety warnings when relevant
8. Cite sources when possible (WHO, ICMR, national guidelines)

Format responses clearly with:
- Key points first
- Step-by-step instructions when relevant
- Warning signs to watch for
- When to seek additional help`

    // Save user message to database first
    try {
      await supabase.from("chat_messages").insert({
        user_id: userId,
        role: "user",
        content: prompt,
        category: category || "general",
      })
      console.log("Successfully saved user message to database")
    } catch (error) {
      console.error("Error saving user message to database:", error)
      // Continue with the AI call even if database save fails
    }

    const result = streamText({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: contextPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      maxTokens: 2000,
      onFinish: async (completion) => {
        // Save assistant message to database
        try {
          await supabase.from("chat_messages").insert({
            user_id: userId,
            role: "assistant",
            content: completion,
            category: category || "general",
          })
          console.log("Successfully saved assistant message to database")
        } catch (error) {
          console.error("Error saving assistant message to database:", error)
        }
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("[v0] Completion API error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
