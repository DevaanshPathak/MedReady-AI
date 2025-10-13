import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"
import { getClaude } from "@/lib/ai-provider"
import { getChatTitlePrompt } from "@/prompts"
import { NextResponse } from "next/server"

export const maxDuration = 10

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { message, userId, sessionId } = body

    if (!message || !userId || !sessionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Generate a concise title using Claude Haiku (fast and cheap)
    const result = await generateText({
      model: getClaude('claude-haiku-3-5-20241022'),
      prompt: getChatTitlePrompt(message),
      temperature: 0.3,
    })

    const title = result.text.trim().replace(/^["']|["']$/g, '') // Remove quotes if any

    // Update the session title
    const { error: updateError } = await supabase
      .from("chat_sessions")
      .update({ title })
      .eq("id", sessionId)
      .eq("user_id", userId)

    if (updateError) {
      console.error("Error updating session title:", updateError)
      return NextResponse.json(
        { error: "Failed to update title" },
        { status: 500 }
      )
    }

    return NextResponse.json({ title })
  } catch (error) {
    console.error("[Generate Chat Title] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
