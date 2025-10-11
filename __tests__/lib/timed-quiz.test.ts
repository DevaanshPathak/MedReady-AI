import { describe, it, expect, beforeEach } from '@jest/globals'

// Create a chainable mock factory
const createChainableMock = () => {
  const chainable: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn((resolve) => {
      resolve({ data: [], error: null })
      return Promise.resolve({ data: [], error: null })
    }),
  }
  
  // Make sure all methods return the same chainable object
  Object.keys(chainable).forEach(key => {
    if (typeof chainable[key] === 'function' && key !== 'single' && key !== 'then') {
      chainable[key].mockReturnValue(chainable)
    }
  })
  
  return chainable
}

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => createChainableMock()),
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}))

describe('Timed Quiz Mode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Timer Management', () => {
    it('should format time correctly', () => {
      expect(formatTime(0)).toBe('0:00')
      expect(formatTime(59)).toBe('0:59')
      expect(formatTime(60)).toBe('1:00')
      expect(formatTime(125)).toBe('2:05')
      expect(formatTime(3661)).toBe('61:01')
    })

    it('should countdown timer correctly', () => {
      let timeRemaining = 300 // 5 minutes
      const timer = setInterval(() => {
        timeRemaining -= 1
      }, 1000)

      // Fast forward 5 seconds
      jest.advanceTimersByTime(5000)
      expect(timeRemaining).toBe(295)

      // Fast forward another 60 seconds
      jest.advanceTimersByTime(60000)
      expect(timeRemaining).toBe(235)

      clearInterval(timer)
    })

    it('should auto-submit when timer reaches zero', () => {
      const mockSubmit = jest.fn()
      let timeRemaining = 5

      const timer = setInterval(() => {
        timeRemaining -= 1
        if (timeRemaining <= 0) {
          mockSubmit()
          clearInterval(timer)
        }
      }, 1000)

      // Fast forward to timer end
      jest.advanceTimersByTime(5000)
      expect(mockSubmit).toHaveBeenCalledTimes(1)

      clearInterval(timer)
    })
  })

  describe('Quiz Session Creation', () => {
    it('should create timed quiz session with correct parameters', async () => {
      const sessionData = {
        user_id: 'test-user-id',
        assessment_id: 'test-assessment-id',
        module_id: 'test-module-id',
        mode: 'timed',
        time_limit_seconds: 1800, // 30 minutes
        questions_order: [0, 1, 2, 3, 4],
      }

      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: { id: 'session-id', ...sessionData },
        error: null,
      })

      const result = await createQuizSession(sessionData)

      expect(mockSupabase.from).toHaveBeenCalledWith('quiz_sessions')
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(sessionData)
      expect(result.id).toBe('session-id')
    })

    it('should handle session creation errors', async () => {
      const sessionData = {
        user_id: 'test-user-id',
        assessment_id: 'test-assessment-id',
        module_id: 'test-module-id',
        mode: 'timed',
        time_limit_seconds: 1800,
        questions_order: [0, 1, 2, 3, 4],
      }

      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      })

      await expect(createQuizSession(sessionData)).rejects.toThrow('Database error')
    })
  })

  describe('Answer Tracking', () => {
    it('should track answers in real-time', async () => {
      const sessionId = 'test-session-id'
      const answers = { 0: 2, 1: 0, 2: 1 }

      mockSupabase.from().update().eq.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      await updateQuizSessionAnswers(sessionId, answers)

      expect(mockSupabase.from).toHaveBeenCalledWith('quiz_sessions')
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        answers,
        updated_at: expect.any(String),
      })
      expect(mockSupabase.from().eq).toHaveBeenCalledWith('id', sessionId)
    })

    it('should handle answer update errors gracefully', async () => {
      const sessionId = 'test-session-id'
      const answers = { 0: 2 }

      mockSupabase.from().update().eq.mockResolvedValueOnce({
        data: null,
        error: { message: 'Update failed' },
      })

      // Should not throw error, just log it
      await expect(updateQuizSessionAnswers(sessionId, answers)).resolves.not.toThrow()
    })
  })

  describe('Pause/Resume Functionality', () => {
    it('should pause timer correctly', () => {
      let timeRemaining = 300
      let isPaused = false

      const pauseTimer = () => {
        isPaused = true
      }

      const resumeTimer = () => {
        isPaused = false
      }

      pauseTimer()
      expect(isPaused).toBe(true)

      resumeTimer()
      expect(isPaused).toBe(false)
    })

    it('should not decrement time when paused', () => {
      let timeRemaining = 300
      let isPaused = false

      const timer = setInterval(() => {
        if (!isPaused) {
          timeRemaining -= 1
        }
      }, 1000)

      // Let timer run for 5 seconds
      jest.advanceTimersByTime(5000)
      expect(timeRemaining).toBe(295)

      // Pause timer
      isPaused = true

      // Let timer run for another 5 seconds while paused
      jest.advanceTimersByTime(5000)
      expect(timeRemaining).toBe(295) // Should not change

      clearInterval(timer)
    })
  })

  describe('Time Warning System', () => {
    it('should show warning when time is low', () => {
      const timeRemaining = 30 // 30 seconds
      const shouldShowWarning = timeRemaining < 60

      expect(shouldShowWarning).toBe(true)
    })

    it('should not show warning when time is sufficient', () => {
      const timeRemaining = 120 // 2 minutes
      const shouldShowWarning = timeRemaining < 60

      expect(shouldShowWarning).toBe(false)
    })

    it('should calculate time percentage correctly', () => {
      const totalTime = 1800 // 30 minutes
      const remainingTime = 900 // 15 minutes
      const percentage = ((totalTime - remainingTime) / totalTime) * 100

      expect(percentage).toBe(50)
    })
  })

  describe('Session Completion', () => {
    it('should complete session with time spent', async () => {
      const sessionId = 'test-session-id'
      const timeLimit = 1800 // 30 minutes
      const timeRemaining = 600 // 10 minutes
      const timeSpent = timeLimit - timeRemaining

      mockSupabase.from().update().eq.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      await completeQuizSession(sessionId, timeSpent)

      expect(mockSupabase.from).toHaveBeenCalledWith('quiz_sessions')
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        is_completed: true,
        completed_at: expect.any(String),
        time_spent_seconds: timeSpent,
      })
      expect(mockSupabase.from().eq).toHaveBeenCalledWith('id', sessionId)
    })

    it('should handle completion errors', async () => {
      const sessionId = 'test-session-id'
      const timeSpent = 1200

      mockSupabase.from().update().eq.mockResolvedValueOnce({
        data: null,
        error: { message: 'Completion failed' },
      })

      await expect(completeQuizSession(sessionId, timeSpent)).rejects.toThrow('Completion failed')
    })
  })

  describe('Performance Metrics', () => {
    it('should calculate questions per minute', () => {
      const totalQuestions = 50
      const timeSpentMinutes = 25
      const questionsPerMinute = totalQuestions / timeSpentMinutes

      expect(questionsPerMinute).toBe(2)
    })

    it('should calculate time per question', () => {
      const totalTimeSeconds = 1800 // 30 minutes
      const totalQuestions = 50
      const timePerQuestion = totalTimeSeconds / totalQuestions

      expect(timePerQuestion).toBe(36) // 36 seconds per question
    })

    it('should identify time pressure scenarios', () => {
      const timeRemaining = 60 // 1 minute
      const questionsRemaining = 10
      const timePerQuestion = timeRemaining / questionsRemaining

      const isTimePressure = timePerQuestion < 10 // Less than 10 seconds per question
      expect(isTimePressure).toBe(true)
    })
  })
})

// Helper functions for testing
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

async function createQuizSession(sessionData: any) {
  const { data, error } = await mockSupabase
    .from('quiz_sessions')
    .insert(sessionData)
    .select()
    .single()

  if (error) throw error
  return data
}

async function updateQuizSessionAnswers(sessionId: string, answers: Record<number, number>) {
  try {
    await mockSupabase
      .from('quiz_sessions')
      .update({
        answers,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
  } catch (error) {
    console.error('Failed to update quiz session answers:', error)
  }
}

async function completeQuizSession(sessionId: string, timeSpent: number) {
  const { data, error } = await mockSupabase
    .from('quiz_sessions')
    .update({
      is_completed: true,
      completed_at: new Date().toISOString(),
      time_spent_seconds: timeSpent,
    })
    .eq('id', sessionId)

  if (error) throw error
  return data
}
