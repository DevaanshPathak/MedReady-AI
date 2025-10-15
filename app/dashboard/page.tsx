import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/reveal"
import { WeakAreasCard } from "@/components/weak-areas-card"
import { RecommendationsCard } from "@/components/recommendations-card"
import { StudyStreakCard } from "@/components/study-streak-card"
import { GamificationCard } from "@/components/gamification-card"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch user progress
  const { data: progressData } = await supabase
    .from("progress")
    .select("*, modules(*)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(3)

  // Fetch emergency alerts
  const { data: alerts } = await supabase
    .from("emergency_alerts")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(3)

  // Fetch recent assessment attempts
  const { data: recentAttempts } = await supabase
    .from("assessment_attempts")
    .select("*, assessment:assessments(title)")
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false })
    .limit(3)

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <Reveal as="h1" className="text-2xl sm:text-3xl font-bold tracking-tight" variant="down">
            Welcome back, {profile?.full_name || "Healthcare Worker"}
          </Reveal>
          <Reveal as="p" className="text-sm sm:text-base text-muted-foreground mt-1" delay="xs">
            Continue your learning journey and track your progress
          </Reveal>
        </div>

        {/* Emergency Alerts */}
        {alerts && alerts.length > 0 && (
          <div className="mb-6 sm:mb-8 space-y-2 sm:space-y-3">
            {alerts.map((alert, index) => (
              <Reveal
                key={alert.id}
                delay={index === 0 ? "none" : index === 1 ? "xs" : "sm"}
                variant="left"
              >
                <div
                  className={cn(
                    "rounded-lg border p-3 sm:p-4",
                    alert.severity === "critical" && "border-destructive bg-destructive/10",
                    alert.severity === "warning" && "border-[hsl(var(--alert-orange))] bg-[hsl(var(--alert-orange))]/10",
                    alert.severity === "info" && "border-primary bg-primary/10",
                  )}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                  <div className="mt-0.5">
                    {alert.severity === "critical" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 sm:h-5 sm:w-5 text-destructive flex-shrink-0"
                      >
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                        <path d="M12 9v4" />
                        <path d="M12 17h.01" />
                      </svg>
                    )}
                    {alert.severity === "warning" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 sm:h-5 sm:w-5 text-[hsl(var(--alert-orange))] flex-shrink-0"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4" />
                        <path d="M12 16h.01" />
                      </svg>
                    )}
                    {alert.severity === "info" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold">{alert.title}</h3>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{alert.description}</p>
                    {alert.action_required && (
                      <p className="mt-2 text-xs sm:text-sm font-medium">Action Required: {alert.action_required}</p>
                    )}
                  </div>
                </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}

        {/* Gamification and Streaks Row */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 mb-6 sm:mb-8">
          <Reveal delay="none">
            <StudyStreakCard />
          </Reveal>
          <Reveal delay="xs">
            <GamificationCard />
          </Reveal>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Reveal delay="none">
            <Card>
            <CardHeader>
              <CardTitle>Learning Progress</CardTitle>
              <CardDescription>Your overall completion rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl sm:text-4xl font-bold text-primary">
                {progressData && progressData.length > 0
                  ? Math.round(progressData.reduce((acc, p) => acc + p.completion_percent, 0) / progressData.length)
                  : 0}
                %
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{progressData?.length || 0} modules in progress</p>
            </CardContent>
          </Card>
          </Reveal>

          <Reveal delay="xs">
            <Card>
            <CardHeader>
              <CardTitle>Certifications</CardTitle>
              <CardDescription>Earned credentials</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl sm:text-4xl font-bold text-accent">0</div>
              <p className="mt-2 text-sm text-muted-foreground">Complete modules to earn certificates</p>
            </CardContent>
          </Card>
          </Reveal>

          <Reveal delay="sm">
            <Card>
            <CardHeader>
              <CardTitle>Recent Assessments</CardTitle>
              <CardDescription>Your latest quiz attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl sm:text-4xl font-bold text-accent">{recentAttempts?.length || 0}</div>
              <p className="mt-2 text-sm text-muted-foreground">
                {recentAttempts && recentAttempts.length > 0 ? (
                  <Link href="/learn/history" className="text-primary hover:underline">
                    View history →
                  </Link>
                ) : (
                  "Take your first assessment"
                )}
              </p>
            </CardContent>
          </Card>
          </Reveal>
        </div>

        {/* Weak Areas and Recommendations Row */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 mt-6 sm:mt-8">
          <Reveal delay="md">
            <WeakAreasCard />
          </Reveal>
          <Reveal delay="md">
            <RecommendationsCard />
          </Reveal>
        </div>

        {/* Continue Learning */}
        <div className="mt-6 sm:mt-8">
          <Reveal className="mb-4 flex items-center justify-between gap-2" delay="md">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Continue Learning</h2>
            <Button asChild variant="outline" size="sm" className="flex-shrink-0">
              <Link href="/learn" className="text-xs sm:text-sm">View All</Link>
            </Button>
          </Reveal>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {progressData && progressData.length > 0 ? (
              progressData.map((progress, index) => (
                <Reveal
                  key={progress.id}
                  delay={index === 0 ? "none" : index === 1 ? "xs" : "sm"}
                >
                  <Card>
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{progress.modules?.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{progress.modules?.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{progress.completion_percent}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${progress.completion_percent}%` }}
                        />
                      </div>
                      <Button asChild className="mt-4 w-full">
                        <Link href={`/learn/${progress.module_id}`}>Continue</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                </Reveal>
              ))
            ) : (
              <Reveal delay="none">
                <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mb-4 h-12 w-12 text-muted-foreground"
                  >
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                  </svg>
                  <h3 className="mb-2 text-lg font-semibold">No modules started yet</h3>
                  <p className="mb-4 text-center text-sm text-muted-foreground">
                    Start your learning journey by exploring available modules
                  </p>
                  <Button asChild>
                    <Link href="/learn">Browse Modules</Link>
                  </Button>
                </CardContent>
              </Card>
              </Reveal>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function cn(...inputs: (string | boolean | undefined)[]) {
  return inputs.filter(Boolean).join(" ")
}
