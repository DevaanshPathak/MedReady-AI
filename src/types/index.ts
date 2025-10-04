export interface User {
  id: string
  email: string
  full_name?: string
  created_at: string
}

export interface Question {
  id: string
  user_id: string
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  question_text: string
  options: string[]
  correct_answer: number
  explanation: string
  created_at: string
}

export interface UserAnswer {
  id: string
  user_id: string
  question_id: string
  selected_answer: number
  is_correct: boolean
  time_taken: number
  created_at: string
}

export interface UserProgress {
  user_id: string
  total_questions: number
  correct_answers: number
  weak_topics: string[]
  accuracy: number
  last_updated: string
}

export interface QuizSession {
  id: string
  user_id: string
  topic: string
  questions: Question[]
  score: number
  total_questions: number
  started_at: string
  completed_at?: string
}
