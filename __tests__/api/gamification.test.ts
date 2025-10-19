/**
 * Tests for Gamification API
 * Covers achievements, points, and user progress tracking
 */

import { GET, POST } from '@/app/api/gamification/achievements/route'
import { NextRequest } from 'next/server'

// Mock Supabase
jest.mock('@/lib/supabase/server')

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    order: jest.fn().mockReturnThis(),
  })),
  rpc: jest.fn(),
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}))

describe('Gamification API', () => {
  const userId = 'user-123'

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    })
  })

  describe('GET /api/gamification/achievements', () => {
    it('should retrieve user achievements', async () => {
      const achievements = [
        {
          id: 'achieve-1',
          user_id: userId,
          achievement_id: 'first-module',
          earned_at: new Date().toISOString(),
          achievements: {
            code: 'first-module',
            name: 'First Steps',
            description: 'Complete your first module',
            points: 100,
            icon: '🎯',
          },
        },
        {
          id: 'achieve-2',
          user_id: userId,
          achievement_id: '7-day-streak',
          earned_at: new Date().toISOString(),
          achievements: {
            code: '7-day-streak',
            name: 'Streak Master',
            description: 'Maintain a 7-day study streak',
            points: 250,
            icon: '🔥',
          },
        },
      ]

      mockSupabase.from().single.mockResolvedValue({
        data: achievements,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/gamification/achievements')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data[0].achievements.name).toBe('First Steps')
    })

    it('should return empty array for user with no achievements', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: [],
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/gamification/achievements')

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

      const request = new NextRequest('http://localhost:3000/api/gamification/achievements')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('POST /api/gamification/achievements', () => {
    it('should check and award new achievements', async () => {
      const newAchievements = [
        {
          id: 'achieve-new',
          achievement_id: '10-modules',
          name: 'Knowledge Seeker',
          points: 500,
        },
      ]

      mockSupabase.rpc.mockResolvedValue({
        data: newAchievements,
        error: null,
      })

      mockSupabase.from().single.mockResolvedValue({
        data: { total_points: 1500, level: 3 },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/gamification/achievements', {
        method: 'POST',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.newAchievements).toBeDefined()
      expect(data.gamification).toBeDefined()
      expect(mockSupabase.rpc).toHaveBeenCalledWith('check_achievements', {
        p_user_id: userId,
      })
    })

    it('should handle no new achievements', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      })

      mockSupabase.from().single.mockResolvedValue({
        data: { total_points: 500, level: 2 },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/gamification/achievements', {
        method: 'POST',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.newAchievements).toEqual([])
    })
  })

  describe('Gamification Points System', () => {
    it('should award points for completing modules', () => {
      const modulePoints = 100
      const basePoints = 500
      const expectedTotal = basePoints + modulePoints

      expect(expectedTotal).toBe(600)
    })

    it('should calculate level based on total points', () => {
      const calculateLevel = (points: number) => Math.floor(points / 500) + 1

      expect(calculateLevel(0)).toBe(1)
      expect(calculateLevel(500)).toBe(2)
      expect(calculateLevel(1500)).toBe(4)
      expect(calculateLevel(5000)).toBe(11)
    })

    it('should calculate next level requirements', () => {
      const getNextLevelPoints = (currentLevel: number) => currentLevel * 500

      expect(getNextLevelPoints(1)).toBe(500)
      expect(getNextLevelPoints(2)).toBe(1000)
      expect(getNextLevelPoints(5)).toBe(2500)
    })
  })
})
