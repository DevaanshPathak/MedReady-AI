import { generateObject } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 30

const moduleContentSchema = z.object({
  sections: z.array(
    z.object({
      title: z.string(),
      content: z.string(),
      keyPoints: z.array(z.string()),
      practicalTips: z.array(z.string()),
      warningsSigns: z.array(z.string()).optional(),
    }),
  ),
  estimatedDuration: z.number(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
})

export async function POST(req: Request) {
  try {
    const { moduleId, userId } = await req.json()

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

    // Get user profile for personalization
    const { data: profile } = await supabase.from("user_profiles").select("*").eq("user_id", userId).single()

    // Generate dynamic content using Grok-4-fast-reasoning
    const { object } = await generateObject({
      model: "xai/grok-4-fast-reasoning",
      schema: moduleContentSchema,
      prompt: `Generate comprehensive, evidence-based learning content for healthcare workers in rural India.

Module: ${module.title}
Description: ${module.description}
Category: ${module.category}
Target Audience: ${profile?.role || "Healthcare Worker"} with ${profile?.specialization || "general"} specialization

Requirements:
1. Create 4-6 detailed sections covering the topic comprehensively
2. Each section should have:
   - Clear, actionable content (200-300 words)
   - 3-5 key points to remember
   - 2-4 practical tips for rural healthcare settings
   - Warning signs to watch for (if applicable)
3. Follow Indian national health protocols and WHO guidelines
4. Consider resource limitations in rural settings
5. Use simple, clear language
6. Include specific dosages, protocols, and procedures
7. Mention when to refer to higher facilities
8. Focus on practical, implementable knowledge

Make the content highly practical, evidence-based, and tailored for rural Indian healthcare workers.`,
      temperature: 0.8,
    })

    // Store generated content in database
    await supabase.from("module_content_cache").upsert({
      module_id: moduleId,
      content: object,
      generated_at: new Date().toISOString(),
    })

    return Response.json({ content: object })
  } catch (error) {
    console.error("[v0] Generate module content error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
