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

    // Get gamification stats
    const { data: gamification, error } = await supabase
      .from("user_gamification")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching gamification:", error)
      return NextResponse.json(
        { error: "Failed to fetch gamification data" },
        { status: 500 }
      )
    }

    // If no gamification record exists, create one
    if (!gamification) {
      const { data: newGamification, error: createError } = await supabase
        .from("user_gamification")
        .insert({
          user_id: user.id,
          total_points: 0,
          level: 1,
          experience_points: 0,
          next_level_points: 100,
          badges_earned: 0,
          rank: "Beginner",
        })
        .select()
        .single()

      if (createError) {
        console.error("Error creating gamification:", createError)
        return NextResponse.json(
          { error: "Failed to create gamification record" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        gamification: newGamification,
        achievements: [],
        allAchievements: [],
      })
    }

    // Get user's earned achievements
    const { data: earnedAchievements } = await supabase
      .from("user_achievements")
      .select("*, achievements(*)")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false })

    // Get all available achievements
    const { data: allAchievements } = await supabase
      .from("achievements")
      .select("*")
      .order("points", { ascending: false })

    return NextResponse.json({
      gamification,
      achievements: earnedAchievements || [],
      allAchievements: allAchievements || [],
    })
  } catch (error) {
    console.error("Error in gamification API:", error)
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
    const { action, points, reason } = body

    if (action === "award_points") {
      // Award points using database function
      const { data, error } = await supabase.rpc("award_points", {
        p_user_id: user.id,
        p_points: points || 0,
        p_reason: reason || null,
      })

      if (error) {
        console.error("Error awarding points:", error)
        return NextResponse.json(
          { error: "Failed to award points" },
          { status: 500 }
        )
      }

      // Check for new achievements
      await supabase.rpc("check_achievements", {
        p_user_id: user.id,
      })

      return NextResponse.json({
        success: true,
        result: data,
      })
    }

    if (action === "check_achievements") {
      // Check and award achievements
      const { error } = await supabase.rpc("check_achievements", {
        p_user_id: user.id,
      })

      if (error) {
        console.error("Error checking achievements:", error)
        return NextResponse.json(
          { error: "Failed to check achievements" },
          { status: 500 }
        )
      }

      // Get newly earned achievements
      const { data: newAchievements } = await supabase
        .from("user_achievements")
        .select("*, achievements(*)")
        .eq("user_id", user.id)
        .gte("earned_at", new Date(Date.now() - 60000).toISOString()) // Last minute
        .order("earned_at", { ascending: false })

      return NextResponse.json({
        success: true,
        newAchievements: newAchievements || [],
      })
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error in gamification POST API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

