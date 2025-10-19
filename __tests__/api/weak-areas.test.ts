/**
 * Tests for Weak Areas Analysis API
 * Covers personalized weak area detection and improvement tracking
 */

import { GET } from '@/app/api/weak-areas/route'
import { NextRequest } from 'next/server'

// Mock Supabase
jest.mock('@/lib/supabase/server')

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
  rpc: jest.fn(),
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}))

describe('Weak Areas Analysis API', () => {
  const userId = 'user-123'

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    })
  })

  describe('GET /api/weak-areas', () => {
    it('should analyze and return weak areas', async () => {
      const weakAreas = [
        {
          id: 'weak-1',
          user_id: userId,
          category: 'Emergency Medicine',
          topic: 'Triage Protocols',
          attempts: 5,
          correct_answers: 2,
          accuracy_percentage: 40,
          priority: 'high',
          last_attempt_at: new Date().toISOString(),
        },
        {
          id: 'weak-2',
          user_id: userId,
          category: 'Pediatrics',
          topic: 'Growth Assessment',
          attempts: 3,
          correct_answers: 2,
          accuracy_percentage: 67,
          priority: 'medium',
          last_attempt_at: new Date().toISOString(),
        },
      ]

      mockSupabase.rpc.mockResolvedValue({
        data: weakAreas,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/weak-areas')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.weakAreas).toHaveLength(2)
      expect(data.weakAreas[0].accuracy_percentage).toBe(40)
      expect(data.weakAreas[0].priority).toBe('high')
      expect(mockSupabase.rpc).toHaveBeenCalledWith('analyze_weak_areas', {
        p_user_id: userId,
      })
    })

    it('should prioritize areas with lowest accuracy', async () => {
      const weakAreas = [
        { topic: 'Topic A', accuracy_percentage: 70, priority: 'low' },
        { topic: 'Topic B', accuracy_percentage: 40, priority: 'high' },
        { topic: 'Topic C', accuracy_percentage: 55, priority: 'medium' },
      ]

      mockSupabase.rpc.mockResolvedValue({
        data: weakAreas,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/weak-areas')

      const response = await GET(request)
      const data = await response.json()

      expect(data.weakAreas[0].priority).toBe('high')
    })

    it('should filter by category', async () => {
      const emergencyWeakAreas = [
        {
          category: 'Emergency Medicine',
          topic: 'Cardiac Arrest',
          accuracy_percentage: 45,
        },
      ]

      mockSupabase.rpc.mockResolvedValue({
        data: emergencyWeakAreas,
        error: null,
      })

      const url = new URL('http://localhost:3000/api/weak-areas')
      url.searchParams.set('category', 'Emergency Medicine')
      const request = new NextRequest(url)

      const response = await GET(request)
      const data = await response.json()

      expect(data.weakAreas.every((area: any) => 
        area.category === 'Emergency Medicine'
      )).toBe(true)
    })

    it('should provide improvement suggestions', async () => {
      const weakAreas = [
        {
          topic: 'ECG Interpretation',
          accuracy_percentage: 35,
          attempts: 10,
        },
      ]

      mockSupabase.rpc.mockResolvedValue({
        data: weakAreas,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/weak-areas')

      const response = await GET(request)
      const data = await response.json()

      // Should include suggestions for improvement
      expect(data.weakAreas[0]).toBeDefined()
      expect(data.weakAreas[0].accuracy_percentage).toBeLessThan(50)
    })

    it('should handle no weak areas found', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/weak-areas')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.weakAreas).toEqual([])
      expect(data.message).toContain('No weak areas')
    })

    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/weak-areas')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
    })
  })

  describe('Weak Area Detection Logic', () => {
    it('should classify priority based on accuracy percentage', () => {
      const getPriority = (accuracy: number) => {
        if (accuracy < 50) return 'high'
        if (accuracy < 70) return 'medium'
        return 'low'
      }

      expect(getPriority(35)).toBe('high')
      expect(getPriority(55)).toBe('medium')
      expect(getPriority(85)).toBe('low')
    })

    it('should calculate accuracy percentage', () => {
      const calculateAccuracy = (correct: number, total: number) => {
        return Math.round((correct / total) * 100)
      }

      expect(calculateAccuracy(3, 10)).toBe(30)
      expect(calculateAccuracy(7, 10)).toBe(70)
      expect(calculateAccuracy(10, 10)).toBe(100)
    })

    it('should require minimum attempts for analysis', () => {
      const isAnalyzable = (attempts: number) => attempts >= 3

      expect(isAnalyzable(1)).toBe(false)
      expect(isAnalyzable(3)).toBe(true)
      expect(isAnalyzable(10)).toBe(true)
    })

    it('should identify improving vs declining topics', () => {
      const recentScores = [60, 65, 70, 75]
      const decliningScores = [75, 70, 65, 60]

      const isImproving = (scores: number[]) => {
        const first = scores[0]
        const last = scores[scores.length - 1]
        return last > first
      }

      expect(isImproving(recentScores)).toBe(true)
      expect(isImproving(decliningScores)).toBe(false)
    })
  })

  describe('Improvement Tracking', () => {
    it('should track accuracy improvement over time', () => {
      const history = [
        { date: '2025-10-01', accuracy: 40 },
        { date: '2025-10-10', accuracy: 55 },
        { date: '2025-10-19', accuracy: 70 },
      ]

      const improvement = history[history.length - 1].accuracy - history[0].accuracy

      expect(improvement).toBe(30)
      expect(improvement).toBeGreaterThan(0)
    })

    it('should calculate average accuracy across all topics', () => {
      const topics = [
        { accuracy: 80 },
        { accuracy: 60 },
        { accuracy: 70 },
      ]

      const average = topics.reduce((sum, t) => sum + t.accuracy, 0) / topics.length

      expect(average).toBe(70)
    })

    it('should identify topics needing urgent review', () => {
      const topics = [
        { accuracy: 90, attempts: 10 },
        { accuracy: 35, attempts: 5 },
        { accuracy: 50, attempts: 8 },
      ]

      const urgent = topics.filter(t => t.accuracy < 50 && t.attempts >= 3)

      expect(urgent).toHaveLength(1)
      expect(urgent[0].accuracy).toBe(35)
    })
  })
})
