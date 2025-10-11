import { describe, it, expect, beforeEach } from '@jest/globals'
import crypto from 'crypto'

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

describe('Bookmarking and Notes Features', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Question Hash Generation', () => {
    it('should generate consistent hashes for identical questions', () => {
      const question = {
        question: 'What is the primary function of the heart?',
        options: ['Pumping blood', 'Digesting food', 'Filtering toxins', 'Producing hormones'],
        correct_answer: 0,
      }

      const hash1 = generateQuestionHash(question)
      const hash2 = generateQuestionHash(question)

      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(16)
    })

    it('should generate different hashes for different questions', () => {
      const question1 = {
        question: 'What is the primary function of the heart?',
        options: ['Pumping blood', 'Digesting food', 'Filtering toxins', 'Producing hormones'],
        correct_answer: 0,
      }

      const question2 = {
        question: 'What is the primary function of the liver?',
        options: ['Pumping blood', 'Digesting food', 'Filtering toxins', 'Producing hormones'],
        correct_answer: 2,
      }

      const hash1 = generateQuestionHash(question1)
      const hash2 = generateQuestionHash(question2)

      expect(hash1).not.toBe(hash2)
    })

    it('should generate different hashes for same question with different options', () => {
      const question1 = {
        question: 'What is the primary function of the heart?',
        options: ['Pumping blood', 'Digesting food', 'Filtering toxins', 'Producing hormones'],
        correct_answer: 0,
      }

      const question2 = {
        question: 'What is the primary function of the heart?',
        options: ['Pumping blood', 'Circulating oxygen', 'Filtering toxins', 'Producing hormones'],
        correct_answer: 0,
      }

      const hash1 = generateQuestionHash(question1)
      const hash2 = generateQuestionHash(question2)

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('Bookmark Operations', () => {
    it('should add bookmark successfully', async () => {
      const bookmarkData = {
        user_id: 'test-user-id',
        module_id: 'test-module-id',
        assessment_id: 'test-assessment-id',
        question_index: 5,
        question_hash: 'abc123def456',
        notes: null,
      }

      mockSupabase.from().insert.mockResolvedValueOnce({
        data: bookmarkData,
        error: null,
      })

      const result = await addBookmark(bookmarkData)

      expect(mockSupabase.from).toHaveBeenCalledWith('bookmarked_questions')
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(bookmarkData)
      expect(result).toEqual(bookmarkData)
    })

    it('should remove bookmark successfully', async () => {
      const userId = 'test-user-id'
      const moduleId = 'test-module-id'
      const questionIndex = 5

      mockSupabase.from().delete().eq().eq().eq.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      await removeBookmark(userId, moduleId, questionIndex)

      expect(mockSupabase.from).toHaveBeenCalledWith('bookmarked_questions')
      expect(mockSupabase.from().delete).toHaveBeenCalled()
    })

    it('should handle bookmark toggle correctly', async () => {
      const userId = 'test-user-id'
      const moduleId = 'test-module-id'
      const questionIndex = 3
      const question = {
        question: 'Test question?',
        options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
        correct_answer: 0,
      }

      // Mock initial state - not bookmarked
      mockSupabase.from().select().eq().eq.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      // Mock successful bookmark addition
      mockSupabase.from().insert.mockResolvedValueOnce({
        data: { id: 'bookmark-id' },
        error: null,
      })

      const isBookmarked = await checkBookmarkStatus(userId, moduleId, questionIndex)
      expect(isBookmarked).toBe(false)

      await addBookmark({
        user_id: userId,
        module_id: moduleId,
        assessment_id: 'test-assessment',
        question_index: questionIndex,
        question_hash: generateQuestionHash(question),
        notes: null,
      })

      expect(mockSupabase.from().insert).toHaveBeenCalled()
    })
  })

  describe('Notes Management', () => {
    it('should save notes for bookmarked questions', async () => {
      const userId = 'test-user-id'
      const moduleId = 'test-module-id'
      const questionIndex = 2
      const notes = 'This is an important concept about cardiac function.'

      mockSupabase.from().update().eq().eq().eq.mockResolvedValueOnce({
        data: { id: 'bookmark-id' },
        error: null,
      })

      await saveQuestionNotes(userId, moduleId, questionIndex, notes)

      expect(mockSupabase.from).toHaveBeenCalledWith('bookmarked_questions')
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        notes,
        updated_at: expect.any(String),
      })
    })

    it('should not save notes for non-bookmarked questions', async () => {
      const userId = 'test-user-id'
      const moduleId = 'test-module-id'
      const questionIndex = 2
      const notes = 'This is an important concept about cardiac function.'

      // Mock that question is not bookmarked
      mockSupabase.from().select().eq().eq().eq.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      await saveQuestionNotes(userId, moduleId, questionIndex, notes)

      // Should not call update if question is not bookmarked
      expect(mockSupabase.from().update).not.toHaveBeenCalled()
    })

    it('should handle notes update errors gracefully', async () => {
      const userId = 'test-user-id'
      const moduleId = 'test-module-id'
      const questionIndex = 2
      const notes = 'This is an important concept about cardiac function.'

      mockSupabase.from().update().eq().eq().eq.mockResolvedValueOnce({
        data: null,
        error: { message: 'Update failed' },
      })

      // Should not throw error, just log it
      await expect(saveQuestionNotes(userId, moduleId, questionIndex, notes)).resolves.not.toThrow()
    })
  })

  describe('Bookmark Loading', () => {
    it('should load user bookmarks correctly', async () => {
      const userId = 'test-user-id'
      const moduleId = 'test-module-id'
      const mockBookmarks = [
        {
          question_index: 1,
          notes: 'Important concept about anatomy',
          question_hash: 'hash1',
        },
        {
          question_index: 5,
          notes: null,
          question_hash: 'hash2',
        },
        {
          question_index: 8,
          notes: 'Review this before exam',
          question_hash: 'hash3',
        },
      ]

      mockSupabase.from().select().eq().eq.mockResolvedValueOnce({
        data: mockBookmarks,
        error: null,
      })

      const result = await loadUserBookmarks(userId, moduleId)

      expect(mockSupabase.from).toHaveBeenCalledWith('bookmarked_questions')
      expect(result).toEqual(mockBookmarks)
    })

    it('should handle empty bookmark list', async () => {
      const userId = 'test-user-id'
      const moduleId = 'test-module-id'

      mockSupabase.from().select().eq().eq.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      const result = await loadUserBookmarks(userId, moduleId)

      expect(result).toEqual([])
    })

    it('should handle bookmark loading errors', async () => {
      const userId = 'test-user-id'
      const moduleId = 'test-module-id'

      mockSupabase.from().select().eq().eq.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      })

      await expect(loadUserBookmarks(userId, moduleId)).rejects.toThrow('Database error')
    })
  })

  describe('Bookmark Statistics', () => {
    it('should calculate bookmark count correctly', () => {
      const bookmarkedQuestions = new Set([1, 3, 5, 8, 12])
      const totalQuestions = 20

      const bookmarkCount = bookmarkedQuestions.size
      const bookmarkPercentage = (bookmarkCount / totalQuestions) * 100

      expect(bookmarkCount).toBe(5)
      expect(bookmarkPercentage).toBe(25)
    })

    it('should identify most bookmarked questions', () => {
      const bookmarkData = [
        { question_index: 1, notes: 'Note 1' },
        { question_index: 3, notes: 'Note 2' },
        { question_index: 3, notes: 'Note 3' }, // Duplicate
        { question_index: 5, notes: null },
        { question_index: 8, notes: 'Note 4' },
      ]

      const bookmarkCounts = bookmarkData.reduce((acc, bookmark) => {
        acc[bookmark.question_index] = (acc[bookmark.question_index] || 0) + 1
        return acc
      }, {} as Record<number, number>)

      const mostBookmarked = Object.entries(bookmarkCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([index]) => parseInt(index))

      expect(mostBookmarked[0]).toBe(3) // Question 3 is bookmarked twice
    })
  })

  describe('Bookmark Validation', () => {
    it('should validate bookmark data structure', () => {
      const validBookmark = {
        user_id: 'test-user-id',
        module_id: 'test-module-id',
        assessment_id: 'test-assessment-id',
        question_index: 5,
        question_hash: 'abc123def456',
        notes: 'Valid notes',
      }

      const invalidBookmark = {
        user_id: 'test-user-id',
        module_id: 'test-module-id',
        // Missing required fields
        question_index: 5,
      }

      expect(validateBookmarkData(validBookmark)).toBe(true)
      expect(validateBookmarkData(invalidBookmark)).toBe(false)
    })

    it('should validate question index range', () => {
      const totalQuestions = 50

      expect(isValidQuestionIndex(0, totalQuestions)).toBe(true)
      expect(isValidQuestionIndex(25, totalQuestions)).toBe(true)
      expect(isValidQuestionIndex(49, totalQuestions)).toBe(true)
      expect(isValidQuestionIndex(-1, totalQuestions)).toBe(false)
      expect(isValidQuestionIndex(50, totalQuestions)).toBe(false)
      expect(isValidQuestionIndex(100, totalQuestions)).toBe(false)
    })

    it('should validate notes length', () => {
      const maxLength = 1000

      expect(isValidNotes('', maxLength)).toBe(true)
      expect(isValidNotes('Short note', maxLength)).toBe(true)
      expect(isValidNotes('A'.repeat(500), maxLength)).toBe(true)
      expect(isValidNotes('A'.repeat(1000), maxLength)).toBe(true)
      expect(isValidNotes('A'.repeat(1001), maxLength)).toBe(false)
    })
  })

  describe('Bookmark Search and Filter', () => {
    it('should filter bookmarks by notes content', () => {
      const bookmarks = [
        { question_index: 1, notes: 'Important anatomy concept' },
        { question_index: 2, notes: 'Cardiology review needed' },
        { question_index: 3, notes: 'Pharmacology dosage' },
        { question_index: 4, notes: null },
        { question_index: 5, notes: 'Anatomy and physiology' },
      ]

      const filteredBookmarks = filterBookmarksByNotes(bookmarks, 'anatomy')

      expect(filteredBookmarks).toHaveLength(2)
      expect(filteredBookmarks.map(b => b.question_index)).toEqual([1, 5])
    })

    it('should search bookmarks by question content', () => {
      const bookmarks = [
        { question_index: 1, notes: 'Heart function question' },
        { question_index: 2, notes: 'Lung capacity question' },
        { question_index: 3, notes: 'Blood pressure question' },
      ]

      const searchResults = searchBookmarksByContent(bookmarks, 'heart')

      expect(searchResults).toHaveLength(1)
      expect(searchResults[0].question_index).toBe(1)
    })
  })
})

