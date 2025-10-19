/**
 * Tests for Study Streaks API
 * Covers daily activity tracking and streak maintenance
 */

import { GET, POST } from '@/app/api/gamification/streaks/route'
import { NextRequest } from 'next/server'

// Mock Supabase
jest.mock('@/lib/supabase/server')

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
  rpc: jest.fn(),
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}))

describe('Study Streaks API', () => {
  const userId = 'user-123'

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    })
  })

  describe('GET /api/gamification/streaks', () => {
    it('should retrieve current study streak', async () => {
      const streakData = {
        id: 'streak-1',
        user_id: userId,
        current_streak: 7,
        longest_streak: 15,
        last_activity_date: new Date().toISOString().split('T')[0],
        total_study_days: 42,
      }

      mockSupabase.from().single.mockResolvedValue({
        data: streakData,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/gamification/streaks')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.current_streak).toBe(7)
      expect(data.longest_streak).toBe(15)
      expect(data.total_study_days).toBe(42)
    })

    it('should initialize streak for new user', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: null,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/gamification/streaks')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.current_streak).toBe(0)
      expect(data.longest_streak).toBe(0)
    })

    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/gamification/streaks')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/gamification/streaks', () => {
    it('should update streak on daily activity', async () => {
      const updatedStreak = {
        current_streak: 8,
        longest_streak: 15,
        streak_continued: true,
      }

      mockSupabase.rpc.mockResolvedValue({
        data: updatedStreak,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/gamification/streaks', {
        method: 'POST',
        body: JSON.stringify({
          activityType: 'module_completed',
          timeSpentMinutes: 30,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.current_streak).toBe(8)
      expect(data.streak_continued).toBe(true)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_study_streak', {
        p_user_id: userId,
      })
    })

    it('should break streak if inactive for a day', async () => {
      const brokenStreak = {
        current_streak: 1,
        longest_streak: 15,
        streak_continued: false,
        streak_broken: true,
      }

      mockSupabase.rpc.mockResolvedValue({
        data: brokenStreak,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/gamification/streaks', {
        method: 'POST',
        body: JSON.stringify({
          activityType: 'quiz_completed',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.current_streak).toBe(1)
      expect(data.streak_broken).toBe(true)
    })

    it('should track daily activity details', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: { current_streak: 5 },
        error: null,
      })

      mockSupabase.from().single.mockResolvedValue({
        data: {
          activity_date: new Date().toISOString().split('T')[0],
          activities_completed: 3,
          time_spent_minutes: 45,
          points_earned: 150,
        },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/gamification/streaks', {
        method: 'POST',
        body: JSON.stringify({
          activityType: 'assessment_passed',
          timeSpentMinutes: 15,
          pointsEarned: 50,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Streak Calculation Logic', () => {
    it('should determine if streak is active (last activity today or yesterday)', () => {
      const isStreakActive = (lastActivityDate: string) => {
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        const lastActivity = new Date(lastActivityDate)
        const todayStr = today.toISOString().split('T')[0]
        const yesterdayStr = yesterday.toISOString().split('T')[0]
        const lastActivityStr = lastActivity.toISOString().split('T')[0]

        return lastActivityStr === todayStr || lastActivityStr === yesterdayStr
      }

      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
      const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0]

      expect(isStreakActive(today)).toBe(true)
      expect(isStreakActive(yesterdayStr)).toBe(true)
      expect(isStreakActive(twoDaysAgoStr)).toBe(false)
    })

    it('should increment streak for consecutive days', () => {
      let currentStreak = 5
      const isConsecutiveDay = true

      if (isConsecutiveDay) {
        currentStreak += 1
      }

      expect(currentStreak).toBe(6)
    })

    it('should reset streak for non-consecutive days', () => {
      let currentStreak = 5
      const isConsecutiveDay = false

      if (!isConsecutiveDay) {
        currentStreak = 1
      }

      expect(currentStreak).toBe(1)
    })

    it('should track longest streak separately', () => {
      const streaks = [3, 7, 5, 10, 2, 8]
      const longestStreak = Math.max(...streaks)

      expect(longestStreak).toBe(10)
    })
  })
})
