"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Question {
  question: string
  options: string[]
  correct_answer: number
}

interface AssessmentQuizProps {
  assessment: {
    id: string
    title: string
    questions: unknown
    passing_score: number
    time_limit_minutes: number
  }
  userId: string
  moduleId: string
}

export function AssessmentQuiz({ assessment, userId, moduleId }: AssessmentQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [timeRemaining, setTimeRemaining] = useState(assessment.time_limit_minutes * 60)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  const questions = Array.isArray(assessment.questions) ? (assessment.questions as Question[]) : []
  const totalQuestions = questions.length

  // Timer
  useEffect(() => {
    if (showResults) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [showResults])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: answerIndex }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    // Calculate score
    let correctAnswers = 0
    questions.forEach((question, index) => {
      if (answers[index] === question.correct_answer) {
        correctAnswers++
      }
    })

    const finalScore = Math.round((correctAnswers / totalQuestions) * 100)
    setScore(finalScore)

    // Save result to database
    try {
      await supabase.from("assessment_results").insert({
        user_id: userId,
        assessment_id: assessment.id,
        score: finalScore,
        passed: finalScore >= assessment.passing_score,
        answers: answers,
        time_taken: assessment.time_limit_minutes * 60 - timeRemaining,
      })

      setShowResults(true)
    } catch (error) {
      console.error("[v0] Error saving assessment result:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <h3 className="mb-2 text-lg font-semibold">No questions available</h3>
          <p className="text-center text-sm text-muted-foreground">This assessment is being prepared.</p>
        </CardContent>
      </Card>
    )
  }

  if (showResults) {
    const passed = score >= assessment.passing_score

    return (
      <Card>
        <CardHeader>
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
            {passed ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-10 w-10 text-accent"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-10 w-10 text-destructive"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m15 9-6 6" />
                <path d="m9 9 6 6" />
              </svg>
            )}
          </div>
          <CardTitle className="text-center text-2xl">{passed ? "Congratulations!" : "Keep Learning"}</CardTitle>
          <CardDescription className="text-center">
            {passed ? "You've successfully passed this assessment" : "You didn't pass this time, but you can try again"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted p-6 text-center">
            <div className="text-4xl font-bold">{score}%</div>
            <p className="mt-2 text-sm text-muted-foreground">
              {Object.keys(answers).length} of {totalQuestions} questions answered correctly
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Passing score: {assessment.passing_score}%</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="flex-1" variant={passed ? "default" : "outline"}>
              <a href={`/learn/${moduleId}`}>Back to Module</a>
            </Button>
            {!passed && (
              <Button
                className="flex-1"
                onClick={() => {
                  setShowResults(false)
                  setCurrentQuestion(0)
                  setAnswers({})
                  setTimeRemaining(assessment.time_limit_minutes * 60)
                }}
              >
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentQ = questions[currentQuestion]

  return (
    <div className="space-y-6">
      {/* Progress and Timer */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Question {currentQuestion + 1} of {totalQuestions}
                </span>
                <span className="font-medium">{Math.round(((currentQuestion + 1) / totalQuestions) * 100)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
                />
              </div>
            </div>
            <div className="ml-6 flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
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
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="font-mono text-sm font-medium">{formatTime(timeRemaining)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl leading-relaxed">{currentQ.question}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers[currentQuestion]?.toString()}
            onValueChange={(value) => handleAnswerSelect(currentQuestion, Number.parseInt(value))}
          >
            <div className="space-y-3">
              {currentQ.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer leading-relaxed">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion((prev) => prev - 1)}
          disabled={currentQuestion === 0}
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
          Previous
        </Button>

        {currentQuestion < totalQuestions - 1 ? (
          <Button onClick={() => setCurrentQuestion((prev) => prev + 1)}>
            Next Question
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-2 h-4 w-4"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Assessment"}
          </Button>
        )}
      </div>
    </div>
  )
}
