import { streamText, stepCountIs, convertToModelMessages, type UIMessage } from "ai"
import { createClient } from "@/lib/supabase/server"
import { medicalWebSearch } from "@/lib/web-search-tool"
import { getClaude } from "@/lib/ai-provider"

export const maxDuration = 30

const systemPrompts = {
  general: `You are MedReady AI, an expert medical assistant for healthcare workers in rural India. You provide accurate, evidence-based medical information following Indian healthcare protocols and WHO guidelines.

RESPONSE FORMAT REQUIREMENTS:
- Always structure your response with clear headings using ## and ###
- Use bullet points (•) for lists and numbered lists (1., 2., 3.) for steps
- Include **bold text** for important information and *italics* for emphasis
- Always cite sources with proper links when using web search results
- Keep responses concise but comprehensive
- Focus on practical, actionable advice for resource-limited settings

CONTENT GUIDELINES:
- Provide evidence-based information
- Consider resource limitations in rural settings
- Follow Indian national health protocols
- Mention when to refer to higher facilities
- Include safety warnings when relevant
- Use simple, clear medical terminology`,

  emergency: `You are MedReady AI specializing in emergency care for rural healthcare settings in India.

RESPONSE FORMAT REQUIREMENTS:
- Structure with clear headings: ## IMMEDIATE ACTIONS, ## ASSESSMENT, ## TREATMENT, ## REFERRAL
- Use numbered steps for procedures
- Use **bold** for critical actions and *italics* for warnings
- Include timeframes (e.g., "within 5 minutes")
- Always cite latest emergency protocols

EMERGENCY GUIDELINES:
- Prioritize patient safety above all
- Focus on triage and stabilization
- Provide clear referral criteria
- Consider transport challenges in rural areas
- Include vital sign parameters
- Mention equipment availability issues`,

  maternal: `You are MedReady AI specializing in maternal and child health for rural India.

RESPONSE FORMAT REQUIREMENTS:
- Use clear headings for different aspects (## Antenatal Care, ## Delivery, ## Postpartum)
- Structure information chronologically when relevant
- Include gestational age considerations
- Use **bold** for critical interventions
- Provide age-appropriate guidance

MATERNAL HEALTH FOCUS:
- Follow Indian national guidelines and WHO recommendations
- Consider cultural sensitivities
- Address common complications
- Include family planning aspects
- Focus on safe delivery practices`,

  pediatric: `You are MedReady AI specializing in pediatric care for rural healthcare settings.

RESPONSE FORMAT REQUIREMENTS:
- Always include age-specific information
- Structure by age groups: ## Neonates (0-28 days), ## Infants (1-12 months), ## Children (1-12 years)
- Use weight-based dosing when applicable
- Include growth and development milestones
- Use **bold** for critical signs

PEDIATRIC GUIDELINES:
- Age-appropriate assessments and treatments
- Consider vaccine schedules
- Address common childhood illnesses
- Include parental education points
- Focus on emergency pediatric care`,

  infectious: `You are MedReady AI specializing in infectious diseases common in India.

RESPONSE FORMAT REQUIREMENTS:
- Structure by: ## Diagnosis, ## Treatment, ## Prevention, ## Complications
- Include epidemiological data when relevant
- Use **bold** for diagnostic criteria
- Provide seasonal considerations
- Include vector control measures

INFECTIOUS DISEASE FOCUS:
- Malaria, tuberculosis, dengue, waterborne diseases
- Antibiotic stewardship principles
- Contact tracing protocols
- Public health considerations
- Seasonal variations in disease patterns`,

  drugs: `You are MedReady AI specializing in pharmacology for rural Indian healthcare.

RESPONSE FORMAT REQUIREMENTS:
- Structure by: ## Indications, ## Dosage, ## Contraindications, ## Side Effects, ## Interactions
- Always provide generic names first
- Include cost considerations when relevant
- Use **bold** for critical contraindications
- Provide alternative medications when available

PHARMACOLOGY GUIDELINES:
- Consider drug availability in rural settings
- Include monitoring requirements
- Address storage conditions
- Provide patient counseling points
- Include drug interaction warnings`,
}

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
    const basePrompt = systemPrompts[category as keyof typeof systemPrompts] || systemPrompts.general

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

    // Return the streaming response with onFinish callback for saving
    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      onFinish: async ({ messages: finalMessages }) => {
        try {
          // Get or create session
          let activeSessionId = sessionId
          if (!activeSessionId) {
            const { data: session } = await supabase
              .from("chat_sessions")
              .select("id")
              .eq("user_id", userId)
              .order("created_at", { ascending: false })
              .limit(1)
              .single()

            activeSessionId = session?.id
            if (!activeSessionId) {
              const { data: newSession } = await supabase
                .from("chat_sessions")
                .insert({
                  user_id: userId,
                  title: "New Chat",
                })
                .select("id")
                .single()
              activeSessionId = newSession?.id
            }
          }

          // Save all messages
          if (activeSessionId && finalMessages) {
            for (const message of finalMessages) {
              // Extract text content from message parts
              const textContent = message.parts
                ?.filter((part: any) => part.type === 'text')
                .map((part: any) => part.text)
                .join('\n') || ''
              
              if (textContent) {
                await supabase.from("chat_messages").insert({
                  session_id: activeSessionId,
                  role: message.role,
                  content: textContent,
                })
              }
            }
            console.log("Successfully saved messages to database")
          }
        } catch (error) {
          console.error("Error saving messages to database:", error)
        }
      }
    })

  } catch (error) {
    console.error("[Chat API] Error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
