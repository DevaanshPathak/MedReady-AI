import { generateObject } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { getClaude } from "@/lib/ai-provider"

export const maxDuration = 30

const recommendationSchema = z.object({
  recommendations: z.array(
    z.object({
      location: z.string(),
      district: z.string(),
      state: z.string(),
      matchScore: z.number(),
      reasoning: z.string(),
      requiredSkills: z.array(z.string()),
      benefits: z.array(z.string()),
      challenges: z.array(z.string()),
      preparationSteps: z.array(z.string()),
    }),
  ),
  overallAnalysis: z.string(),
})

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()

    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return new Response("Unauthorized", { status: 401 })
    }

    // Get user profile and skills
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single()

    // Get user's completed modules and certifications
    const { data: progress } = await supabase
      .from("progress")
      .select("*, modules(*)")
      .eq("user_id", userId)
      .eq("status", "completed")

    const { data: certifications } = await supabase.from("certifications").select("*").eq("user_id", userId)

    // Get available rural deployments
    const { data: deployments } = await supabase.from("deployments").select("*").limit(20)

    // Generate intelligent recommendations using Grok-4-fast-reasoning
    const { object } = await generateObject({
      model: getClaude('claude-sonnet-4-5-20250929'),
      schema: recommendationSchema,
      prompt: `Analyze and recommend the best rural healthcare deployment opportunities for this healthcare worker.

User Profile:
- Role: ${profile?.role}
- Specialization: ${profile?.specialization}
- Experience: ${profile?.experience_years} years
- Languages: ${profile?.languages?.join(", ")}
- Current Location: ${profile?.location}

Completed Training:
${progress?.map((p) => `- ${p.modules.title}`).join("\n")}

Certifications:
${certifications?.map((c) => `- ${c.title}`).join("\n")}

Available Deployments:
${deployments?.map((d) => `- ${d.location}, ${d.district}, ${d.state} (${d.facility_type}) - Needs: ${d.required_skills?.join(", ")}`).join("\n")}

Task:
1. Analyze the user's skills, experience, and training
2. Match them with the most suitable rural deployment opportunities
3. Provide top 5 recommendations ranked by match score (0-100)
4. For each recommendation, explain:
   - Why it's a good match (reasoning)
   - Required skills they have/need
   - Benefits of this deployment
   - Potential challenges
   - Preparation steps before deployment
5. Provide an overall analysis of their readiness for rural deployment

Consider:
- Skill alignment
- Experience level
- Language compatibility
- Geographic preferences
- Career development opportunities
- Community impact potential`,
      temperature: 0.7,
    })

    return Response.json({ recommendations: object })
  } catch (error) {
    console.error("[v0] Deployment recommendations error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
