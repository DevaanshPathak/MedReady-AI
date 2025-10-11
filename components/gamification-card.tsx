"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, Star, Award, TrendingUp, Zap } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface GamificationData {
  total_points: number
  level: number
  experience_points: number
  next_level_points: number
  badges_earned: number
  rank: string
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  points: number
  category: string
  earned_at?: string
}

interface UserAchievement {
  achievements: Achievement
  earned_at: string
}

export function GamificationCard() {
  const [gamification, setGamification] = useState<GamificationData | null>(null)
  const [earnedAchievements, setEarnedAchievements] = useState<UserAchievement[]>([])
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGamification()
  }, [])

  const loadGamification = async () => {
    try {
      const response = await fetch("/api/gamification")
      if (response.ok) {
        const data = await response.json()
        setGamification(data.gamification)
        setEarnedAchievements(data.achievements || [])
        setAllAchievements(data.allAchievements || [])
      }
    } catch (error) {
      console.error("Failed to load gamification:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (!gamification) {
    return null
  }

  const progressPercentage = (gamification.experience_points / gamification.next_level_points) * 100
  const earnedAchievementIds = new Set(earnedAchievements.map(ea => ea.achievements.id))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Your Progress
            </CardTitle>
            <CardDescription>Level up by learning more</CardDescription>
          </div>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            <Star className="h-4 w-4 mr-1" />
            Level {gamification.level}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="achievements">
              Achievements ({earnedAchievements.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-4">
            {/* Rank Badge */}
            <div className="text-center p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10">
              <div className="text-2xl font-bold">{gamification.rank}</div>
              <div className="text-sm text-muted-foreground">Current Rank</div>
            </div>

            {/* Level Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Level {gamification.level} Progress</span>
                <span className="font-medium">
                  {gamification.experience_points} / {gamification.next_level_points} XP
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <p className="text-xs text-muted-foreground text-center">
                {gamification.next_level_points - gamification.experience_points} XP to level {gamification.level + 1}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Total Points</span>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {gamification.total_points.toLocaleString()}
                </div>
              </div>

              <div className="p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="h-4 w-4 text-accent" />
                  <span className="text-xs text-muted-foreground">Badges</span>
                </div>
                <div className="text-2xl font-bold text-accent">
                  {gamification.badges_earned}
                </div>
              </div>
            </div>

            {/* Level Milestones */}
            <div className="space-y-2">
              <div className="text-xs font-medium flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Next Milestones
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Level 5: Intermediate</span>
                  <span>{gamification.level >= 5 ? "✓" : `Level ${gamification.level}/5`}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Level 10: Advanced</span>
                  <span>{gamification.level >= 10 ? "✓" : `Level ${gamification.level}/10`}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Level 20: Professional</span>
                  <span>{gamification.level >= 20 ? "✓" : `Level ${gamification.level}/20`}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-3">
            {earnedAchievements.length === 0 ? (
              <div className="text-center py-8">
                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">
                  No achievements yet. Keep learning to earn badges!
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {earnedAchievements.map((ua) => (
                  <div
                    key={ua.achievements.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="text-2xl">{ua.achievements.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{ua.achievements.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          +{ua.achievements.points}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ua.achievements.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Earned {new Date(ua.earned_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Locked Achievements */}
            {allAchievements.length > earnedAchievements.length && (
              <div className="mt-4">
                <div className="text-xs font-medium mb-2 text-muted-foreground">
                  Locked Achievements ({allAchievements.length - earnedAchievements.length})
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {allAchievements
                    .filter(a => !earnedAchievementIds.has(a.id))
                    .slice(0, 5)
                    .map((achievement) => (
                      <div
                        key={achievement.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 opacity-60"
                      >
                        <div className="text-2xl grayscale">{achievement.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">{achievement.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              +{achievement.points}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

