import { generateText, stepCountIs } from "ai"
import { createClient } from "@/lib/supabase/server"
import { medicalWebSearch } from "@/lib/web-search-tool"

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
            stopWhen: stepCountIs(5),
          })

    console.log("AI generated response:", text)

    // Save assistant message to database
    try {
      let sessionId = body.sessionId
      
      // If no sessionId provided, get or create the most recent session
      if (!sessionId) {
        const { data: session } = await supabase
          .from("chat_sessions")
          .select("id")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        sessionId = session?.id
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