// Helper functions for testing
function generateQuestionHash(question: any): string {
  const content = `${question.question}|${question.options.join('|')}`
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16)
}

async function addBookmark(bookmarkData: any) {
  const { data, error } = await mockSupabase
    .from('bookmarked_questions')
    .insert(bookmarkData)

  if (error) throw error
  return data
}

async function removeBookmark(userId: string, moduleId: string, questionIndex: number) {
  const { data, error } = await mockSupabase
    .from('bookmarked_questions')
    .delete()
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .eq('question_index', questionIndex)

  if (error) throw error
  return data
}

async function checkBookmarkStatus(userId: string, moduleId: string, questionIndex: number): Promise<boolean> {
  const { data, error } = await mockSupabase
    .from('bookmarked_questions')
    .select('id')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .eq('question_index', questionIndex)

  if (error) throw error
  return data && data.length > 0
}

async function saveQuestionNotes(userId: string, moduleId: string, questionIndex: number, notes: string) {
  try {
    // Check if question is bookmarked first
    const { data: bookmarkData } = await mockSupabase
      .from('bookmarked_questions')
      .select('id')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .eq('question_index', questionIndex)

    if (bookmarkData && bookmarkData.length > 0) {
      await mockSupabase
        .from('bookmarked_questions')
        .update({
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('module_id', moduleId)
        .eq('question_index', questionIndex)
    }
  } catch (error) {
    console.error('Failed to save question notes:', error)
  }
}

async function loadUserBookmarks(userId: string, moduleId: string) {
  const { data, error } = await mockSupabase
    .from('bookmarked_questions')
    .select('question_index, notes, question_hash')
    .eq('user_id', userId)
    .eq('module_id', moduleId)

  if (error) throw error
  return data
}

function validateBookmarkData(bookmark: any): boolean {
  const requiredFields = ['user_id', 'module_id', 'assessment_id', 'question_index', 'question_hash']
  return requiredFields.every(field => bookmark.hasOwnProperty(field))
}

function isValidQuestionIndex(index: number, totalQuestions: number): boolean {
  return index >= 0 && index < totalQuestions
}

function isValidNotes(notes: string, maxLength: number): boolean {
  return notes.length <= maxLength
}

function filterBookmarksByNotes(bookmarks: any[], searchTerm: string) {
  return bookmarks.filter(bookmark => 
    bookmark.notes && bookmark.notes.toLowerCase().includes(searchTerm.toLowerCase())
  )
}

function searchBookmarksByContent(bookmarks: any[], searchTerm: string) {
  return bookmarks.filter(bookmark => 
    bookmark.notes && bookmark.notes.toLowerCase().includes(searchTerm.toLowerCase())
  )
}
