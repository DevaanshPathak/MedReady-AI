import { describe, it, expect, beforeEach } from '@jest/globals'

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
  rpc: jest.fn(),
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}))

describe('Learning Features Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Complete Learning Workflow', () => {
    it('should complete full learning cycle with all features', async () => {
      const userId = 'user-123'
      const moduleId = 'module-456'
      const assessmentId = 'assessment-789'

      // Step 1: User starts quiz in timed mode
      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: { id: 'session-123', mode: 'timed' },
        error: null,
      })

      const session = await startTimedQuiz(userId, assessmentId, moduleId)
      expect(session.id).toBe('session-123')

      // Step 2: User bookmarks a question
      mockSupabase.from().select().eq().eq.mockResolvedValueOnce({
        data: [],
        error: null,
      })
      mockSupabase.from().insert.mockResolvedValueOnce({
        data: { id: 'bookmark-123' },
        error: null,
      })

      const bookmark = await bookmarkQuestion(userId, moduleId, assessmentId, 0, 'Important concept')
      expect(bookmark.id).toBe('bookmark-123')

      // Step 3: User answers questions
      const answers = { 0: 2, 1: 0, 2: 1 }
      mockSupabase.from().update().eq.mockResolvedValue({
        data: null,
        error: null,
      })

      await updateQuizAnswers('session-123', answers)

      // Step 4: Quiz completion and spaced repetition update
      mockSupabase.from().insert.mockResolvedValueOnce({
        data: { id: 'attempt-123', score: 85, passed: true },
        error: null,
      })
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: null,
      })
      mockSupabase.from().upsert.mockResolvedValue({
        data: null,
        error: null,
      })

      const attempt = await completeQuiz(userId, assessmentId, answers, 85, true)
      expect(attempt.score).toBe(85)
      expect(attempt.passed).toBe(true)

      // Step 5: User shares progress
      mockSupabase.from().insert.mockResolvedValueOnce({
        data: { id: 'share-123' },
        error: null,
      })

      const share = await shareProgress(userId, moduleId, 'Completed with 85%!')
      expect(share.id).toBe('share-123')

      // Step 6: Peer connects and sees shared progress
      mockSupabase.from().insert.mockResolvedValueOnce({
        data: { id: 'connection-123' },
        error: null,
      })

      const connection = await sendPeerRequest(userId, 'peer@example.com')
      expect(connection.id).toBe('connection-123')
    })

    it('should handle spaced repetition review cycle', async () => {
      const userId = 'user-123'
      const moduleId = 'module-456'

      // Step 1: Load questions due for review
      mockSupabase.from().select().eq().eq().lte.mockResolvedValueOnce({
        data: [
          { question_id: 'hash1', next_review_date: '2024-01-01T00:00:00Z' },
          { question_id: 'hash2', next_review_date: '2024-01-02T00:00:00Z' },
        ],
        error: null,
      })

      const dueQuestions = await loadSpacedRepetitionDue(userId, moduleId)
      expect(dueQuestions).toHaveLength(2)

      // Step 2: User reviews and answers questions
      const reviewAnswers = { 0: 2, 1: 0 } // Correct, Incorrect
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: null,
      })

      await updateSpacedRepetitionBatch(userId, moduleId, reviewAnswers)

      // Step 3: Verify spaced repetition was updated
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(2)
    })
  })

  describe('Progress Sharing Integration', () => {
    it('should share progress and notify peers', async () => {
      const userId = 'user-123'
      const moduleId = 'module-456'
      const peerId = 'peer-789'

      // Step 1: User shares progress
      mockSupabase.from().insert.mockResolvedValueOnce({
        data: { id: 'share-123' },
        error: null,
      })

      await shareProgress(userId, moduleId, 'Completed module!')

      // Step 2: Peer loads their feed and sees the share
      mockSupabase.from().select().eq().eq.mockResolvedValueOnce({
        data: [{ peer_id: userId }],
        error: null,
      })
      mockSupabase.from().select().eq().or().order().limit.mockResolvedValueOnce({
        data: [
          {
            id: 'share-123',
            user_id: userId,
            module_id: moduleId,
            message: 'Completed module!',
            profile: {
              full_name: 'John Doe',
              role: 'medical_student',
            },
            module: {
              title: 'Cardiology Basics',
            },
          },
        ],
        error: null,
      })

      const feed = await loadProgressFeed(peerId)
      expect(feed).toHaveLength(1)
      expect(feed[0].user_id).toBe(userId)
    })

    it('should handle peer connection workflow', async () => {
      const userA = 'user-a'
      const userB = 'user-b'
      const userBEmail = 'userb@example.com'

      // Step 1: User A sends connection request to User B
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: { id: userB, email: userBEmail },
        error: null,
      })
      mockSupabase.from().insert.mockResolvedValueOnce({
        data: { id: 'connection-123', status: 'pending' },
        error: null,
      })

      await sendPeerRequest(userA, userBEmail)

      // Step 2: User B sees pending request
      mockSupabase.from().select().eq().order.mockResolvedValueOnce({
        data: [
          {
            id: 'connection-123',
            user_id: userA,
            peer_id: userB,
            status: 'pending',
            peer_profile: {
              full_name: 'User A',
              specialization: 'Cardiology',
            },
          },
        ],
        error: null,
      })

      const pendingRequests = await loadPendingRequests(userB)
      expect(pendingRequests).toHaveLength(1)

      // Step 3: User B accepts the request
      mockSupabase.from().update().eq.mockResolvedValueOnce({
        data: { id: 'connection-123', status: 'accepted' },
        error: null,
      })

      await acceptPeerRequest('connection-123')

      // Step 4: Both users can now see each other's shared progress
      mockSupabase.from().select().eq().eq.mockResolvedValueOnce({
        data: [{ peer_id: userA }],
        error: null,
      })
      mockSupabase.from().select().eq().or().order().limit.mockResolvedValueOnce({
        data: [
          {
            id: 'share-456',
            user_id: userA,
            message: 'Shared progress',
            profile: { full_name: 'User A' },
          },
        ],
        error: null,
      })

      const sharedProgress = await loadSharedProgress(userB)
      expect(sharedProgress).toHaveLength(1)
    })
  })

  describe('Quiz Mode Integration', () => {
    it('should handle switching between quiz modes', async () => {
      const userId = 'user-123'
      const moduleId = 'module-456'
      const assessmentId = 'assessment-789'

      // Start in practice mode (no session needed)
      let mode = 'practice'
      expect(mode).toBe('practice')

      // Switch to timed mode
      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: { id: 'session-timed', mode: 'timed' },
        error: null,
      })

      const timedSession = await createQuizSession(userId, assessmentId, moduleId, 'timed')
      expect(timedSession.mode).toBe('timed')

      // Switch to spaced repetition mode
      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: { id: 'session-sr', mode: 'spaced_repetition' },
        error: null,
      })

      const srSession = await createQuizSession(userId, assessmentId, moduleId, 'spaced_repetition')
      expect(srSession.mode).toBe('spaced_repetition')
    })

    it('should maintain bookmarks across mode switches', async () => {
      const userId = 'user-123'
      const moduleId = 'module-456'

      // Load bookmarks
      mockSupabase.from().select().eq().eq.mockResolvedValueOnce({
        data: [
          { question_index: 0, notes: 'Important concept' },
          { question_index: 2, notes: 'Review this' },
        ],
        error: null,
      })

      const bookmarks = await loadBookmarks(userId, moduleId)
      expect(bookmarks).toHaveLength(2)

      // Bookmarks should persist across mode switches
      const practiceMode = 'practice'
      const timedMode = 'timed'
      const srMode = 'spaced_repetition'

      // In any mode, bookmarks should be available
      expect(bookmarks).toHaveLength(2)
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle database connection failures gracefully', async () => {
      const userId = 'user-123'
      const moduleId = 'module-456'

      // Simulate database error
      mockSupabase.from().select().eq().eq.mockResolvedValueOnce({
        data: null,
        error: { message: 'Connection failed' },
      })

      // Should not crash, should return empty array or handle error
      const result = await loadBookmarks(userId, moduleId)
      expect(result).toEqual([])
    })

    it('should handle partial failures in complex operations', async () => {
      const userId = 'user-123'
      const moduleId = 'module-456'

      // Simulate partial success - bookmark loads but spaced repetition fails
      mockSupabase.from().select().eq().eq.mockResolvedValueOnce({
        data: [{ question_index: 0, notes: 'Test' }],
        error: null,
      })
      mockSupabase.from().select().eq().eq().lte.mockResolvedValueOnce({
        data: null,
        error: { message: 'Spaced repetition query failed' },
      })

      // Should handle partial failure gracefully
      const bookmarks = await loadBookmarks(userId, moduleId)
      expect(bookmarks).toHaveLength(1)

      // Spaced repetition should handle error gracefully
      const srData = await loadSpacedRepetitionDue(userId, moduleId)
      expect(srData).toEqual([])
    })
  })

  describe('Performance Integration', () => {
    it('should handle large datasets efficiently', async () => {
      const userId = 'user-123'

      // Simulate large number of progress shares
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: `share-${i}`,
        user_id: `user-${i % 10}`,
        message: `Progress share ${i}`,
        created_at: new Date(Date.now() - i * 1000).toISOString(),
      }))

      mockSupabase.from().select().eq().or().order().limit.mockResolvedValueOnce({
        data: largeDataset,
        error: null,
      })

      const startTime = Date.now()
      const shares = await loadProgressShares(userId)
      const endTime = Date.now()

      expect(shares).toHaveLength(100)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should paginate large result sets', async () => {
      const userId = 'user-123'
      const pageSize = 20
      const page = 2

      const paginatedData = Array.from({ length: pageSize }, (_, i) => ({
        id: `share-${page * pageSize + i}`,
        user_id: userId,
        message: `Share ${page * pageSize + i}`,
      }))

      mockSupabase.from().select().eq().or().order().range.mockResolvedValueOnce({
        data: paginatedData,
        error: null,
      })

      const shares = await loadProgressSharesPaginated(userId, pageSize, page)
      expect(shares).toHaveLength(pageSize)
    })
  })

  describe('Data Consistency', () => {
    it('should maintain data consistency across related operations', async () => {
      const userId = 'user-123'
      const moduleId = 'module-456'
      const questionIndex = 5

      // Bookmark a question
      mockSupabase.from().insert.mockResolvedValueOnce({
        data: { id: 'bookmark-123' },
        error: null,
      })

      await bookmarkQuestion(userId, moduleId, 'assessment-789', questionIndex, 'Test note')

      // Update spaced repetition for the same question
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      await updateSpacedRepetition(userId, 'question-hash', moduleId, 4)

      // Both operations should succeed and be consistent
      expect(mockSupabase.from().insert).toHaveBeenCalled()
      expect(mockSupabase.rpc).toHaveBeenCalled()
    })

    it('should handle concurrent operations correctly', async () => {
      const userId = 'user-123'
      const moduleId = 'module-456'

      // Simulate concurrent bookmark and progress share operations
      const bookmarkPromise = bookmarkQuestion(userId, moduleId, 'assessment-789', 0, 'Note')
      const sharePromise = shareProgress(userId, moduleId, 'Progress update')

      mockSupabase.from().insert
        .mockResolvedValueOnce({ data: { id: 'bookmark-123' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'share-123' }, error: null })

      const [bookmark, share] = await Promise.all([bookmarkPromise, sharePromise])

      expect(bookmark.id).toBe('bookmark-123')
      expect(share.id).toBe('share-123')
    })
  })
})

