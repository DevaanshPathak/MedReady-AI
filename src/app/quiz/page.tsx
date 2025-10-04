'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Brain, Clock, CheckCircle, XCircle } from 'lucide-react'

interface Question {
  question_text: string
  options: string[]
  correct_answer: number
  explanation: string
}

export default function QuizPage() {
  const router = useRouter()
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(false)
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)

  const medicalTopics = [
    'Cardiology',
    'Neurology',
    'Pharmacology',
    'Anatomy',
    'Physiology',
    'Pathology',
    'Internal Medicine',
    'Surgery',
    'Pediatrics',
    'Psychiatry',
  ]

  const generateQuestions = async () => {
    if (!topic) {
      alert('Please select a topic')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          difficulty,
          count: 5,
        }),
      })

      const data = await response.json()
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions)
        setQuizStarted(true)
        setStartTime(Date.now())
      } else {
        alert('Failed to generate questions. Please try again.')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to generate questions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return
    setSelectedAnswer(answerIndex)
  }

  const submitAnswer = () => {
    if (selectedAnswer === null) {
      alert('Please select an answer')
      return
    }

    const isCorrect = selectedAnswer === questions[currentQuestion].correct_answer
    if (isCorrect) {
      setScore(score + 1)
    }
    setShowExplanation(true)
  }

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
    } else {
      setQuizCompleted(true)
    }
  }

  const restartQuiz = () => {
    setQuizStarted(false)
    setQuizCompleted(false)
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setShowExplanation(false)
    setScore(0)
    setQuestions([])
    setTopic('')
  }

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center space-x-2">
              <Brain className="w-8 h-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">MedReady AI</h1>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              Dashboard
            </button>
          </div>

          {/* Quiz Setup */}
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Start a New Quiz</h2>
            
            <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Topic
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Choose a topic...</option>
                  {medicalTopics.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <div className="flex gap-3">
                  {['easy', 'medium', 'hard'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                        difficulty === level
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generateQuestions}
                disabled={loading || !topic}
                className="w-full py-4 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating Questions...' : 'Start Quiz'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (quizCompleted) {
    const accuracy = Math.round((score / questions.length) * 100)
    const timeTaken = Math.floor((Date.now() - startTime) / 1000)
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-xl shadow-xl p-12 text-center">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              {accuracy >= 70 ? (
                <CheckCircle className="w-12 h-12 text-green-600" />
              ) : (
                <Brain className="w-12 h-12 text-primary-600" />
              )}
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-4">Quiz Completed!</h2>
            
            <div className="grid grid-cols-3 gap-6 my-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-primary-600">{score}/{questions.length}</div>
                <div className="text-sm text-gray-600 mt-1">Questions Correct</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-green-600">{accuracy}%</div>
                <div className="text-sm text-gray-600 mt-1">Accuracy</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-purple-600">{timeTaken}s</div>
                <div className="text-sm text-gray-600 mt-1">Time Taken</div>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={restartQuiz}
                className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
              >
                Take Another Quiz
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                View Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const question = questions[currentQuestion]
  const isCorrect = selectedAnswer === question.correct_answer

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <Brain className="w-8 h-8 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">MedReady AI</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="w-5 h-5" />
              <span className="font-medium">{Math.floor((Date.now() - startTime) / 1000)}s</span>
            </div>
            <div className="px-4 py-2 bg-white rounded-lg shadow">
              <span className="font-medium text-gray-900">Score: {score}/{questions.length}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm font-medium text-gray-700">{topic}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">{question.question_text}</h3>
            
            <div className="space-y-3">
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === index
                const isCorrectAnswer = index === question.correct_answer
                
                let buttonClass = 'w-full text-left p-4 rounded-lg border-2 transition '
                
                if (showExplanation) {
                  if (isCorrectAnswer) {
                    buttonClass += 'border-green-500 bg-green-50'
                  } else if (isSelected && !isCorrect) {
                    buttonClass += 'border-red-500 bg-red-50'
                  } else {
                    buttonClass += 'border-gray-200 bg-gray-50'
                  }
                } else {
                  buttonClass += isSelected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showExplanation}
                    className={buttonClass}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{String.fromCharCode(65 + index)}. {option}</span>
                      {showExplanation && isCorrectAnswer && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {showExplanation && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className={`rounded-xl shadow-lg p-6 mb-6 ${isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
              <div className="flex items-start space-x-3">
                {isCorrect ? (
                  <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 mt-1" />
                )}
                <div>
                  <h4 className="font-semibold text-lg mb-2">
                    {isCorrect ? 'Correct!' : 'Incorrect'}
                  </h4>
                  <p className="text-gray-700">{question.explanation}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            {!showExplanation ? (
              <button
                onClick={submitAnswer}
                disabled={selectedAnswer === null}
                className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
              >
                {currentQuestion < questions.length - 1 ? 'Next Question' : 'Complete Quiz'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
