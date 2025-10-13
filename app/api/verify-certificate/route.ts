import { NextResponse } from "next/server"
import { CertificateBlockchain } from "@/lib/blockchain"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { certificateHash } = await request.json()

    if (!certificateHash) {
      return NextResponse.json({ error: "Certificate hash is required" }, { status: 400 })
    }

    // Verify on blockchain
    const verification = await CertificateBlockchain.verifyCertificate(certificateHash)

    if (!verification.isValid) {
      return NextResponse.json({
        verified: false,
        message: verification.message
      })
    }

    // Get additional details from database
    const supabase = await createClient()
    const { data: certificate } = await supabase
      .from("certifications")
      .select(`
        *,
        profiles!inner(full_name, email),
        modules!inner(title, description)
      `)
      .eq("certificate_hash", certificateHash)
      .single()

    return NextResponse.json({
      verified: true,
      message: verification.message,
      certificate: {
        ...certificate,
        blockchainData: {
          blockIndex: verification.block?.index,
          timestamp: verification.block?.timestamp,
          hash: verification.block?.hash,
          nonce: verification.block?.nonce
        }
      }
    })
  } catch (error) {
    console.error("Certificate verification error:", error)
    return NextResponse.json({ 
      verified: false,
      message: "Error during verification" 
    }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get all user certificates from blockchain
    const certificates = await CertificateBlockchain.getUserCertificates(userId)

    return NextResponse.json({
      certificates: certificates.map(block => ({
        hash: block.hash,
        blockIndex: block.index,
        timestamp: block.timestamp,
        data: block.certificateData
      }))
    })
  } catch (error) {
    console.error("Error fetching user certificates:", error)
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 })
  }
}
