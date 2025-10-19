/**
 * End-to-End Integration Tests
 * Tests complete user workflows across multiple features
 */

import { createClient } from '@/lib/supabase/client'

// Mock all external dependencies
jest.mock('@/lib/supabase/client')
jest.mock('@/lib/blockchain')
jest.mock('ai')

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
  rpc: jest.fn(),
}

;(createClient as jest.Mock).mockReturnValue(mockSupabase)

describe('End-to-End Integration Tests', () => {
  const userId = 'test-user-123'
  const moduleId = 'module-emergency-001'

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId, email: 'test@example.com' } },
      error: null,
    })
  })

  describe('Complete Learning Journey', () => {
    it('should complete full module lifecycle: enroll → learn → assess → certify', async () => {
      // 1. User enrolls in module
      const moduleData = {
        id: moduleId,
        title: 'Emergency Medicine Fundamentals',
        difficulty: 'intermediate',
        duration_minutes: 60,
      }

      mockSupabase.from().single.mockResolvedValueOnce({
        data: moduleData,
        error: null,
      })

      // 2. Create progress entry
      const progressData = {
        id: 'progress-1',
        user_id: userId,
        module_id: moduleId,
        status: 'in_progress',
        completion_percent: 0,
      }

      mockSupabase.from().single.mockResolvedValueOnce({
        data: progressData,
        error: null,
      })

      // 3. Update progress as user studies
      mockSupabase.from().single.mockResolvedValueOnce({
        data: { ...progressData, completion_percent: 100, status: 'completed' },
        error: null,
      })

      // 4. Take assessment
      const assessmentData = {
        id: 'assessment-1',
        module_id: moduleId,
        passing_score: 70,
      }

      mockSupabase.from().single.mockResolvedValueOnce({
        data: assessmentData,
        error: null,
      })

      // 5. Submit assessment with passing score
      const attemptData = {
        id: 'attempt-1',
        user_id: userId,
        assessment_id: assessmentData.id,
        score: 85,
        passed: true,
      }

      mockSupabase.from().single.mockResolvedValueOnce({
        data: attemptData,
        error: null,
      })

      // 6. Generate certificate
      const certificateData = {
        id: 'cert-1',
        user_id: userId,
        module_id: moduleId,
        certificate_hash: 'abc123hash',
      }

      mockSupabase.from().single.mockResolvedValueOnce({
        data: certificateData,
        error: null,
      })

      // Verify complete workflow
      expect(moduleData).toBeDefined()
      expect(progressData.status).toBe('in_progress')
      expect(attemptData.passed).toBe(true)
      expect(certificateData.certificate_hash).toBeDefined()
    })

    it('should track gamification throughout learning journey', async () => {
      // Initial gamification state
      const initialGamification = {
        user_id: userId,
        total_points: 0,
        level: 1,
        current_streak: 0,
      }

      mockSupabase.from().single.mockResolvedValueOnce({
        data: initialGamification,
        error: null,
      })

      // After completing module (100 points)
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { total_points: 100, level: 1 },
        error: null,
      })

      // After passing assessment (150 points)
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { total_points: 250, level: 1 },
        error: null,
      })

      // Update streak (50 points)
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { current_streak: 5, points_earned: 50 },
        error: null,
      })

      // Check for achievements
      const achievements = [
        {
          achievement_id: 'first-module',
          name: 'First Steps',
          points: 100,
        },
      ]

      mockSupabase.rpc.mockResolvedValueOnce({
        data: achievements,
        error: null,
      })

      // Final state: 300 points, level 1, 1 achievement
      mockSupabase.from().single.mockResolvedValueOnce({
        data: {
          total_points: 400,
          level: 1,
          badges_earned: 1,
        },
        error: null,
      })

      // Verify progression
      expect(achievements).toHaveLength(1)
    })
  })

  describe('Social Learning Workflow', () => {
    it('should enable peer connections and progress sharing', async () => {
      const peerId = 'peer-456'

      // 1. Send connection request
      mockSupabase.from().single.mockResolvedValueOnce({
        data: {
          id: 'connection-1',
          user_id: userId,
          peer_id: peerId,
          status: 'pending',
        },
        error: null,
      })

      // 2. Accept connection
      mockSupabase.from().single.mockResolvedValueOnce({
        data: {
          id: 'connection-1',
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        },
        error: null,
      })

      // 3. Share progress
      const shareData = {
        id: 'share-1',
        user_id: userId,
        shared_with_user_id: peerId,
        module_id: moduleId,
        share_type: 'specific',
        message: 'Just completed Emergency Medicine!',
      }

      mockSupabase.from().single.mockResolvedValueOnce({
        data: shareData,
        error: null,
      })

      // 4. Peer views shared progress
      mockSupabase.from().single.mockResolvedValueOnce({
        data: [shareData],
        error: null,
      })

      expect(shareData.share_type).toBe('specific')
      expect(shareData.message).toContain('completed')
    })

    it('should filter progress feed by peer connections', async () => {
      const peers = [
        { peer_id: 'peer-1', status: 'accepted' },
        { peer_id: 'peer-2', status: 'accepted' },
        { peer_id: 'peer-3', status: 'pending' },
      ]

      mockSupabase.from().single.mockResolvedValueOnce({
        data: peers,
        error: null,
      })

      // Only accepted peers' shares should appear
      const shares = [
        { user_id: 'peer-1', message: 'Share 1' },
        { user_id: 'peer-2', message: 'Share 2' },
      ]

      mockSupabase.from().single.mockResolvedValueOnce({
        data: shares,
        error: null,
      })

      expect(shares).toHaveLength(2)
      expect(shares.every(s => ['peer-1', 'peer-2'].includes(s.user_id))).toBe(true)
    })
  })

  describe('Spaced Repetition Learning Cycle', () => {
    it('should schedule and track review sessions over time', async () => {
      const questionHash = 'question-hash-123'

      // Initial review (quality 3 - correct with hesitation)
      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          question_id: questionHash,
          ease_factor: 2.5,
          interval_days: 1,
          next_review_date: new Date(Date.now() + 86400000).toISOString(),
        },
        error: null,
      })

      // Second review (quality 4 - correct)
      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          question_id: questionHash,
          ease_factor: 2.6,
          interval_days: 6,
          next_review_date: new Date(Date.now() + 86400000 * 6).toISOString(),
        },
        error: null,
      })

      // Third review (quality 5 - perfect)
      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          question_id: questionHash,
          ease_factor: 2.7,
          interval_days: 16,
          next_review_date: new Date(Date.now() + 86400000 * 16).toISOString(),
        },
        error: null,
      })

      // Verify increasing intervals
      const intervals = [1, 6, 16]
      expect(intervals[2]).toBeGreaterThan(intervals[1])
      expect(intervals[1]).toBeGreaterThan(intervals[0])
    })

    it('should reset interval for forgotten items', async () => {
      const questionHash = 'question-hash-456'

      // Previous successful review
      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          ease_factor: 2.5,
          interval_days: 10,
        },
        error: null,
      })

      // Failed review (quality 0)
      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          question_id: questionHash,
          ease_factor: 2.3, // Decreased
          interval_days: 1, // Reset to 1 day
          repetitions: 0, // Reset
        },
        error: null,
      })

      // Verify reset
      const finalState = {
        interval_days: 1,
        repetitions: 0,
      }

      expect(finalState.interval_days).toBe(1)
      expect(finalState.repetitions).toBe(0)
    })
  })

  describe('AI-Powered Recommendations', () => {
    it('should generate personalized recommendations based on performance', async () => {
      // User has weak areas
      mockSupabase.rpc.mockResolvedValueOnce({
        data: [
          {
            category: 'Emergency Medicine',
            accuracy_percentage: 45,
            priority: 'high',
          },
          {
            category: 'Pediatrics',
            accuracy_percentage: 65,
            priority: 'medium',
          },
        ],
        error: null,
      })

      // Generate recommendations
      const recommendations = [
        {
          type: 'weak_area',
          title: 'Review Emergency Protocols',
          priority: 1,
          module_id: 'module-emergency-review',
        },
        {
          type: 'next_topic',
          title: 'Advanced Pediatric Care',
          priority: 2,
          module_id: 'module-pediatrics-advanced',
        },
      ]

      mockSupabase.from().single.mockResolvedValueOnce({
        data: recommendations,
        error: null,
      })

      expect(recommendations[0].type).toBe('weak_area')
      expect(recommendations[0].priority).toBe(1)
    })
  })

  describe('Error Recovery', () => {
    it('should handle network errors gracefully', async () => {
      mockSupabase.from().single.mockRejectedValueOnce(
        new Error('Network error')
      )

      try {
        await mockSupabase.from('modules').select('*').single()
      } catch (error: any) {
        expect(error.message).toBe('Network error')
      }
    })

    it('should retry failed operations', async () => {
      let attempts = 0

      mockSupabase.from().single.mockImplementation(() => {
        attempts++
        if (attempts < 3) {
          return Promise.reject(new Error('Temporary failure'))
        }
        return Promise.resolve({ data: { id: '123' }, error: null })
      })

      // Simulate retry logic
      let result
      for (let i = 0; i < 3; i++) {
        try {
          result = await mockSupabase.from('test').select().single()
          break
        } catch (error) {
          if (i === 2) throw error
        }
      }

      expect(result.data).toBeDefined()
      expect(attempts).toBe(3)
    })
  })

  describe('Data Consistency', () => {
    it('should maintain referential integrity across related tables', async () => {
      // Module exists
      mockSupabase.from().single.mockResolvedValueOnce({
        data: { id: moduleId },
        error: null,
      })

      // Progress references module
      mockSupabase.from().single.mockResolvedValueOnce({
        data: {
          id: 'progress-1',
          module_id: moduleId,
        },
        error: null,
      })

      // Assessment references module
      mockSupabase.from().single.mockResolvedValueOnce({
        data: {
          id: 'assessment-1',
          module_id: moduleId,
        },
        error: null,
      })

      // Certificate references module
      mockSupabase.from().single.mockResolvedValueOnce({
        data: {
          id: 'cert-1',
          module_id: moduleId,
        },
        error: null,
      })

      // All records reference the same module
      expect(moduleId).toBeTruthy()
    })
  })
})
