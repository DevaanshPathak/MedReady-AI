import { generateObject } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { redis } from "@/lib/redis"
import { medicalWebSearch } from "@/lib/web-search-tool"

export const maxDuration = 90

const moduleContentSchema = z.object({
  sections: z.array(
    z.object({
      title: z.string(),
      content: z.string(),
      keyPoints: z.array(z.string()),
      practicalTips: z.array(z.string()),
      warningSigns: z.array(z.string()).optional(),
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
    const { data: module } = await supabase.from("modules").select("*").eq("id", moduleId).single()

    if (!module) {
      return new Response("Module not found", { status: 404 })
    }

    // Get user profile for personalization
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single()

    // Check Redis cache first (shorter cache duration due to web search)
    const cacheKey = `module_content:${moduleId}:${profile?.specialization || 'general'}`
    
    try {
      const cachedContent = await redis.get(cacheKey)
      if (cachedContent) {
        console.log(`[v0] Returning cached content for module ${moduleId}`)
        // Upstash Redis automatically deserializes JSON objects
        return Response.json({ content: cachedContent })
      }
    } catch (cacheError) {
      console.warn("[v0] Redis cache error:", cacheError)
      // Continue with generation if cache fails
    }

    // Generate complete chapter content with web search for current protocols
    const { object, toolCalls, toolResults } = await generateObject({
      model: "xai/grok-4-fast-reasoning",
      schema: moduleContentSchema,
      prompt: `Generate a COMPLETE, comprehensive learning module for healthcare workers in rural India.

Module: ${module.title}
Description: ${module.description}
Category: ${module.category}
Target Audience: ${profile?.role || "Healthcare Worker"} with ${profile?.specialization || "general"} specialization

CRITICAL: Use the web search tool to find the most current medical protocols, guidelines, and evidence-based practices from trusted sources like WHO, ICMR, CDC, and medical journals. Include proper citations with links in your response.

IMPORTANT: Generate the ENTIRE module content in one go. Create 6-8 comprehensive sections that cover the topic completely.

Requirements for EACH section:
1. Detailed, actionable content (300-400 words per section) with current protocols
2. 4-6 key points to remember based on latest evidence
3. 3-5 practical tips specifically for rural healthcare settings
4. Warning signs to watch for (when applicable)
5. Specific protocols, dosages, and procedures from current guidelines
6. Clear referral criteria to higher facilities
7. Include citations to current medical sources and guidelines

Overall Module Requirements:
- Follow CURRENT Indian national health protocols (MoHFW, ICMR) and WHO guidelines
- Include latest research findings and evidence-based practices
- Consider resource limitations in rural settings
- Use simple, clear language accessible to all healthcare workers
- Address common scenarios in rural Indian healthcare
- Provide comprehensive coverage from basics to advanced topics
- Include emergency protocols and first aid procedures
- Cover prevention, diagnosis, and treatment aspects
- Cite current medical literature and official guidelines

Make this a complete, self-contained learning resource that a healthcare worker can use to master the topic with the most up-to-date information available.`,
      tools: {
        medicalWebSearch,
      },
      temperature: 0.7,
    })

    // Store generated content in database
    await supabase.from("module_content_cache").upsert({
      module_id: moduleId,
      content: object,
      generated_at: new Date().toISOString(),
    })

    // Cache in Redis for 8 hours (shorter due to web search for current data)
    try {
      await redis.setex(cacheKey, 28800, object)
      console.log(`[v0] Cached content for module ${moduleId}`)
    } catch (cacheError) {
      console.warn("[v0] Failed to cache content:", cacheError)
      // Don't fail the request if caching fails
    }

    // Extract citations from web search results
    const citations = toolResults?.flatMap(result => {
      if (result.toolName === 'medicalWebSearch' && Array.isArray(result)) {
        return result.map((item: any) => ({
          title: item.title,
          url: item.url,
          publishedDate: item.publishedDate
        }))
      }
      return []
    }) || []

    return Response.json({ 
      content: object,
      citations: citations,
      toolCalls: toolCalls?.length || 0
    })
  } catch (error) {
    console.error("[v0] Generate module content error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
