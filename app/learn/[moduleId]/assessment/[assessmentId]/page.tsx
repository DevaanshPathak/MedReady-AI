import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import Link from "next/link"
import { AssessmentQuiz } from "@/components/assessment-quiz"

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ moduleId: string; assessmentId: string }>
}) {
  const { moduleId, assessmentId } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch assessment details
  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .select("*")
    .eq("id", assessmentId)
    .single()

  if (assessmentError || !assessment) {
    notFound()
  }

  // Fetch module details
  const { data: module } = await supabase.from("modules").select("title").eq("id", moduleId).single()

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="mb-4">
            <Link
              href={`/learn/${moduleId}`}
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
              Back to {module?.title}
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{assessment.title}</h1>
          <p className="mt-2 text-muted-foreground">
            {assessment.passing_score}% required to pass • {assessment.time_limit_minutes} minutes
          </p>
        </div>

        <AssessmentQuiz assessment={assessment} userId={user.id} moduleId={moduleId} />
      </main>
    </div>
  )
}
