import { generateText, stepCountIs } from "ai"
import { createClient } from "@/lib/supabase/server"
import { medicalWebSearch } from "@/lib/web-search-tool"
import { getModel } from "@/lib/ai-provider"
import { redis } from "@/lib/redis"

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
    console.log("Completion API received body:", JSON.stringify(body, null, 2))
    console.log("Body keys:", Object.keys(body))

    let {
      prompt,
      userId,
      userRole,
      specialization,
      location,
      category,
      sessionId,
    } = body

    // Support useChat style payloads that send a messages array
    if (!prompt && Array.isArray(body.messages)) {
      const lastUserMessage = [...body.messages].reverse().find((message: any) => message?.role === "user")
      if (lastUserMessage) {
        prompt = typeof lastUserMessage.content === "string" ? lastUserMessage.content : undefined
        const metadata = lastUserMessage.data ?? {}
        userId = userId ?? metadata.userId
        userRole = userRole ?? metadata.userRole
        specialization = specialization ?? metadata.specialization
        location = location ?? metadata.location
        category = category ?? metadata.category
        sessionId = sessionId ?? metadata.sessionId
        console.log("Extracted values from messages:", { prompt, userId, userRole, specialization, location, category, sessionId })
      }
    }

    if (!prompt || !userId) {
      console.log("Missing prompt or userId", { hasPrompt: Boolean(prompt), hasUserId: Boolean(userId) })
      return new Response("Bad Request", { status: 400 })
    }

    console.log("Extracted values:", { prompt, userId, userRole, specialization, location, category, sessionId })

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

## USER CONTEXT
- **Role:** ${userRole || "Healthcare Worker"}
- **Specialization:** ${specialization || "General"}
- **Location:** ${location || "Rural India"}

## RESPONSE INSTRUCTIONS
You must ALWAYS:
1. **Use the web search tool first** to get the most current information
2. **Structure your response** with clear markdown headings (## and ###)
3. **Use bullet points** (•) and numbered lists (1., 2., 3.) appropriately
4. **Focus on practical, actionable advice** for rural healthcare settings
5. **Consider resource limitations** and local availability
6. **Include safety warnings** when relevant using *italics*
7. **Provide clear referral criteria** when appropriate
8. **Do NOT include raw URLs or citations in your response text** - the system will automatically display citations from your web search results

## FORMATTING REQUIREMENTS
- Start with a brief overview
- Use **bold** for critical information
- Use *italics* for warnings and important notes
- End with key takeaway points
- Write naturally without mentioning specific sources or URLs in the text
- The citation display is handled automatically by the system`

    // Declare activeSessionId at function scope
    let activeSessionId = sessionId

    // Save user message to database first
    try {
      // Create a chat session if it doesn't exist
      const { data: session } = !activeSessionId
        ? await supabase
        .from("chat_sessions")
        .select("id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
        : { data: { id: activeSessionId } as any }

      activeSessionId = activeSessionId ?? session?.id
      if (!activeSessionId) {
        const { data: newSession, error: newSessionError } = await supabase
          .from("chat_sessions")
          .insert({
            user_id: userId,
            title: "General Chat",
          })
          .select("id")
          .single()
        if (newSessionError) {
          throw newSessionError
        }
        activeSessionId = newSession?.id
      }

      if (activeSessionId) {
        await supabase.from("chat_messages").insert({
          session_id: activeSessionId,
          role: "user",
          content: prompt,
        })
        console.log("Successfully saved user message to database")
      }
    } catch (error) {
      console.error("Error saving user message to database:", error)
      // Continue with the AI call even if database save fails
    }

    // Check Redis cache for similar recent queries (session management)
    const cacheKey = `chat:${userId}:${prompt.slice(0, 100)}`
    try {
      const cachedResponse = await redis.get(cacheKey)
      if (cachedResponse && typeof cachedResponse === 'object') {
        console.log("Returning cached response from Redis")
        return Response.json(cachedResponse)
      }
    } catch (error) {
      console.warn("Redis cache check failed, continuing with AI generation:", error)
    }

    // Store conversation context in Redis for session persistence
    const conversationKey = `conversation:${userId}:${activeSessionId || 'default'}`
    try {
      await redis.lpush(conversationKey, JSON.stringify({
        role: 'user',
        content: prompt,
        timestamp: Date.now()
      }))
      await redis.expire(conversationKey, 3600) // Expire after 1 hour
      await redis.ltrim(conversationKey, 0, 49) // Keep last 50 messages
    } catch (error) {
      console.warn("Failed to store conversation in Redis:", error)
    }

    console.log("About to call AI model with prompt:", prompt)
    console.log("Context prompt:", contextPrompt)
    
          const { text, toolCalls, toolResults } = await generateText({
            model: getModel("xai/grok-4-fast-reasoning"),
            prompt: `${contextPrompt}

User Question: ${prompt}

CRITICAL INSTRUCTIONS:
1. ALWAYS use the web search tool first to find current medical information
2. After getting search results, provide a comprehensive, well-structured response
3. Use proper markdown formatting with ## headings and bullet points
4. Include specific information from the search results
5. Do NOT just list the search results - synthesize them into a coherent answer
6. Focus on answering the user's specific question with practical guidance
7. Do NOT include URLs, citations, or source references in your response text
8. Write naturally and let the system handle citation display automatically

Please search for current information and provide a detailed, structured response.`,
            tools: {
              medicalWebSearch,
            },
            temperature: 0.7,
            stopWhen: stepCountIs(5),
          })

          console.log("Tool calls:", toolCalls)
          console.log("Tool results:", toolResults)

    console.log("AI generated response:", text)
    console.log("AI response length:", text?.length || 0)
    console.log("AI response type:", typeof text)

    // Save assistant message to database
    try {
      const { data: session } = !activeSessionId
        ? await supabase
        .from("chat_sessions")
        .select("id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
        : { data: { id: activeSessionId } as any }

      activeSessionId = activeSessionId ?? session?.id
      if (!activeSessionId) {
        const { data: newSession, error: newSessionError } = await supabase
          .from("chat_sessions")
          .insert({
            user_id: userId,
            title: "General Chat",
          })
          .select("id")
          .single()
        if (newSessionError) {
          throw newSessionError
        }
        activeSessionId = newSession?.id
      }

      if (activeSessionId) {
        await supabase.from("chat_messages").insert({
          session_id: activeSessionId,
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
                title: item.title || 'Medical Source',
                url: item.url,
                publishedDate: item.publishedDate,
                domain: item.url ? new URL(item.url).hostname.replace('www.', '') : 'Medical Source'
              }))
            }
            return []
          }) || []

          // Use the AI generated response (stopWhen handles the multi-step process)
          const responseText = text || "I apologize, but I'm having trouble generating a response right now. Please try again or rephrase your question."
          
          const responsePayload = { 
            completion: responseText,
            citations: citations,
            toolCalls: toolCalls?.length || 0
          }

          // Cache the response in Redis for 5 minutes
          try {
            await redis.setex(cacheKey, 300, JSON.stringify(responsePayload))
            console.log("Cached response in Redis")
          } catch (error) {
            console.warn("Failed to cache response in Redis:", error)
          }

          // Store assistant response in conversation history
          try {
            await redis.lpush(conversationKey, JSON.stringify({
              role: 'assistant',
              content: responseText,
              timestamp: Date.now()
            }))
          } catch (error) {
            console.warn("Failed to store assistant message in Redis:", error)
          }

          return Response.json(responsePayload)
  } catch (error) {
    console.error("[v0] Completion API error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
