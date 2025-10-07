import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Reveal } from "@/components/reveal"
import Link from "next/link"

interface Question {
  question: string
  options: string[]
  correct_answer: number
}

export default async function AttemptDetailPage({
  params,
}: {
  params: Promise<{ attemptId: string }>
}) {
  const { attemptId } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch attempt details with assessment and module info
  const { data: attempt, error: attemptError } = await supabase
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
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .single()

  if (attemptError || !attempt) {
    notFound()
  }

  // Fetch module details
  const { data: module } = await supabase
    .from("modules")
    .select("id, title, category")
    .eq("id", attempt.assessment.module_id)
    .single()

  // Parse questions and user answers
  const questions = Array.isArray(attempt.assessment.questions) 
    ? (attempt.assessment.questions as Question[])
    : []
  const userAnswers = attempt.answers as Record<string, number>

  // Calculate correct/incorrect counts
  let correctCount = 0
  let incorrectCount = 0
  questions.forEach((q, index) => {
    if (userAnswers[index] === q.correct_answer) {
      correctCount++
    } else {
      incorrectCount++
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto max-w-4xl px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-8">
          <div className="mb-4">
            <Link
              href="/learn/history"
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
              Back to History
            </Link>
          </div>
          <Reveal as="h1" className="text-3xl font-bold tracking-tight" variant="down">
            {attempt.assessment.title}
          </Reveal>
          <Reveal as="p" className="text-muted-foreground" delay="xs">
            {module?.title} • {module?.category}
          </Reveal>
        </div>

        {/* Results Summary */}
        <Reveal variant="up">
          <Card className={attempt.passed ? "mb-8 border-green-500/20" : "mb-8"}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Assessment Results</CardTitle>
                  <CardDescription>
                    Completed on{" "}
                    {new Date(attempt.completed_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </CardDescription>
                </div>
                <Badge variant={attempt.passed ? "default" : "destructive"} className="text-lg px-4 py-2">
                  {attempt.passed ? "Passed" : "Failed"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">Score</p>
                  <p className="text-2xl font-bold">{attempt.score}%</p>
                </div>
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">Passing Score</p>
                  <p className="text-2xl font-bold">{attempt.assessment.passing_score}%</p>
                </div>
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">Correct</p>
                  <p className="text-2xl font-bold text-green-600">{correctCount}</p>
                </div>
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">Incorrect</p>
                  <p className="text-2xl font-bold text-red-600">{incorrectCount}</p>
                </div>
              </div>
              {attempt.time_taken && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Time taken: {Math.floor(attempt.time_taken / 60)} minutes {attempt.time_taken % 60} seconds
                </p>
              )}
            </CardContent>
          </Card>
        </Reveal>

        {/* Question Review */}
        <div className="space-y-6">
          <Reveal variant="left" delay="sm">
            <h2 className="text-2xl font-bold">Question Review</h2>
            <p className="text-sm text-muted-foreground">
              Review your answers and see the correct solutions
            </p>
          </Reveal>

          {questions.map((question, index) => {
            const userAnswer = userAnswers[index]
            const isCorrect = userAnswer === question.correct_answer
            const delayMap = ["md", "lg", "xl", "none", "xs", "sm"] as const
            const delay = delayMap[index % 6]

            return (
              <Reveal key={index} variant="up" delay={delay}>
                <Card className={isCorrect ? "border-green-500/20" : "border-red-500/20"}>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {isCorrect ? (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-6 w-6 text-green-600"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-6 w-6 text-red-600"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <path d="m15 9-6 6" />
                              <path d="m9 9 6 6" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="mb-2 flex items-start justify-between">
                          <CardTitle className="text-base font-medium">Question {index + 1}</CardTitle>
                          <Badge variant={isCorrect ? "default" : "destructive"}>
                            {isCorrect ? "Correct" : "Incorrect"}
                          </Badge>
                        </div>
                        <p className="leading-relaxed">{question.question}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => {
                        const isUserAnswer = userAnswer === optionIndex
                        const isCorrectAnswer = question.correct_answer === optionIndex

                        let bgColor = "bg-background"
                        let borderColor = "border-border"
                        let textColor = "text-foreground"

                        if (isCorrectAnswer) {
                          bgColor = "bg-green-500/5"
                          borderColor = "border-green-500/30"
                          textColor = "text-green-700 dark:text-green-400"
                        } else if (isUserAnswer && !isCorrect) {
                          bgColor = "bg-red-500/5"
                          borderColor = "border-red-500/30"
                          textColor = "text-red-700 dark:text-red-400"
                        }

                        return (
                          <div
                            key={optionIndex}
                            className={`flex items-start gap-3 rounded-lg border p-3 ${bgColor} ${borderColor}`}
                          >
                            <div className="flex-shrink-0 pt-0.5">
                              {isCorrectAnswer ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-5 w-5 text-green-600"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              ) : isUserAnswer ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-5 w-5 text-red-600"
                                >
                                  <circle cx="12" cy="12" r="10" />
                                  <path d="m15 9-6 6" />
                                  <path d="m9 9 6 6" />
                                </svg>
                              ) : (
                                <div className="h-5 w-5" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className={`leading-relaxed ${textColor}`}>{option}</p>
                              {isCorrectAnswer && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  Correct Answer
                                </Badge>
                              )}
                              {isUserAnswer && !isCorrect && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  Your Answer
                                </Badge>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            )
          })}
        </div>

        {/* Action Buttons */}
        <Reveal variant="up" delay="md">
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/learn/history">Back to History</Link>
            </Button>
            {module && (
              <Button asChild className="flex-1">
                <Link href={`/learn/${module.id}`}>View Module</Link>
              </Button>
            )}
          </div>
        </Reveal>
      </main>
    </div>
  )
}
