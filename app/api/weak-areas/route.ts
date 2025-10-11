import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Analyze weak areas using the database function
    const { data: weakAreas, error } = await supabase.rpc("analyze_weak_areas", {
      p_user_id: user.id,
    })

    if (error) {
      console.error("Error analyzing weak areas:", error)
      return NextResponse.json(
        { error: "Failed to analyze weak areas" },
        { status: 500 }
      )
    }

    // Store/update weak areas in the database
    if (weakAreas && weakAreas.length > 0) {
      for (const area of weakAreas) {
        await supabase
          .from("weak_areas")
          .upsert({
            user_id: user.id,
            category: area.category,
            topic: area.topic,
            attempts: area.attempts,
            correct_answers: Math.round((area.accuracy * area.attempts) / 100),
            accuracy_percentage: area.accuracy,
            priority: area.priority,
            last_attempt_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("category", area.category)
          .eq("topic", area.topic)
      }
    }

    return NextResponse.json({
      weakAreas: weakAreas || [],
      count: weakAreas?.length || 0,
    })
  } catch (error) {
    console.error("Error in weak areas API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { category, topic, accuracy } = body

    // Update specific weak area
    const { data, error } = await supabase
      .from("weak_areas")
      .upsert({
        user_id: user.id,
        category,
        topic,
        accuracy_percentage: accuracy,
        last_attempt_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("category", category)
      .eq("topic", topic)
      .select()

    if (error) {
      console.error("Error updating weak area:", error)
      return NextResponse.json(
        { error: "Failed to update weak area" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in weak areas POST API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

