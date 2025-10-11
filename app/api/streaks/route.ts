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

    // Get streak data
    const { data: streak, error } = await supabase
      .from("study_streaks")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching streak:", error)
      return NextResponse.json(
        { error: "Failed to fetch streak data" },
        { status: 500 }
      )
    }

    // If no streak exists, create one
    if (!streak) {
      const { data: newStreak, error: createError } = await supabase
        .from("study_streaks")
        .insert({
          user_id: user.id,
          current_streak: 0,
          longest_streak: 0,
          total_study_days: 0,
        })
        .select()
        .single()

      if (createError) {
        console.error("Error creating streak:", createError)
        return NextResponse.json(
          { error: "Failed to create streak" },
          { status: 500 }
        )
      }

      return NextResponse.json({ streak: newStreak })
    }

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from("daily_activities")
      .select("*")
      .eq("user_id", user.id)
      .order("activity_date", { ascending: false })
      .limit(30)

    return NextResponse.json({
      streak,
      recentActivity: recentActivity || [],
    })
  } catch (error) {
    console.error("Error in streaks API:", error)
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

    // Update streak using database function
    const { error } = await supabase.rpc("update_study_streak", {
      p_user_id: user.id,
    })

    if (error) {
      console.error("Error updating streak:", error)
      return NextResponse.json(
        { error: "Failed to update streak" },
        { status: 500 }
      )
    }

    // Get updated streak data
    const { data: streak } = await supabase
      .from("study_streaks")
      .select("*")
      .eq("user_id", user.id)
      .single()

    // Check for achievements
    await supabase.rpc("check_achievements", {
      p_user_id: user.id,
    })

    return NextResponse.json({
      success: true,
      streak,
    })
  } catch (error) {
    console.error("Error in streaks POST API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

