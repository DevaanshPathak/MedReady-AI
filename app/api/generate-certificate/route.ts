import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { moduleId } = await request.json()

    // Check if user completed the module
    const { data: progress } = await supabase
      .from("module_progress")
      .select("*, learning_modules(*)")
      .eq("user_id", user.id)
      .eq("module_id", moduleId)
      .eq("completed", true)
      .single()

    if (!progress) {
      return NextResponse.json({ error: "Module not completed" }, { status: 400 })
    }

    // Check if user passed the assessment
    const { data: assessment } = await supabase
      .from("assessments")
      .select("*")
      .eq("user_id", user.id)
      .eq("module_id", moduleId)
      .gte("score", 70)
      .order("completed_at", { ascending: false })
      .limit(1)
      .single()

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not passed (minimum 70% required)" }, { status: 400 })
    }

    // Check if certificate already exists
    const { data: existingCert } = await supabase
      .from("certifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("certification_name", `${progress.learning_modules.title} Specialist`)
      .single()

    if (existingCert) {
      return NextResponse.json({ certificate: existingCert })
    }

    // Generate certificate
    const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    const verificationHash = Buffer.from(`${user.id}-${moduleId}-${Date.now()}`).toString("base64")

    const { data: certificate, error } = await supabase
      .from("certifications")
      .insert({
        user_id: user.id,
        certification_name: `${progress.learning_modules.title} Specialist`,
        issuing_authority: "MedReady AI Certification Board",
        certificate_id: certificateId,
        issued_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 2 years
        status: "active",
        verification_hash: verificationHash,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ certificate })
  } catch (error) {
    console.error("[v0] Certificate generation error:", error)
    return NextResponse.json({ error: "Failed to generate certificate" }, { status: 500 })
  }
}
