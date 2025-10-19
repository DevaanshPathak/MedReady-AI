import { streamText, stepCountIs, convertToModelMessages, type UIMessage } from "ai"
import { createClient } from "@/lib/supabase/server"
import { medicalWebSearch } from "@/lib/web-search-tool"
import { getClaude } from "@/lib/ai-provider"
import { getChatSystemPrompt, type ChatCategory } from "@/prompts"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("Chat API received body:", JSON.stringify(body, null, 2))
    
    let messages: UIMessage[] = []
    let userId, userRole, specialization, location, category, sessionId
    let usePromptCache = false
    let extendedThinking = false

    // Handle different request formats
    if (body.messages && Array.isArray(body.messages)) {
      // useChat format - convert to UIMessage format if needed
      messages = body.messages.map((msg: any, index: number) => {
        // If message already has parts array, use it as-is
        if (msg.parts && Array.isArray(msg.parts)) {
          return {
            id: msg.id || `msg-${Date.now()}-${index}`,
            role: msg.role,
            parts: msg.parts
          }
        }
        // Convert old format (content string) to new format (parts array)
        if (typeof msg.content === 'string') {
          return {
            id: msg.id || `msg-${Date.now()}-${index}`,
            role: msg.role,
            parts: [{ type: 'text', text: msg.content }]
          }
        }
        // Fallback: try to handle as-is but ensure id exists
        return {
          id: msg.id || `msg-${Date.now()}-${index}`,
          role: msg.role,
          parts: msg.parts || [{ type: 'text', text: String(msg.content || '') }]
        }
      })
      
      // Extract configuration
      userId = body.userId
      userRole = body.userRole
      specialization = body.specialization
      location = body.location
      category = body.category
      sessionId = body.sessionId
      usePromptCache = body.usePromptCache ?? false
      extendedThinking = body.extendedThinking ?? false
      
      // Also try to extract from last message data
      if (!userId) {
        const lastMessage = body.messages[body.messages.length - 1]
        if (lastMessage?.data) {
          userId = lastMessage.data.userId
          userRole = lastMessage.data.userRole
          specialization = lastMessage.data.specialization
          location = lastMessage.data.location
          category = lastMessage.data.category
          sessionId = lastMessage.data.sessionId
          console.log("Extracted from message data:", { userId, userRole, specialization, location, category })
        }
      }
    } else if (body.prompt) {
      // useCompletion format - convert to messages
      messages = [
        {
          id: `msg-${Date.now()}`,
          role: "user",
          parts: [{ type: 'text', text: body.prompt }]
        }
      ] as UIMessage[]
      userId = body.userId
      userRole = body.userRole
      specialization = body.specialization
      location = body.location
      category = body.category
      sessionId = body.sessionId
    } else {
      // Fallback
      messages = body.messages || []
      userId = body.userId
      userRole = body.userRole
      specialization = body.specialization
      location = body.location
      category = body.category
      sessionId = body.sessionId
    }

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

    // Validate that we have messages
    if (!messages || messages.length === 0) {
      console.log("No messages provided in request")
      return new Response("Bad Request: No messages provided", { status: 400 })
    }

    // Filter out messages with no text content (empty messages cause API errors)
    messages = messages.filter((msg) => {
      const hasTextContent = msg.parts?.some((part: any) => 
        part.type === 'text' && part.text && part.text.trim().length > 0
      )
      return hasTextContent
    })

    if (messages.length === 0) {
      console.log("No valid messages with text content")
      return new Response("Bad Request: No valid messages with text content", { status: 400 })
    }

    console.log("Filtered messages count:", messages.length)

    // Build context-aware system prompt
    const basePrompt = getChatSystemPrompt((category as ChatCategory) || 'general')

    const contextPrompt = `${basePrompt}

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

    console.log("About to call streamText with Claude model")
    console.log("Messages count:", messages.length)
    console.log("First message:", JSON.stringify(messages[0], null, 2))
    if (messages.length > 1) {
      console.log("Second message:", JSON.stringify(messages[1], null, 2))
    }
    
    // Configure provider options for extended thinking
    // Note: Provider options must match the AI SDK's expected structure
    const streamOptions: any = {
      model: getClaude('claude-sonnet-4-5-20250929'),
      system: contextPrompt,
      messages: convertToModelMessages(messages),
      tools: { medicalWebSearch },
      temperature: 0.2,
      stopWhen: stepCountIs(5),
    }
    
    if (extendedThinking) {
      streamOptions.providerOptions = {
        anthropic: {
          thinking: { type: 'enabled', budgetTokens: 12000 }
        }
      }
    }

    const result = streamText(streamOptions)

    // Return the streaming response (message saving handled in client)
    return result.toUIMessageStreamResponse({
      originalMessages: messages,
    })

  } catch (error) {
    console.error("[Chat API] Error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
