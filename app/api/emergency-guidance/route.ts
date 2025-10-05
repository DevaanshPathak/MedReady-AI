import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"

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
    const { data: profile } = await supabase.from("user_profiles").select("*").eq("user_id", userId).single()

    // Generate emergency guidance using Grok-4-fast-reasoning for critical decisions
    const { text } = await generateText({
      model: "xai/grok-4-fast-reasoning",
      prompt: `You are an emergency medical AI assistant for rural healthcare workers in India. Provide immediate, actionable guidance for this emergency situation.

Healthcare Worker Profile:
- Role: ${profile?.role}
- Specialization: ${profile?.specialization}
- Experience: ${profile?.experience_years} years
- Location: ${profile?.location}

Emergency Case:
- Symptoms: ${symptoms}
- Severity: ${severity}
- Patient Age: ${patientAge}
- Patient Gender: ${patientGender}
- Vital Signs: ${JSON.stringify(vitalSigns)}

Provide:
1. IMMEDIATE ACTIONS (first 5 minutes)
   - Critical interventions
   - Stabilization steps
   - What to monitor

2. DIFFERENTIAL DIAGNOSIS
   - Most likely conditions (ranked)
   - Red flags to watch for

3. TREATMENT PROTOCOL
   - Medications (with exact dosages)
   - Procedures to perform
   - Equipment needed

4. REFERRAL DECISION
   - Should patient be referred? (YES/NO)
   - Urgency level (IMMEDIATE/URGENT/ROUTINE)
   - What to communicate to receiving facility
   - How to stabilize during transport

5. DOCUMENTATION
   - Key information to record
   - Legal considerations

Format: Use clear headings, bullet points, and bold text for critical information.
Follow: Indian national emergency protocols, WHO guidelines, and ICMR recommendations.
Consider: Resource limitations in rural settings, available medications, transport challenges.

IMPORTANT: This is for emergency guidance only. Always prioritize patient safety and refer when in doubt.`,
      temperature: 0.5,
      maxTokens: 2000,
    })

    // Log emergency consultation
    await supabase.from("emergency_consultations").insert({
      user_id: userId,
      symptoms,
      severity,
      patient_age: patientAge,
      patient_gender: patientGender,
      vital_signs: vitalSigns,
      ai_guidance: text,
      created_at: new Date().toISOString(),
    })

    return Response.json({ guidance: text })
  } catch (error) {
    console.error("[v0] Emergency guidance error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