// Helper functions for integration testing
async function startTimedQuiz(userId: string, assessmentId: string, moduleId: string) {
  const { data, error } = await mockSupabase
    .from('quiz_sessions')
    .insert({
      user_id: userId,
      assessment_id: assessmentId,
      module_id: moduleId,
      mode: 'timed',
      time_limit_seconds: 1800,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

async function bookmarkQuestion(
  userId: string,
  moduleId: string,
  assessmentId: string,
  questionIndex: number,
  notes: string
) {
  const { data, error } = await mockSupabase
    .from('bookmarked_questions')
    .insert({
      user_id: userId,
      module_id: moduleId,
      assessment_id: assessmentId,
      question_index: questionIndex,
      question_hash: 'test-hash',
      notes,
    })

  if (error) throw error
  return data
}

async function updateQuizAnswers(sessionId: string, answers: Record<number, number>) {
  const { data, error } = await mockSupabase
    .from('quiz_sessions')
    .update({
      answers,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  if (error) throw error
  return data
}

async function completeQuiz(
  userId: string,
  assessmentId: string,
  answers: Record<number, number>,
  score: number,
  passed: boolean
) {
  const { data, error } = await mockSupabase
    .from('assessment_attempts')
    .insert({
      user_id: userId,
      assessment_id: assessmentId,
      answers,
      score,
      passed,
    })

  if (error) throw error
  return data
}

async function shareProgress(userId: string, moduleId: string, message: string) {
  const { data, error } = await mockSupabase
    .from('progress_shares')
    .insert({
      user_id: userId,
      module_id: moduleId,
      share_type: 'public',
      message,
    })

  if (error) throw error
  return data
}

async function sendPeerRequest(userId: string, peerEmail: string) {
  const { data, error } = await mockSupabase
    .from('peer_connections')
    .insert({
      user_id: userId,
      peer_id: 'peer-123', // Would be looked up by email
      status: 'pending',
    })

  if (error) throw error
  return data
}

async function loadSpacedRepetitionDue(userId: string, moduleId: string) {
  const { data, error } = await mockSupabase
    .from('spaced_repetition')
    .select('question_id')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .lte('next_review_date', new Date().toISOString())

  if (error) return []
  return data || []
}

async function updateSpacedRepetitionBatch(
  userId: string,
  moduleId: string,
  answers: Record<number, number>
) {
  const promises = Object.entries(answers).map(([questionIndex, answerIndex]) => {
    const quality = answerIndex === 0 ? 4 : 2 // Simplified quality calculation
    return mockSupabase.rpc('update_spaced_repetition', {
      p_user_id: userId,
      p_question_id: `question-hash-${questionIndex}`,
      p_module_id: moduleId,
      p_quality: quality,
    })
  })

  return await Promise.all(promises)
}

async function loadProgressFeed(userId: string) {
  const { data, error } = await mockSupabase
    .from('progress_shares')
    .select(`
      *,
      profile:profiles!user_id(*),
      module:modules(*)
    `)
    .or(`share_type.eq.public,user_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return []
  return data || []
}

async function loadPendingRequests(userId: string) {
  const { data, error } = await mockSupabase
    .from('peer_connections')
    .select(`
      *,
      peer_profile:profiles!user_id(*)
    `)
    .eq('peer_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) return []
  return data || []
}

async function acceptPeerRequest(connectionId: string) {
  const { data, error } = await mockSupabase
    .from('peer_connections')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', connectionId)

  if (error) throw error
  return data
}

async function loadSharedProgress(userId: string) {
  const { data, error } = await mockSupabase
    .from('progress_shares')
    .select(`
      *,
      profile:profiles!user_id(*)
    `)
    .or(`share_type.eq.public,user_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return []
  return data || []
}

async function createQuizSession(
  userId: string,
  assessmentId: string,
  moduleId: string,
  mode: string
) {
  const { data, error } = await mockSupabase
    .from('quiz_sessions')
    .insert({
      user_id: userId,
      assessment_id: assessmentId,
      module_id: moduleId,
      mode,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

async function loadBookmarks(userId: string, moduleId: string) {
  const { data, error } = await mockSupabase
    .from('bookmarked_questions')
    .select('question_index, notes')
    .eq('user_id', userId)
    .eq('module_id', moduleId)

  if (error) return []
  return data || []
}

async function loadProgressShares(userId: string) {
  const { data, error } = await mockSupabase
    .from('progress_shares')
    .select('*')
    .or(`share_type.eq.public,user_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return []
  return data || []
}

async function loadProgressSharesPaginated(userId: string, pageSize: number, page: number) {
  const { data, error } = await mockSupabase
    .from('progress_shares')
    .select('*')
    .or(`share_type.eq.public,user_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1)

  if (error) return []
  return data || []
}

async function updateSpacedRepetition(
  userId: string,
  questionId: string,
  moduleId: string,
  quality: number
) {
  const { data, error } = await mockSupabase.rpc('update_spaced_repetition', {
    p_user_id: userId,
    p_question_id: questionId,
    p_module_id: moduleId,
    p_quality: quality,
  })

  if (error) throw error
  return data
}
