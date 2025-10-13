import { generateText, stepCountIs } from "ai"
import { createClient } from "@/lib/supabase/server"
import { emergencyWebSearch } from "@/lib/web-search-tool"
import { getClaude } from "@/lib/ai-provider"
import { getEmergencyGuidancePrompt } from "@/prompts"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { symptoms, severity, patientAge, patientGender, vitalSigns, userId } = await req.json()

    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return new Response("Unauthorized", { status: 401 })
    }

    // Get user profile for context
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single()

    // Generate emergency guidance using Claude Sonnet
    const { text, toolCalls, toolResults } = await generateText({
      model: getClaude('claude-sonnet-4-5-20250929'),
      prompt: getEmergencyGuidancePrompt({
        profile,
        symptoms,
        severity,
        patientAge,
        patientGender,
        vitalSigns
      }),
      tools: {
        emergencyWebSearch,
      },
    })

    // Save emergency consultation to database
    try {
      await supabase.from("emergency_consultations").insert({
        user_id: userId,
        symptoms,
        severity,
        patient_age: patientAge,
        patient_gender: patientGender,
        vital_signs: vitalSigns,
        ai_guidance: text,
      })
      console.log("Successfully saved emergency consultation to database")
    } catch (error) {
      console.error("Error saving emergency consultation to database:", error)
    }

    // Extract citations from web search results
    const citations = toolResults?.flatMap(result => {
      if (result.toolName === 'emergencyWebSearch' && Array.isArray(result)) {
        return result.map((item: any) => ({
          title: item.title,
          url: item.url,
          publishedDate: item.publishedDate
        }))
      }
      return []
    }) || []

    return Response.json({ 
      guidance: text,
      citations: citations,
      toolCalls: toolCalls?.length || 0
    })
  } catch (error) {
    console.error("[v0] Emergency guidance error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}