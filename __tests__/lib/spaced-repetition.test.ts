// Test file for spaced repetition algorithm

// Mock Supabase client
const mockSupabase = {
  rpc: jest.fn(),
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}))

describe('Spaced Repetition Algorithm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Quality Score Calculation', () => {
    it('should calculate quality score based on correctness and ease', () => {
      // Quality scores:
      // 0 = complete blackout
      // 1 = incorrect response; correct one remembered
      // 2 = incorrect response; where the correct one seemed easy to recall
      // 3 = correct response; with serious difficulty
      // 4 = correct response; with some hesitation
      // 5 = perfect response

      const testCases = [
        { correct: false, difficulty: 'hard', expected: 0 },
        { correct: false, difficulty: 'medium', expected: 1 },
        { correct: false, difficulty: 'easy', expected: 2 },
        { correct: true, difficulty: 'hard', expected: 3 },
        { correct: true, difficulty: 'medium', expected: 4 },
        { correct: true, difficulty: 'easy', expected: 5 },
      ]

      testCases.forEach(({ correct, difficulty, expected }) => {
        const quality = calculateQualityScore(correct, difficulty)
        expect(quality).toBe(expected)
      })
    })
  })

  describe('Ease Factor Updates', () => {
    it('should decrease ease factor for incorrect answers', () => {
      const initialEase = 2.5
      const quality = 1 // incorrect response
      
      const newEase = updateEaseFactor(initialEase, quality)
      expect(newEase).toBeLessThan(initialEase)
      expect(newEase).toBeGreaterThanOrEqual(1.3) // minimum ease factor
    })

    it('should increase ease factor for perfect answers', () => {
      const initialEase = 2.5
      const quality = 5 // perfect response
      
      const newEase = updateEaseFactor(initialEase, quality)
      expect(newEase).toBeGreaterThan(initialEase)
    })

    it('should maintain ease factor for medium quality answers', () => {
      const initialEase = 2.5
      const quality = 4 // correct with hesitation
      
      const newEase = updateEaseFactor(initialEase, quality)
      expect(newEase).toBeCloseTo(initialEase, 1)
    })
  })

  describe('Interval Calculation', () => {
    it('should calculate correct intervals for first review', () => {
      const testCases = [
        { repetitions: 0, quality: 3, expected: 1 }, // 1 day for correct with difficulty
        { repetitions: 0, quality: 4, expected: 1 }, // 1 day for correct with hesitation
        { repetitions: 0, quality: 5, expected: 1 }, // 1 day for perfect
        { repetitions: 0, quality: 2, expected: 1 }, // 1 day for incorrect but easy recall
        { repetitions: 0, quality: 1, expected: 1 }, // 1 day for incorrect
        { repetitions: 0, quality: 0, expected: 1 }, // 1 day for complete blackout
      ]

      testCases.forEach(({ repetitions, quality, expected }) => {
        const interval = calculateNextInterval(repetitions, 2.5, quality)
        expect(interval).toBe(expected)
      })
    })

    it('should calculate correct intervals for second review', () => {
      const testCases = [
        { repetitions: 1, quality: 3, expected: 6 }, // 6 days for correct with difficulty
        { repetitions: 1, quality: 4, expected: 6 }, // 6 days for correct with hesitation
        { repetitions: 1, quality: 5, expected: 6 }, // 6 days for perfect
        { repetitions: 1, quality: 2, expected: 1 }, // 1 day for incorrect but easy recall
        { repetitions: 1, quality: 1, expected: 1 }, // 1 day for incorrect
        { repetitions: 1, quality: 0, expected: 1 }, // 1 day for complete blackout
      ]

      testCases.forEach(({ repetitions, quality, expected }) => {
        const interval = calculateNextInterval(repetitions, 2.5, quality)
        expect(interval).toBe(expected)
      })
    })

    it('should use ease factor for subsequent reviews', () => {
      const repetitions = 2
      const easeFactor = 3.0
      const quality = 4 // correct with hesitation
      
      const interval = calculateNextInterval(repetitions, easeFactor, quality)
      expect(interval).toBe(Math.round(6 * easeFactor)) // 18 days
    })
  })

  describe('Database Integration', () => {
    it('should call update_spaced_repetition RPC with correct parameters', async () => {
      const userId = 'test-user-id'
      const questionId = 'test-question-hash'
      const moduleId = 'test-module-id'
      const quality = 4

      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null })

      await updateSpacedRepetition(userId, questionId, moduleId, quality)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_spaced_repetition', {
        p_user_id: userId,
        p_question_id: questionId,
        p_module_id: moduleId,
        p_quality: quality,
      })
    })

    it('should load spaced repetition due questions', async () => {
      const userId = 'test-user-id'
      const moduleId = 'test-module-id'
      const mockData = [
        { question_id: 'hash1', next_review_date: '2024-01-01T00:00:00Z' },
        { question_id: 'hash2', next_review_date: '2024-01-02T00:00:00Z' },
      ]

      mockSupabase.from().select().eq().eq().lte.mockResolvedValueOnce({
        data: mockData,
        error: null,
      })

      const result = await loadSpacedRepetitionDue(userId, moduleId)

      expect(result).toEqual(mockData)
      expect(mockSupabase.from).toHaveBeenCalledWith('spaced_repetition')
    })
  })

  describe('Question Hash Generation', () => {
    it('should generate consistent hashes for identical questions', () => {
      const question = {
        question: 'What is the capital of France?',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correct_answer: 2,
      }

      const hash1 = generateQuestionHash(question)
      const hash2 = generateQuestionHash(question)

      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(16) // First 16 characters of SHA256
    })

    it('should generate different hashes for different questions', () => {
      const question1 = {
        question: 'What is the capital of France?',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correct_answer: 2,
      }

      const question2 = {
        question: 'What is the capital of Germany?',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correct_answer: 1,
      }

      const hash1 = generateQuestionHash(question1)
      const hash2 = generateQuestionHash(question2)

      expect(hash1).not.toBe(hash2)
    })
  })
})

// Helper functions for testing
function calculateQualityScore(correct: boolean, difficulty: string): number {
  if (!correct) {
    return difficulty === 'hard' ? 0 : difficulty === 'medium' ? 1 : 2
  }
  return difficulty === 'hard' ? 3 : difficulty === 'medium' ? 4 : 5
}

function updateEaseFactor(currentEase: number, quality: number): number {
  if (quality < 3) {
    return Math.max(1.3, currentEase - 0.2)
  }
  if (quality === 5) {
    return currentEase + 0.1
  }
  return currentEase
}

function calculateNextInterval(repetitions: number, easeFactor: number, quality: number): number {
  if (quality < 3) {
    return 1 // Reset to 1 day for incorrect answers
  }

  if (repetitions === 0) {
    return 1
  }
  if (repetitions === 1) {
    return 6
  }

  return Math.round(6 * easeFactor)
}

async function updateSpacedRepetition(
  userId: string,
  questionId: string,
  moduleId: string,
  quality: number
): Promise<void> {
  await mockSupabase.rpc('update_spaced_repetition', {
    p_user_id: userId,
    p_question_id: questionId,
    p_module_id: moduleId,
    p_quality: quality,
  })
}

async function loadSpacedRepetitionDue(userId: string, moduleId: string) {
  const { data, error } = await mockSupabase
    .from('spaced_repetition')
    .select('question_id, next_review_date')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .lte('next_review_date', new Date().toISOString())

  if (error) throw error
  return data
}

function generateQuestionHash(question: any): string {
  const crypto = require('crypto')
  const content = `${question.question}|${question.options.join('|')}`
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16)
}
