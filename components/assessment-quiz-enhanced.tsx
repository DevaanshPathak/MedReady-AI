"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  Bookmark, 
  BookmarkCheck, 
  Clock, 
  Share2, 
  Brain, 
  Play, 
  Pause,
  RotateCcw,
  CheckCircle,
  XCircle,
  Timer
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import crypto from "crypto"

interface Question {
  question: string
  options: string[]
  correct_answer: number
}

interface AssessmentQuizEnhancedProps {
  assessment: {
    id: string
    title: string
    questions: Question[]
    passing_score: number
    time_limit_minutes: number
  }
  userId: string
  moduleId: string
}

type QuizMode = "practice" | "timed" | "spaced_repetition"

export function AssessmentQuizEnhanced({ assessment, userId, moduleId }: AssessmentQuizEnhancedProps) {
  const [mode, setMode] = useState<QuizMode>("practice")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<number>>(new Set())
  const [questionNotes, setQuestionNotes] = useState<Record<number, string>>({})
  const [timeRemaining, setTimeRemaining] = useState(assessment.time_limit_minutes * 60)
  const [isPaused, setIsPaused] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [spacedRepetitionDue, setSpacedRepetitionDue] = useState<number[]>([])
  
  const router = useRouter()
  const supabase = createClient()
  
  const questions = assessment.questions
  const totalQuestions = questions.length

  // Load bookmarks and spaced repetition data
  useEffect(() => {
    loadBookmarks()
    if (mode === "spaced_repetition") {
      loadSpacedRepetitionDue()
    }
  }, [userId, moduleId, mode])

  // Create quiz session
  useEffect(() => {
    if (mode !== "practice") {
      createQuizSession()
    }
  }, [mode])

  // Timer for timed mode
  useEffect(() => {
    if (mode !== "timed" || showResults || isPaused) return

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
  }, [mode, showResults, isPaused])

  const createQuizSession = async () => {
    try {
      const { data, error } = await supabase
        .from("quiz_sessions")
        .insert({
          user_id: userId,
          assessment_id: assessment.id,
          module_id: moduleId,
          mode: mode,
          time_limit_seconds: mode === "timed" ? assessment.time_limit_minutes * 60 : null,
          questions_order: questions.map((_, i) => i),
        })
        .select()
        .single()

      if (error) throw error
      setSessionId(data.id)
    } catch (error) {
      console.error("Failed to create quiz session:", error)
    }
  }

  const loadBookmarks = async () => {
    try {
      const { data, error } = await supabase
        .from("bookmarked_questions")
        .select("question_index, notes")
        .eq("user_id", userId)
        .eq("module_id", moduleId)

      if (error) throw error

      const bookmarked = new Set(data.map((b) => b.question_index))
      setBookmarkedQuestions(bookmarked)

      const notes: Record<number, string> = {}
      data.forEach((b) => {
        if (b.notes) notes[b.question_index] = b.notes
      })
      setQuestionNotes(notes)
    } catch (error) {
      console.error("Failed to load bookmarks:", error)
    }
  }

  const loadSpacedRepetitionDue = async () => {
    try {
      const { data, error } = await supabase
        .from("spaced_repetition")
        .select("question_id")
        .eq("user_id", userId)
        .eq("module_id", moduleId)
        .lte("next_review_date", new Date().toISOString())

      if (error) throw error

      // Extract question indices from question IDs
      const dueIndices = data
        .map((sr) => {
          // Question ID is a hash, we need to find matching questions
          const hash = sr.question_id
          return questions.findIndex((q) => generateQuestionHash(q) === hash)
        })
        .filter((i) => i !== -1)

      setSpacedRepetitionDue(dueIndices)
    } catch (error) {
      console.error("Failed to load spaced repetition data:", error)
    }
  }

  const generateQuestionHash = (question: Question): string => {
    const content = `${question.question}|${question.options.join("|")}`
    return crypto.createHash("sha256").update(content).digest("hex").substring(0, 16)
  }

  const toggleBookmark = async (questionIndex: number) => {
    const isBookmarked = bookmarkedQuestions.has(questionIndex)
    const question = questions[questionIndex]
    const questionHash = generateQuestionHash(question)

    try {
      if (isBookmarked) {
        // Remove bookmark
        await supabase
          .from("bookmarked_questions")
          .delete()
          .eq("user_id", userId)
          .eq("module_id", moduleId)
          .eq("question_index", questionIndex)

        setBookmarkedQuestions((prev) => {
          const newSet = new Set(prev)
          newSet.delete(questionIndex)
          return newSet
        })

        toast({
          title: "Bookmark removed",
          description: "Question removed from bookmarks",
        })
      } else {
        // Add bookmark
        await supabase.from("bookmarked_questions").insert({
          user_id: userId,
          module_id: moduleId,
          assessment_id: assessment.id,
          question_index: questionIndex,
          question_hash: questionHash,
          notes: questionNotes[questionIndex] || null,
        })

        setBookmarkedQuestions((prev) => new Set(prev).add(questionIndex))

        toast({
          title: "Question bookmarked",
          description: "You can review this question later",
        })
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error)
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive",
      })
    }
  }

  const saveQuestionNote = async (questionIndex: number, note: string) => {
    setQuestionNotes((prev) => ({ ...prev, [questionIndex]: note }))

    if (bookmarkedQuestions.has(questionIndex)) {
      try {
        await supabase
          .from("bookmarked_questions")
          .update({ notes: note, updated_at: new Date().toISOString() })
          .eq("user_id", userId)
          .eq("module_id", moduleId)
          .eq("question_index", questionIndex)
      } catch (error) {
        console.error("Failed to save note:", error)
      }
    }
  }

  const updateSpacedRepetition = async (questionIndex: number, quality: number) => {
    const question = questions[questionIndex]
    const questionHash = generateQuestionHash(question)

    try {
      const { error } = await supabase.rpc("update_spaced_repetition", {
        p_user_id: userId,
        p_question_id: questionHash,
        p_module_id: moduleId,
        p_quality: quality,
      })

      if (error) throw error
    } catch (error) {
      console.error("Failed to update spaced repetition:", error)
    }
  }

  const shareProgress = async () => {
    try {
      const { error } = await supabase.from("progress_shares").insert({
        user_id: userId,
        module_id: moduleId,
        share_type: "public",
        message: `Completed quiz with ${score}% score!`,
      })

      if (error) throw error

      toast({
        title: "Progress shared!",
        description: "Your achievement has been shared with peers",
      })
    } catch (error) {
      console.error("Failed to share progress:", error)
      toast({
        title: "Error",
        description: "Failed to share progress",
        variant: "destructive",
      })
    }
  }

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: answerIndex }))

    // Update quiz session if exists
    if (sessionId) {
      supabase
        .from("quiz_sessions")
        .update({
          answers: { ...answers, [questionIndex]: answerIndex },
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId)
        .then()
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setShowResults(true)

    // Calculate score
    let correctAnswers = 0
    questions.forEach((question, index) => {
      const isCorrect = answers[index] === question.correct_answer
      if (isCorrect) {
        correctAnswers++
      }

      // Update spaced repetition based on correctness
      if (mode === "spaced_repetition") {
        const quality = isCorrect ? 4 : 2 // 4 = correct with ease, 2 = incorrect
        updateSpacedRepetition(index, quality)
      }
    })

    const finalScore = Math.round((correctAnswers / totalQuestions) * 100)
    setScore(finalScore)

    // Save result
    try {
      const passed = finalScore >= assessment.passing_score

      await supabase.from("assessment_attempts").insert({
        user_id: userId,
        assessment_id: assessment.id,
        score: finalScore,
        passed: passed,
        answers: answers,
      })

      // Update quiz session
      if (sessionId) {
        await supabase
          .from("quiz_sessions")
          .update({
            is_completed: true,
            completed_at: new Date().toISOString(),
            time_spent_seconds:
              mode === "timed" ? assessment.time_limit_minutes * 60 - timeRemaining : null,
          })
          .eq("id", sessionId)
      }

      // Mark module as completed if passed
      if (passed) {
        await supabase.from("progress").upsert({
          user_id: userId,
          module_id: moduleId,
          status: "completed",
          completion_percent: 100,
          completed_at: new Date().toISOString(),
        })

        // Try to generate certificate
        await fetch("/api/generate-certificate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ moduleId: moduleId }),
        })

        // Award points based on score
        const pointsEarned = Math.round((finalScore / 100) * 50) // Up to 50 points
        await fetch("/api/gamification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "award_points",
            points: pointsEarned,
            reason: `Completed assessment with ${finalScore}% score`,
          }),
        })

        // Update study streak
        await fetch("/api/streaks", {
          method: "POST",
        })
      } else {
        // Award participation points even if failed
        await fetch("/api/gamification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "award_points",
            points: 10,
            reason: "Completed assessment (practice)",
          }),
        })
      }
    } catch (error) {
      console.error("Error saving assessment result:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const resetQuiz = () => {
    setCurrentQuestion(0)
    setAnswers({})
    setShowResults(false)
    setScore(0)
    setTimeRemaining(assessment.time_limit_minutes * 60)
    setIsPaused(false)
    if (mode !== "practice") {
      createQuizSession()
    }
  }

  if (showResults) {
    const passed = score >= assessment.passing_score
    const correctCount = Object.entries(answers).filter(
      ([index, answer]) => answer === questions[parseInt(index)].correct_answer
    ).length

    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Quiz Results</CardTitle>
              <CardDescription>You have completed the assessment</CardDescription>
            </div>
            <Badge variant={passed ? "default" : "destructive"} className="text-lg px-4 py-2">
              {score}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{correctCount}</div>
                  <div className="text-sm text-muted-foreground">Correct Answers</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-destructive">
                    {totalQuestions - correctCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Incorrect Answers</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">{assessment.passing_score}%</div>
                  <div className="text-sm text-muted-foreground">Passing Score</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col items-center gap-4 p-8 rounded-lg border bg-muted/50">
            {passed ? (
              <>
                <CheckCircle className="h-16 w-16 text-green-600" />
                <h3 className="text-2xl font-bold text-green-600">Congratulations!</h3>
                <p className="text-center text-muted-foreground">
                  You have passed the assessment. A certificate will be generated for you.
                </p>
              </>
            ) : (
              <>
                <XCircle className="h-16 w-16 text-destructive" />
                <h3 className="text-2xl font-bold text-destructive">Keep Practicing</h3>
                <p className="text-center text-muted-foreground">
                  You need {assessment.passing_score}% to pass. Review the material and try again.
                </p>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={resetQuiz} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry Quiz
            </Button>
            <Button onClick={shareProgress} variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Share Progress
            </Button>
            <Button onClick={() => router.push(`/learn/${moduleId}`)}>
              Back to Module
            </Button>
          </div>

          {/* Review answers */}
          <div className="space-y-4 mt-8">
            <h3 className="text-lg font-semibold">Review Your Answers</h3>
            {questions.map((question, index) => {
              const userAnswer = answers[index]
              const isCorrect = userAnswer === question.correct_answer

              return (
                <Card key={index} className={isCorrect ? "border-green-500" : "border-destructive"}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-base font-medium">
                        {index + 1}. {question.question}
                      </CardTitle>
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {question.options.map((option, optIndex) => {
                      const isUserAnswer = userAnswer === optIndex
                      const isCorrectAnswer = question.correct_answer === optIndex

                      return (
                        <div
                          key={optIndex}
                          className={`p-3 rounded-md border ${
                            isCorrectAnswer
                              ? "bg-green-50 border-green-500"
                              : isUserAnswer
                                ? "bg-red-50 border-destructive"
                                : "bg-muted/30"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isCorrectAnswer && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                            {isUserAnswer && !isCorrectAnswer && (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
                            <span>{option}</span>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentQ = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / totalQuestions) * 100

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Mode selector */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Mode</CardTitle>
          <CardDescription>Choose how you want to practice</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(v) => setMode(v as QuizMode)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="practice">
                <Play className="h-4 w-4 mr-2" />
                Practice
              </TabsTrigger>
              <TabsTrigger value="timed">
                <Timer className="h-4 w-4 mr-2" />
                Timed
              </TabsTrigger>
              <TabsTrigger value="spaced_repetition">
                <Brain className="h-4 w-4 mr-2" />
                Review ({spacedRepetitionDue.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4 p-4 bg-muted rounded-lg text-sm">
            {mode === "practice" && (
              <p>Practice at your own pace. No time limit, review bookmarked questions anytime.</p>
            )}
            {mode === "timed" && (
              <p>
                Complete the quiz within {assessment.time_limit_minutes} minutes. Test your speed
                and accuracy under pressure.
              </p>
            )}
            {mode === "spaced_repetition" && (
              <p>
                Focus on questions you need to review. Our algorithm schedules reviews based on your
                performance.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quiz progress and timer */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Question {currentQuestion + 1} of {totalQuestions}
              </p>
              <div className="h-2 w-64 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {mode === "timed" && (
              <div className="flex items-center gap-2">
                {timeRemaining < 60 && (
                  <Badge variant="destructive" className="animate-pulse">
                    Hurry!
                  </Badge>
                )}
                <div className="flex items-center gap-2 text-2xl font-mono font-bold">
                  <Clock className="h-5 w-5" />
                  {formatTime(timeRemaining)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPaused(!isPaused)}
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Question card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-xl">{currentQ.question}</CardTitle>
            <Button
              variant={bookmarkedQuestions.has(currentQuestion) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleBookmark(currentQuestion)}
            >
              {bookmarkedQuestions.has(currentQuestion) ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
          </div>
          {spacedRepetitionDue.includes(currentQuestion) && (
            <Badge variant="secondary">
              <Brain className="h-3 w-3 mr-1" />
              Due for review
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            value={answers[currentQuestion]?.toString()}
            onValueChange={(value) => handleAnswerSelect(currentQuestion, parseInt(value))}
          >
            {currentQ.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {/* Question notes */}
          {bookmarkedQuestions.has(currentQuestion) && (
            <div className="space-y-2">
              <Label htmlFor="notes">Your Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add notes about this question..."
                value={questionNotes[currentQuestion] || ""}
                onChange={(e) => saveQuestionNote(currentQuestion, e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`h-8 w-8 rounded-full border transition-all ${
                    currentQuestion === index
                      ? "bg-primary text-primary-foreground border-primary"
                      : answers[index] !== undefined
                        ? "bg-green-100 text-green-700 border-green-300"
                        : "bg-muted hover:bg-muted/80 border-border"
                  }`}
                  title={`Question ${index + 1}${answers[index] !== undefined ? " (answered)" : ""}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {currentQuestion === totalQuestions - 1 ? (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Quiz"}
              </Button>
            ) : (
              <Button
                onClick={() =>
                  setCurrentQuestion((prev) => Math.min(totalQuestions - 1, prev + 1))
                }
              >
                Next
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bookmarked questions summary */}
      {bookmarkedQuestions.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bookmarked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Array.from(bookmarkedQuestions).map((index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentQuestion(index)}
                >
                  <BookmarkCheck className="h-3 w-3 mr-1" />
                  Question {index + 1}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
