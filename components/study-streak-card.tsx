"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flame, Calendar, Trophy, TrendingUp } from "lucide-react"

interface StreakData {
  current_streak: number
  longest_streak: number
  total_study_days: number
  last_activity_date: string
}

interface DailyActivity {
  activity_date: string
  activities_completed: number
  points_earned: number
}

export function StudyStreakCard() {
  const [streak, setStreak] = useState<StreakData | null>(null)
  const [recentActivity, setRecentActivity] = useState<DailyActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStreak()
  }, [])

  const loadStreak = async () => {
    try {
      const response = await fetch("/api/streaks")
      if (response.ok) {
        const data = await response.json()
        setStreak(data.streak)
        setRecentActivity(data.recentActivity || [])
      }
    } catch (error) {
      console.error("Failed to load streak:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStreakMessage = (currentStreak: number) => {
    if (currentStreak === 0) return "Start your streak today!"
    if (currentStreak === 1) return "Keep it up!"
    if (currentStreak < 7) return "Great progress!"
    if (currentStreak < 30) return "You're on fire! 🔥"
    if (currentStreak < 100) return "Incredible dedication! ⭐"
    return "Legendary streak! 👑"
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Study Streak</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-24 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (!streak) {
    return null
  }

  const isActiveToday = streak.last_activity_date === new Date().toISOString().split("T")[0]

  return (
    <Card className={isActiveToday ? "border-primary" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Flame className={`h-5 w-5 ${streak.current_streak > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
              Study Streak
            </CardTitle>
            <CardDescription>{getStreakMessage(streak.current_streak)}</CardDescription>
          </div>
          {streak.current_streak >= 7 && (
            <Badge variant="secondary" className="gap-1">
              <Trophy className="h-3 w-3" />
              Week+
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1 text-center p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center">
              <Flame className="h-4 w-4 text-orange-500 mr-1" />
              <div className="text-2xl font-bold text-orange-500">
                {streak.current_streak}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">Current Streak</div>
          </div>

          <div className="space-y-1 text-center p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center">
              <Trophy className="h-4 w-4 text-primary mr-1" />
              <div className="text-2xl font-bold text-primary">
                {streak.longest_streak}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">Best Streak</div>
          </div>

          <div className="space-y-1 text-center p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center">
              <Calendar className="h-4 w-4 text-accent mr-1" />
              <div className="text-2xl font-bold text-accent">
                {streak.total_study_days}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">Total Days</div>
          </div>
        </div>

        {/* Activity calendar visualization */}
        {recentActivity.length > 0 && (
          <div className="mt-4">
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Last 30 days
            </div>
            <div className="grid grid-cols-10 gap-1">
              {recentActivity.slice(0, 30).map((activity, index) => {
                const isToday = activity.activity_date === new Date().toISOString().split("T")[0]
                const hasActivity = activity.activities_completed > 0
                
                return (
                  <div
                    key={index}
                    className={`h-6 w-full rounded-sm ${
                      isToday
                        ? "border-2 border-primary"
                        : hasActivity
                          ? "bg-primary"
                          : "bg-muted"
                    }`}
                    title={`${activity.activity_date}: ${activity.activities_completed} activities`}
                  />
                )
              })}
            </div>
          </div>
        )}

        {!isActiveToday && streak.current_streak > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 text-center">
            <p className="text-sm text-orange-700 dark:text-orange-400">
              Study today to continue your {streak.current_streak}-day streak! 🔥
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

