import { generateText, stepCountIs } from "ai"
import { createClient } from "@/lib/supabase/server"
import { medicalWebSearch } from "@/lib/web-search-tool"

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
    console.log("Chat API received body:", JSON.stringify(body, null, 2))
    
    let messages, userId, userRole, specialization, location, category

    // Handle different request formats
    if (body.messages && Array.isArray(body.messages)) {
      // useChat format
      messages = body.messages
      
      // Try to get userId from body first, then from last message data
      if (body.userId) {
        userId = body.userId
        userRole = body.userRole
        specialization = body.specialization
        location = body.location
        category = body.category
      } else {
        // Extract from last message data
        const lastMessage = body.messages[body.messages.length - 1]
        if (lastMessage?.data) {
          userId = lastMessage.data.userId
          userRole = lastMessage.data.userRole
          specialization = lastMessage.data.specialization
          location = lastMessage.data.location
          category = lastMessage.data.category
          console.log("Extracted from message data:", { userId, userRole, specialization, location, category })
        }
      }
    } else if (body.prompt) {
      // useCompletion format
      messages = [
        {
          role: "user",
          content: body.prompt,
        }
      ]
      userId = body.userId
      userRole = body.userRole
      specialization = body.specialization
      location = body.location
      category = body.category
    } else {
      // Fallback: try to extract from message data
      const lastMessage = body.messages?.[body.messages.length - 1]
      if (lastMessage?.data) {
        messages = body.messages
        userId = lastMessage.data.userId
        userRole = lastMessage.data.userRole
        specialization = lastMessage.data.specialization
        location = lastMessage.data.location
        category = lastMessage.data.category
        console.log("Extracted from message data:", { userId, userRole, specialization, location, category })
      } else {
        console.log("No message data found, using fallback values")
        messages = body.messages || []
        userId = body.userId
        userRole = body.userRole
        specialization = body.specialization
        location = body.location
        category = body.category
      }
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

          // Convert messages to a single prompt for generateText
          const conversationHistory = messages.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n\n')
    const fullPrompt = `${contextPrompt}

Conversation History:
${conversationHistory}`

    console.log("About to call AI model with full prompt:", fullPrompt)
    
          const { text, toolCalls, toolResults } = await generateText({
            model: "xai/grok-4-fast-reasoning",
            prompt: `${fullPrompt}

IMPORTANT: Always use the web search tool to find the most up-to-date information from trusted medical sources. Include proper citations with links in your response.`,
            tools: {
              medicalWebSearch,
            },
            temperature: 0.2,
          })

    console.log("AI generated response:", text)

    // Save assistant message to database
    try {
      const { data: session } = await supabase
        .from("chat_sessions")
        .select("id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      let sessionId = session?.id
      if (!sessionId) {
        const { data: newSession } = await supabase
          .from("chat_sessions")
          .insert({
            user_id: userId,
            title: "General Chat",
          })
          .select("id")
          .single()
        sessionId = newSession?.id
      }

      if (sessionId) {
        await supabase.from("chat_messages").insert({
          session_id: sessionId,
          role: "assistant",
          content: text,
        })
        console.log("Successfully saved assistant message to database")
      }
    } catch (error) {
      console.error("Error saving assistant message to database:", error)
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
            message: text,
            citations: citations,
            toolCalls: toolCalls?.length || 0
          })
  } catch (error) {
    console.error("[v0] Chat API error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
