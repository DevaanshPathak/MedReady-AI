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

    // Get weak areas
    const { data: weakAreas } = await supabase
      .from("weak_areas")
      .select("*")
      .eq("user_id", user.id)
      .order("priority", { ascending: false })
      .order("accuracy_percentage", { ascending: true })
      .limit(5)

    // Get completed modules
    const { data: completedModules } = await supabase
      .from("progress")
      .select("module_id")
      .eq("user_id", user.id)
      .eq("status", "completed")

    const completedModuleIds = completedModules?.map(m => m.module_id) || []

    // Get all available modules
    const { data: allModules } = await supabase
      .from("modules")
      .select("*")
      .order("difficulty_level", { ascending: true })

    // Generate personalized recommendations
    const recommendations = []

    // 1. Recommendations for weak areas (highest priority)
    if (weakAreas && weakAreas.length > 0) {
      for (const weakArea of weakAreas.slice(0, 3)) {
        const relatedModule = allModules?.find(
          m => m.category === weakArea.category && m.title === weakArea.topic
        )

        if (relatedModule) {
          recommendations.push({
            user_id: user.id,
            recommendation_type: "weak_area",
            title: `Improve ${weakArea.topic}`,
            description: `You've scored ${weakArea.accuracy_percentage}% in this area. Let's work on improving it!`,
            module_id: relatedModule.id,
            priority: weakArea.priority === "high" ? 10 : weakArea.priority === "medium" ? 7 : 5,
            reason: `Low accuracy (${weakArea.accuracy_percentage}%) based on ${weakArea.attempts} attempts`,
          })
        }
      }
    }

    // 2. Next recommended topics (based on completed modules)
    const incompletedModules = allModules?.filter(
      m => !completedModuleIds.includes(m.id)
    ) || []

    if (incompletedModules.length > 0) {
      // Recommend beginner/intermediate level modules first
      const nextModules = incompletedModules
        .filter(m => m.difficulty_level === "beginner" || m.difficulty_level === "intermediate")
        .slice(0, 2)

      for (const module of nextModules) {
        recommendations.push({
          user_id: user.id,
          recommendation_type: "next_topic",
          title: `Start ${module.title}`,
          description: module.description || "Expand your knowledge in this area",
          module_id: module.id,
          priority: 6,
          reason: "Recommended based on your learning path",
        })
      }
    }

    // 3. Review recommendations (modules completed but with low scores)
    const { data: lowScoreModules } = await supabase
      .from("progress")
      .select("module_id, score, modules(*)")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .lt("score", 80)
      .order("score", { ascending: true })
      .limit(2)

    if (lowScoreModules && lowScoreModules.length > 0) {
      for (const progress of lowScoreModules) {
        const progressModule: any = (progress as any).modules
        const progressModuleTitle = Array.isArray(progressModule)
          ? progressModule[0]?.title
          : progressModule?.title
        recommendations.push({
          user_id: user.id,
          recommendation_type: "review",
          title: `Review ${progressModuleTitle}`,
          description: `Your score was ${progress.score}%. A review might help solidify your knowledge.`,
          module_id: progress.module_id,
          priority: 7,
          reason: `Previous score: ${progress.score}%`,
        })
      }
    }

    // 4. Spaced repetition recommendations
    const { data: dueReviews } = await supabase
      .from("spaced_repetition")
      .select("module_id, modules(*)")
      .eq("user_id", user.id)
      .lte("next_review_date", new Date().toISOString())
      .limit(3)

    if (dueReviews && dueReviews.length > 0) {
      const uniqueModules = Array.from(
        new Map(dueReviews.map(item => [item.module_id, item])).values()
      )

      for (const review of uniqueModules) {
        const reviewModule: any = (review as any).modules
        const reviewModuleTitle = Array.isArray(reviewModule)
          ? reviewModule[0]?.title
          : reviewModule?.title
        if (reviewModule) {
          recommendations.push({
            user_id: user.id,
            recommendation_type: "review",
            title: `Review Questions: ${reviewModuleTitle}`,
            description: "You have questions due for review based on spaced repetition",
            module_id: review.module_id,
            priority: 8,
            reason: "Spaced repetition review due",
          })
        }
      }
    }

    // Sort by priority (highest first)
    recommendations.sort((a, b) => b.priority - a.priority)

    // Store recommendations in database (upsert to avoid duplicates)
    if (recommendations.length > 0) {
      // Delete old recommendations first
      await supabase
        .from("recommendations")
        .delete()
        .eq("user_id", user.id)
        .lt("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // older than 7 days

      // Insert new recommendations
      const { error: insertError } = await supabase
        .from("recommendations")
        .upsert(
          recommendations.map(rec => ({
            ...rec,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          })),
          { onConflict: "user_id,module_id,recommendation_type" }
        )

      if (insertError) {
        console.error("Error storing recommendations:", insertError)
      }
    }

    return NextResponse.json({
      recommendations: recommendations.slice(0, 10), // Top 10 recommendations
      count: recommendations.length,
    })
  } catch (error) {
    console.error("Error in recommendations API:", error)
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
    const { recommendationId, isCompleted } = body

    // Mark recommendation as completed
    const { data, error } = await supabase
      .from("recommendations")
      .update({
        is_completed: isCompleted,
        updated_at: new Date().toISOString(),
      })
      .eq("id", recommendationId)
      .eq("user_id", user.id)
      .select()

    if (error) {
      console.error("Error updating recommendation:", error)
      return NextResponse.json(
        { error: "Failed to update recommendation" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in recommendations POST API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

