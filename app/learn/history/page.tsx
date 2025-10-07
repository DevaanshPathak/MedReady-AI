import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Reveal } from "@/components/reveal"
import Link from "next/link"

export default async function AssessmentHistoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch user's assessment attempts with related assessment and module data
  const { data: attempts } = await supabase
    .from("assessment_attempts")
    .select(`
      *,
      assessment:assessments (
        id,
        title,
        module_id,
        passing_score,
        questions
      )
    `)
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false })

  // Fetch module details for each assessment
  const moduleIds = [...new Set(attempts?.map((a: any) => a.assessment?.module_id).filter(Boolean))]
  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, category")
    .in("id", moduleIds)

  const moduleMap = new Map(modules?.map((m) => [m.id, m]) || [])

  // Calculate statistics
  const totalAttempts = attempts?.length || 0
  const passedAttempts = attempts?.filter((a: any) => a.passed).length || 0
  const averageScore = totalAttempts > 0 
    ? Math.round(attempts!.reduce((sum: number, a: any) => sum + a.score, 0) / totalAttempts)
    : 0

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="mb-4">
            <Link
              href="/learn"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-4 w-4"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              Back to Learning Modules
            </Link>
          </div>
          <Reveal as="h1" className="text-3xl font-bold tracking-tight" variant="down">
            Assessment History
          </Reveal>
          <Reveal as="p" className="text-muted-foreground" delay="xs">
            View your past quiz attempts and track your progress
          </Reveal>
        </div>

        {/* Statistics Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Reveal variant="up">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Attempts</CardDescription>
                <CardTitle className="text-3xl">{totalAttempts}</CardTitle>
              </CardHeader>
            </Card>
          </Reveal>
          <Reveal variant="up" delay="xs">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Passed Assessments</CardDescription>
                <CardTitle className="text-3xl">{passedAttempts}</CardTitle>
              </CardHeader>
            </Card>
          </Reveal>
          <Reveal variant="up" delay="sm">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Average Score</CardDescription>
                <CardTitle className="text-3xl">{averageScore}%</CardTitle>
              </CardHeader>
            </Card>
          </Reveal>
        </div>

        {/* Assessment Attempts List */}
        {!attempts || attempts.length === 0 ? (
          <Reveal variant="scale">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mb-4 h-16 w-16 text-muted-foreground"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <h3 className="mb-2 text-lg font-semibold">No Assessment History</h3>
                <p className="mb-4 text-center text-sm text-muted-foreground">
                  You haven't taken any assessments yet. Start learning to unlock quizzes!
                </p>
                <Button asChild>
                  <Link href="/learn">Browse Modules</Link>
                </Button>
              </CardContent>
            </Card>
          </Reveal>
        ) : (
          <div className="space-y-4">
            {attempts.map((attempt: any, index: number) => {
              const assessment = attempt.assessment
              const module = assessment?.module_id ? moduleMap.get(assessment.module_id) : null
              const delayMap = ["none", "xs", "sm", "md", "lg", "xl"] as const
              const delay = delayMap[index % 6]

              return (
                <Reveal key={attempt.id} variant="left" delay={delay}>
                  <Card className={attempt.passed ? "border-green-500/20" : "border-border"}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="mb-1">{assessment?.title || "Assessment"}</CardTitle>
                          {module && (
                            <CardDescription className="mb-2">
                              {module.title} • {module.category}
                            </CardDescription>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <Badge variant={attempt.passed ? "default" : "destructive"}>
                              {attempt.passed ? "Passed" : "Failed"}
                            </Badge>
                            <Badge variant="outline">
                              Score: {attempt.score}% / {assessment?.passing_score || 70}%
                            </Badge>
                            {attempt.time_taken && (
                              <Badge variant="secondary">
                                Time: {Math.floor(attempt.time_taken / 60)}:{(attempt.time_taken % 60).toString().padStart(2, "0")}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <time className="text-sm text-muted-foreground">
                          {new Date(attempt.completed_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/learn/history/${attempt.id}`}>View Details</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </Reveal>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
