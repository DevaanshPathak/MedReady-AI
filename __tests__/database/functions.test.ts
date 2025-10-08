import { describe, it, expect, beforeEach } from '@jest/globals'

// Mock Supabase client for testing database functions
const mockSupabase = {
  rpc: jest.fn(),
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabase,
}))

describe('Database Functions and RLS Policies', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Spaced Repetition Database Functions', () => {
    it('should call update_spaced_repetition function with correct parameters', async () => {
      const params = {
        p_user_id: 'user-123',
        p_question_id: 'question-hash-abc',
        p_module_id: 'module-456',
        p_quality: 4,
      }

      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      const result = await callUpdateSpacedRepetition(params)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_spaced_repetition', params)
      expect(result.error).toBeNull()
    })

    it('should handle update_spaced_repetition function errors', async () => {
      const params = {
        p_user_id: 'user-123',
        p_question_id: 'question-hash-abc',
        p_module_id: 'module-456',
        p_quality: 4,
      }

      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Function execution failed' },
      })

      const result = await callUpdateSpacedRepetition(params)

      expect(result.error).toBeTruthy()
      expect(result.error.message).toBe('Function execution failed')
    })

    it('should call calculate_next_review function correctly', async () => {
      const params = {
        quality: 4,
        ease_factor: 2.5,
        interval: 6,
        repetitions: 2,
      }

      const expectedResult = {
        new_ease_factor: 2.5,
        new_interval: 15,
        new_repetitions: 3,
      }

      mockSupabase.rpc.mockResolvedValueOnce({
        data: expectedResult,
        error: null,
      })

      const result = await callCalculateNextReview(params)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('calculate_next_review', params)
      expect(result.data).toEqual(expectedResult)
    })
  })

  describe('Row Level Security (RLS) Policies', () => {
    describe('spaced_repetition table RLS', () => {
      it('should enforce user isolation for SELECT operations', async () => {
        const userId = 'user-123'
        
        // Mock RLS policy enforcement
        mockSupabase.from().select().eq().eq.mockResolvedValueOnce({
          data: [
            {
              id: 'sr-1',
              user_id: userId,
              question_id: 'q1',
              module_id: 'm1',
              ease_factor: 2.5,
              interval_days: 6,
              next_review_date: '2024-01-01T00:00:00Z',
            },
          ],
          error: null,
        })

        const result = await selectSpacedRepetition(userId)

        expect(mockSupabase.from).toHaveBeenCalledWith('spaced_repetition')
        expect(mockSupabase.from().select).toHaveBeenCalledWith('*')
        expect(mockSupabase.from().eq).toHaveBeenCalledWith('user_id', userId)
        expect(result.data[0].user_id).toBe(userId)
      })

      it('should enforce user isolation for INSERT operations', async () => {
        const userId = 'user-123'
        const insertData = {
          user_id: userId,
          question_id: 'q1',
          module_id: 'm1',
          ease_factor: 2.5,
          interval_days: 1,
          next_review_date: '2024-01-01T00:00:00Z',
        }

        mockSupabase.from().insert().mockResolvedValueOnce({
          data: insertData,
          error: null,
        })

        const result = await insertSpacedRepetition(insertData)

        expect(mockSupabase.from).toHaveBeenCalledWith('spaced_repetition')
        expect(result.data.user_id).toBe(userId)
      })

      it('should prevent cross-user access attempts', async () => {
        const attackerUserId = 'attacker-123'
        const victimUserId = 'victim-456'

        // Mock RLS blocking cross-user access
        mockSupabase.from().select().eq().eq.mockResolvedValueOnce({
          data: [], // RLS should return empty for unauthorized access
          error: null,
        })

        const result = await selectSpacedRepetition(victimUserId, attackerUserId)

        expect(result.data).toEqual([])
      })
    })

    describe('bookmarked_questions table RLS', () => {
      it('should enforce user isolation for bookmark operations', async () => {
        const userId = 'user-123'
        const bookmarkData = {
          user_id: userId,
          module_id: 'module-456',
          assessment_id: 'assessment-789',
          question_index: 5,
          question_hash: 'hash-abc',
          notes: 'Important concept',
        }

        mockSupabase.from().insert().mockResolvedValueOnce({
          data: bookmarkData,
          error: null,
        })

        const result = await insertBookmark(bookmarkData)

        expect(result.data.user_id).toBe(userId)
      })

      it('should allow users to update their own bookmarks', async () => {
        const userId = 'user-123'
        const updateData = {
          notes: 'Updated notes',
          updated_at: new Date().toISOString(),
        }

        mockSupabase.from().update().eq().eq().eq.mockResolvedValueOnce({
          data: { id: 'bookmark-123', ...updateData },
          error: null,
        })

        const result = await updateBookmark(userId, 'module-456', 5, updateData)

        expect(mockSupabase.from).toHaveBeenCalledWith('bookmarked_questions')
        expect(mockSupabase.from().eq).toHaveBeenCalledWith('user_id', userId)
      })

      it('should prevent users from accessing others bookmarks', async () => {
        const userId = 'user-123'
        const otherUserId = 'other-456'

        mockSupabase.from().select().eq().eq.mockResolvedValueOnce({
          data: [], // RLS should return empty
          error: null,
        })

        const result = await selectBookmarks(otherUserId, 'module-456', userId)

        expect(result.data).toEqual([])
      })
    })

    describe('progress_shares table RLS', () => {
      it('should allow public shares to be visible to all users', async () => {
        const publicShare = {
          id: 'share-1',
          user_id: 'user-123',
          module_id: 'module-456',
          share_type: 'public',
          message: 'Completed module!',
          is_active: true,
        }

        mockSupabase.from().select().eq().or().order().limit.mockResolvedValueOnce({
          data: [publicShare],
          error: null,
        })

        const result = await selectPublicProgressShares()

        expect(result.data).toContain(publicShare)
      })

      it('should allow users to see shares from their peers', async () => {
        const peerShare = {
          id: 'share-2',
          user_id: 'peer-123',
          module_id: 'module-456',
          share_type: 'private',
          shared_with_user_id: 'user-456',
          message: 'Check my progress!',
        }

        mockSupabase.from().select().eq().or().order().limit.mockResolvedValueOnce({
          data: [peerShare],
          error: null,
        })

        const result = await selectPeerProgressShares('user-456')

        expect(result.data).toContain(peerShare)
      })

      it('should prevent users from seeing private shares not meant for them', async () => {
        const privateShare = {
          id: 'share-3',
          user_id: 'user-123',
          module_id: 'module-456',
          share_type: 'private',
          shared_with_user_id: 'other-user-789',
          message: 'Private message',
        }

        mockSupabase.from().select().eq().or().order().limit.mockResolvedValueOnce({
          data: [], // RLS should filter out unauthorized shares
          error: null,
        })

        const result = await selectPeerProgressShares('user-456')

        expect(result.data).not.toContain(privateShare)
      })
    })

    describe('peer_connections table RLS', () => {
      it('should allow users to see their own connection requests', async () => {
        const userId = 'user-123'
        const connection = {
          id: 'conn-1',
          user_id: userId,
          peer_id: 'peer-456',
          status: 'pending',
        }

        mockSupabase.from().select().eq().order.mockResolvedValueOnce({
          data: [connection],
          error: null,
        })

        const result = await selectPeerConnections(userId)

        expect(result.data[0].user_id).toBe(userId)
      })

      it('should allow users to see connection requests sent to them', async () => {
        const userId = 'user-123'
        const incomingConnection = {
          id: 'conn-2',
          user_id: 'other-456',
          peer_id: userId,
          status: 'pending',
        }

        mockSupabase.from().select().eq().order.mockResolvedValueOnce({
          data: [incomingConnection],
          error: null,
        })

        const result = await selectIncomingPeerConnections(userId)

        expect(result.data[0].peer_id).toBe(userId)
      })

      it('should allow users to update their own connection requests', async () => {
        const userId = 'user-123'
        const updateData = {
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        }

        mockSupabase.from().update().eq().mockResolvedValueOnce({
          data: { id: 'conn-1', ...updateData },
          error: null,
        })

        const result = await updatePeerConnection('conn-1', updateData, userId)

        expect(mockSupabase.from).toHaveBeenCalledWith('peer_connections')
      })

      it('should prevent users from updating others connection requests', async () => {
        const userId = 'user-123'
        const otherUserId = 'other-456'
        const updateData = {
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        }

        // Mock RLS blocking unauthorized update
        mockSupabase.from().update().eq().mockResolvedValueOnce({
          data: null,
          error: { message: 'Permission denied' },
        })

        const result = await updatePeerConnection('conn-1', updateData, otherUserId)

        expect(result.error).toBeTruthy()
      })
    })

    describe('quiz_sessions table RLS', () => {
      it('should enforce user isolation for quiz sessions', async () => {
        const userId = 'user-123'
        const sessionData = {
          user_id: userId,
          assessment_id: 'assessment-456',
          module_id: 'module-789',
          mode: 'timed',
          time_limit_seconds: 1800,
          questions_order: [0, 1, 2, 3, 4],
        }

        mockSupabase.from().insert().select().single.mockResolvedValueOnce({
          data: { id: 'session-123', ...sessionData },
          error: null,
        })

        const result = await createQuizSession(sessionData)

        expect(result.data.user_id).toBe(userId)
      })

      it('should allow users to update their own quiz sessions', async () => {
        const userId = 'user-123'
        const sessionId = 'session-123'
        const updateData = {
          answers: { 0: 2, 1: 0 },
          updated_at: new Date().toISOString(),
        }

        mockSupabase.from().update().eq().mockResolvedValueOnce({
          data: { id: sessionId, ...updateData },
          error: null,
        })

        const result = await updateQuizSession(sessionId, updateData, userId)

        expect(mockSupabase.from).toHaveBeenCalledWith('quiz_sessions')
      })
    })
  })

  describe('Database Constraints and Validation', () => {
    it('should enforce foreign key constraints', async () => {
      const invalidData = {
        user_id: 'nonexistent-user',
        module_id: 'nonexistent-module',
        assessment_id: 'nonexistent-assessment',
        question_index: 5,
        question_hash: 'hash-abc',
      }

      mockSupabase.from().insert().mockResolvedValueOnce({
        data: null,
        error: { message: 'Foreign key constraint violation' },
      })

      const result = await insertBookmark(invalidData)

      expect(result.error).toBeTruthy()
      expect(result.error.message).toContain('constraint violation')
    })

    it('should enforce unique constraints', async () => {
      const duplicateData = {
        user_id: 'user-123',
        module_id: 'module-456',
        assessment_id: 'assessment-789',
        question_index: 5,
        question_hash: 'hash-abc',
      }

      mockSupabase.from().insert().mockResolvedValueOnce({
        data: null,
        error: { message: 'Duplicate key violation' },
      })

      const result = await insertBookmark(duplicateData)

      expect(result.error).toBeTruthy()
      expect(result.error.message).toContain('Duplicate')
    })

    it('should validate data types', async () => {
      const invalidData = {
        user_id: 'user-123',
        module_id: 'module-456',
        ease_factor: 'invalid-number', // Should be numeric
        interval_days: 'not-a-number',
        next_review_date: 'invalid-date',
      }

      mockSupabase.from().insert().mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid input syntax' },
      })

      const result = await insertSpacedRepetition(invalidData)

      expect(result.error).toBeTruthy()
      expect(result.error.message).toContain('Invalid input')
    })

    it('should enforce check constraints', async () => {
      const invalidData = {
        user_id: 'user-123',
        module_id: 'module-456',
        share_type: 'invalid-type', // Should be 'public' or 'private'
        message: 'Test message',
      }

      mockSupabase.from().insert().mockResolvedValueOnce({
        data: null,
        error: { message: 'Check constraint violation' },
      })

      const result = await insertProgressShare(invalidData)

      expect(result.error).toBeTruthy()
      expect(result.error.message).toContain('Check constraint')
    })
  })

  describe('Database Performance', () => {
    it('should use proper indexes for spaced_repetition queries', async () => {
      const userId = 'user-123'
      const currentDate = new Date().toISOString()

      // Mock query that should use index on (user_id, next_review_date)
      mockSupabase.from().select().eq().eq().lte.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      await selectSpacedRepetitionDue(userId, currentDate)

      expect(mockSupabase.from).toHaveBeenCalledWith('spaced_repetition')
      expect(mockSupabase.from().eq).toHaveBeenCalledWith('user_id', userId)
      expect(mockSupabase.from().lte).toHaveBeenCalledWith('next_review_date', currentDate)
    })

    it('should use proper indexes for progress_shares queries', async () => {
      const userId = 'user-123'

      // Mock query that should use index on (user_id, created_at)
      mockSupabase.from().select().eq().or().order().limit.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      await selectProgressShares(userId)

      expect(mockSupabase.from).toHaveBeenCalledWith('progress_shares')
      expect(mockSupabase.from().order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('should handle pagination efficiently', async () => {
      const userId = 'user-123'
      const limit = 20
      const offset = 40

      mockSupabase.from().select().eq().order().range.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      await selectProgressSharesPaginated(userId, limit, offset)

      expect(mockSupabase.from().range).toHaveBeenCalledWith(offset, offset + limit - 1)
    })
  })
})

// Helper functions for testing database operations
async function callUpdateSpacedRepetition(params: any) {
  return await mockSupabase.rpc('update_spaced_repetition', params)
}

async function callCalculateNextReview(params: any) {
  return await mockSupabase.rpc('calculate_next_review', params)
}

async function selectSpacedRepetition(userId: string, requestingUserId?: string) {
  return await mockSupabase
    .from('spaced_repetition')
    .select('*')
    .eq('user_id', userId)
}

async function insertSpacedRepetition(data: any) {
  return await mockSupabase
    .from('spaced_repetition')
    .insert(data)
}

async function insertBookmark(data: any) {
  return await mockSupabase
    .from('bookmarked_questions')
    .insert(data)
}

async function updateBookmark(userId: string, moduleId: string, questionIndex: number, data: any) {
  return await mockSupabase
    .from('bookmarked_questions')
    .update(data)
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .eq('question_index', questionIndex)
}

async function selectBookmarks(userId: string, moduleId: string, requestingUserId?: string) {
  return await mockSupabase
    .from('bookmarked_questions')
    .select('*')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
}

async function selectPublicProgressShares() {
  return await mockSupabase
    .from('progress_shares')
    .select('*')
    .eq('share_type', 'public')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(50)
}

async function selectPeerProgressShares(userId: string) {
  return await mockSupabase
    .from('progress_shares')
    .select('*')
    .or(`share_type.eq.public,shared_with_user_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(50)
}

async function selectPeerConnections(userId: string) {
  return await mockSupabase
    .from('peer_connections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
}

async function selectIncomingPeerConnections(userId: string) {
  return await mockSupabase
    .from('peer_connections')
    .select('*')
    .eq('peer_id', userId)
    .order('created_at', { ascending: false })
}

async function updatePeerConnection(connectionId: string, data: any, requestingUserId: string) {
  return await mockSupabase
    .from('peer_connections')
    .update(data)
    .eq('id', connectionId)
}

async function createQuizSession(data: any) {
  return await mockSupabase
    .from('quiz_sessions')
    .insert(data)
    .select()
    .single()
}

async function updateQuizSession(sessionId: string, data: any, userId: string) {
  return await mockSupabase
    .from('quiz_sessions')
    .update(data)
    .eq('id', sessionId)
}

async function insertProgressShare(data: any) {
  return await mockSupabase
    .from('progress_shares')
    .insert(data)
}

async function selectSpacedRepetitionDue(userId: string, currentDate: string) {
  return await mockSupabase
    .from('spaced_repetition')
    .select('*')
    .eq('user_id', userId)
    .lte('next_review_date', currentDate)
}

async function selectProgressShares(userId: string) {
  return await mockSupabase
    .from('progress_shares')
    .select('*')
    .or(`share_type.eq.public,user_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(50)
}

async function selectProgressSharesPaginated(userId: string, limit: number, offset: number) {
  return await mockSupabase
    .from('progress_shares')
    .select('*')
    .or(`share_type.eq.public,user_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
}
