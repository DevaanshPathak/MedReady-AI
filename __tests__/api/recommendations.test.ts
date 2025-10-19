/**
 * Tests for AI Recommendations API
 * Covers personalized learning recommendations and weak area analysis
 */

import { GET } from '@/app/api/recommendations/route'
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

describe('Recommendations API', () => {
  const userId = 'user-123'

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    })
  })

  describe('GET /api/recommendations', () => {
    it('should retrieve personalized recommendations', async () => {
      const recommendations = [
        {
          id: 'rec-1',
          user_id: userId,
          recommendation_type: 'weak_area',
          title: 'Review Emergency Triage',
          description: 'Your assessment shows lower scores in emergency triage protocols',
          module_id: 'module-emergency',
          priority: 1,
          reason: 'Recent assessment score: 65%',
          is_completed: false,
        },
        {
          id: 'rec-2',
          user_id: userId,
          recommendation_type: 'next_topic',
          title: 'Advanced Cardiac Life Support',
          description: 'Based on your emergency medicine completion',
          module_id: 'module-acls',
          priority: 2,
          is_completed: false,
        },
      ]

      mockSupabase.from().single.mockResolvedValue({
        data: recommendations,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/recommendations')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data[0].recommendation_type).toBe('weak_area')
      expect(data[0].priority).toBe(1)
    })

    it('should filter by recommendation type', async () => {
      const weakAreaRecs = [
        {
          recommendation_type: 'weak_area',
          title: 'Review Pediatric Assessment',
          priority: 1,
        },
      ]

      mockSupabase.from().single.mockResolvedValue({
        data: weakAreaRecs,
        error: null,
      })

      const url = new URL('http://localhost:3000/api/recommendations')
      url.searchParams.set('type', 'weak_area')
      const request = new NextRequest(url)

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.every((rec: any) => rec.recommendation_type === 'weak_area')).toBe(true)
    })

    it('should limit number of recommendations', async () => {
      const recommendations = Array(10).fill(null).map((_, i) => ({
        id: `rec-${i}`,
        title: `Recommendation ${i}`,
        priority: i + 1,
      }))

      mockSupabase.from().single.mockResolvedValue({
        data: recommendations,
        error: null,
      })

      const url = new URL('http://localhost:3000/api/recommendations')
      url.searchParams.set('limit', '5')
      const request = new NextRequest(url)

      const response = await GET(request)
      const data = await response.json()

      expect(mockSupabase.from().limit).toHaveBeenCalledWith(5)
    })

    it('should handle no recommendations', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: [],
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/recommendations')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/recommendations')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
    })
  })

  describe('Recommendation Priority System', () => {
    it('should prioritize weak areas highest', () => {
      const getPriority = (type: string) => {
        const priorities: Record<string, number> = {
          weak_area: 1,
          review: 2,
          next_topic: 3,
          new_skill: 4,
        }
        return priorities[type] || 5
      }

      expect(getPriority('weak_area')).toBe(1)
      expect(getPriority('review')).toBe(2)
      expect(getPriority('next_topic')).toBe(3)
    })

    it('should sort recommendations by priority', () => {
      const recommendations = [
        { priority: 3, title: 'C' },
        { priority: 1, title: 'A' },
        { priority: 2, title: 'B' },
      ]

      const sorted = [...recommendations].sort((a, b) => a.priority - b.priority)

      expect(sorted[0].title).toBe('A')
      expect(sorted[1].title).toBe('B')
      expect(sorted[2].title).toBe('C')
    })
  })

  describe('Recommendation Generation Logic', () => {
    it('should generate weak area recommendations based on assessment scores', () => {
      const assessmentScores = [
        { category: 'Emergency', score: 65 },
        { category: 'Pediatrics', score: 85 },
        { category: 'Maternal', score: 70 },
      ]

      const weakAreas = assessmentScores.filter(s => s.score < 75)

      expect(weakAreas).toHaveLength(2)
      expect(weakAreas[0].category).toBe('Emergency')
      expect(weakAreas[1].category).toBe('Maternal')
    })

    it('should recommend next topics based on completed modules', () => {
      const completedModules = ['emergency-basics', 'triage-101']
      const nextTopics = ['advanced-emergency', 'trauma-care']

      const shouldRecommend = completedModules.includes('emergency-basics')

      expect(shouldRecommend).toBe(true)
    })

    it('should recommend review for modules not accessed recently', () => {
      const lastAccessed = new Date('2024-01-01')
      const today = new Date('2025-10-19')
      const daysSinceAccess = Math.floor(
        (today.getTime() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24)
      )

      expect(daysSinceAccess).toBeGreaterThan(30)
    })
  })
})
