import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch latest knowledge base updates
    const { data: updates, error } = await supabase
      .from("knowledge_updates")
      .select("*")
      .eq("is_active", true)
      .order("published_at", { ascending: false })
      .limit(20)

    if (error) throw error

    return NextResponse.json({
      updates: updates || [],
      lastSync: new Date().toISOString(),
      totalUpdates: updates?.length || 0,
    })
  } catch (error) {
    console.error("[v0] Knowledge sync error:", error)
    return NextResponse.json({ error: "Failed to sync knowledge base" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { category, searchQuery } = await req.json()

    // Search knowledge base
    let query = supabase.from("knowledge_updates").select("*").eq("is_active", true)

    if (category && category !== "all") {
      query = query.eq("category", category)
    }

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
    }

    const { data: results, error } = await query.order("published_at", { ascending: false }).limit(50)

    if (error) throw error

    return NextResponse.json({
      results: results || [],
      count: results?.length || 0,
    })
  } catch (error) {
    console.error("[v0] Knowledge search error:", error)
    return NextResponse.json({ error: "Failed to search knowledge base" }, { status: 500 })
  }
}
