import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { CertificateBlockchain } from "@/lib/blockchain"

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
      .from("progress")
      .select("*, modules(*)")
      .eq("user_id", user.id)
      .eq("module_id", moduleId)
      .eq("status", "completed")
      .single()

    if (!progress) {
      return NextResponse.json({ error: "Module not completed" }, { status: 400 })
    }

    // Check if user passed the assessment
    const { data: assessmentAttempt } = await supabase
      .from("assessment_attempts")
      .select("*, assessments(*)")
      .eq("user_id", user.id)
      .eq("assessments.module_id", moduleId)
      .eq("passed", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (!assessmentAttempt) {
      return NextResponse.json({ error: "Assessment not passed (minimum 70% required)" }, { status: 400 })
    }

    // Check if certificate already exists
    const { data: existingCert } = await supabase
      .from("certifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("module_id", moduleId)
      .single()

    if (existingCert) {
      return NextResponse.json({ certificate: existingCert })
    }

    // Generate certificate and add to blockchain
    const issuedAt = new Date().toISOString()
    const certificateData = {
      userId: user.id,
      moduleId: moduleId,
      skill: progress.modules.title,
      level: "intermediate",
      score: assessmentAttempt.score,
      issuedAt
    }

    // Add certificate to blockchain
    const block = await CertificateBlockchain.addCertificate(certificateData)

    // Store certificate in database with blockchain hash
    const { data: certificate, error } = await supabase
      .from("certifications")
      .insert({
        user_id: user.id,
        module_id: moduleId,
        skill: progress.modules.title,
        level: "intermediate",
        certificate_hash: block.hash, // Use blockchain hash
        issued_at: issuedAt,
        expires_at: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 2 years
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ 
      certificate,
      blockchain: {
        hash: block.hash,
        blockIndex: block.index,
        timestamp: block.timestamp,
        nonce: block.nonce
      }
    })
  } catch (error) {
    console.error("[v0] Certificate generation error:", error)
    return NextResponse.json({ error: "Failed to generate certificate" }, { status: 500 })
  }
}
