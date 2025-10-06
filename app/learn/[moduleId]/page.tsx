import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ModuleContent } from "@/components/module-content"

export default async function ModulePage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch module details
  const { data: module, error: moduleError } = await supabase.from("modules").select("*").eq("id", moduleId).single()

  if (moduleError || !module) {
    notFound()
  }

  // Fetch or create user progress
  let { data: progress } = await supabase
    .from("progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("module_id", moduleId)
    .single()

  if (!progress) {
    const { data: newProgress } = await supabase
      .from("progress")
      .insert({
        user_id: user.id,
        module_id: moduleId,
        completion_percent: 0,
        current_section: 0,
      })
      .select()
      .single()
    progress = newProgress
  }

  // Fetch assessments for this module
  const { data: assessments } = await supabase
    .from("assessments")
    .select("*")
    .eq("module_id", moduleId)
    .order("created_at", { ascending: true })

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto px-4 py-8">
        {/* Module Header */}
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
              Back to Modules
            </Link>
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant={module.difficulty === "beginner" ? "secondary" : "default"}>{module.difficulty}</Badge>
                {module.estimated_hours && (
                  <Badge variant="outline">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-1 h-3 w-3"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {module.estimated_hours} hours
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{module.title}</h1>
              <p className="mt-2 text-muted-foreground">{module.description}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <ModuleContent module={module} progress={progress} userId={user.id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Learning Objectives */}
            {module.learning_objectives && (
              <Card>
                <CardHeader>
                  <CardTitle>Learning Objectives</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {(module.learning_objectives as string[]).map((objective, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Assessments */}
            {assessments && assessments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Assessments</CardTitle>
                  <CardDescription>Test your knowledge</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {assessments.map((assessment) => (
                    <div key={assessment.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex-1">
                        <p className="font-medium">{assessment.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {assessment.passing_score}% to pass • {assessment.time_limit_minutes} min
                        </p>
                      </div>
                      <Button asChild size="sm">
                        <Link href={`/learn/${moduleId}/assessment/${assessment.id}`}>Start</Link>
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Resources */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="#" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                  </svg>
                  Download Study Guide (PDF)
                </Link>
                <Link href="#" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  Contact Instructor
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
