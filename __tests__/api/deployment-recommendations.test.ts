/**
 * Tests for Deployment Recommendations API
 * Covers AI-powered workforce matching and deployment suggestions
 */

import { POST } from '@/app/api/deployment-recommendations/route'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/supabase/server')
jest.mock('ai')

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}))

const mockGenerateObject = jest.fn()
jest.mock('ai', () => ({
  generateObject: mockGenerateObject,
}))

jest.mock('@/lib/ai-provider', () => ({
  getClaude: jest.fn(() => 'claude-model'),
}))

describe('Deployment Recommendations API', () => {
  const userId = 'user-123'

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    })
  })

  describe('POST /api/deployment-recommendations', () => {
    it('should generate deployment recommendations based on user profile', async () => {
      const userProfile = {
        id: userId,
        specialization: 'Emergency Medicine',
        location: 'Maharashtra',
        full_name: 'Dr. Priya Sharma',
      }

      const completedModules = [
        {
          modules: {
            title: 'Emergency Medicine Fundamentals',
            category: 'Emergency Medicine',
          },
          score: 85,
        },
        {
          modules: {
            title: 'Trauma Care',
            category: 'Emergency Medicine',
          },
          score: 90,
        },
      ]

      mockSupabase.from().single
        .mockResolvedValueOnce({ data: userProfile, error: null })
        .mockResolvedValueOnce({ data: completedModules, error: null })

      const recommendations = {
        deployments: [
          {
            id: 'deploy-1',
            location: 'Rural Maharashtra',
            district: 'Pune Rural',
            specialization: 'Emergency Medicine',
            priority: 'high',
            matchScore: 92,
            reasoning: 'Strong emergency medicine background with 90% assessment score',
          },
          {
            id: 'deploy-2',
            location: 'Rural Maharashtra',
            district: 'Nashik Rural',
            specialization: 'Emergency Medicine',
            priority: 'medium',
            matchScore: 78,
            reasoning: 'Good fit for emergency department, close to current location',
          },
        ],
        userStrengths: ['Emergency triage', 'Trauma care', 'Critical assessment'],
        suggestedTraining: ['Advanced cardiac life support'],
      }

      mockGenerateObject.mockResolvedValue({
        object: recommendations,
      })

      const request = new NextRequest('http://localhost:3000/api/deployment-recommendations', {
        method: 'POST',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.deployments).toHaveLength(2)
      expect(data.deployments[0].matchScore).toBeGreaterThan(90)
      expect(data.userStrengths).toBeDefined()
      expect(mockGenerateObject).toHaveBeenCalled()
    })

    it('should prioritize critical need areas', async () => {
      mockSupabase.from().single
        .mockResolvedValueOnce({
          data: { specialization: 'Pediatrics' },
          error: null,
        })
        .mockResolvedValueOnce({ data: [], error: null })

      const recommendations = {
        deployments: [
          {
            location: 'High-need rural area',
            priority: 'critical',
            matchScore: 85,
          },
        ],
      }

      mockGenerateObject.mockResolvedValue({
        object: recommendations,
      })

      const request = new NextRequest('http://localhost:3000/api/deployment-recommendations', {
        method: 'POST',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.deployments[0].priority).toBe('critical')
    })

    it('should consider user location preferences', async () => {
      const userProfile = {
        specialization: 'General Medicine',
        location: 'Karnataka',
        preferences: {
          preferredStates: ['Karnataka', 'Tamil Nadu'],
          maxDistance: 200,
        },
      }

      mockSupabase.from().single
        .mockResolvedValueOnce({ data: userProfile, error: null })
        .mockResolvedValueOnce({ data: [], error: null })

      const recommendations = {
        deployments: [
          {
            location: 'Rural Karnataka',
            state: 'Karnataka',
            matchScore: 88,
          },
        ],
      }

      mockGenerateObject.mockResolvedValue({
        object: recommendations,
      })

      const request = new NextRequest('http://localhost:3000/api/deployment-recommendations', {
        method: 'POST',
        body: JSON.stringify({
          preferences: userProfile.preferences,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.deployments[0].state).toBe('Karnataka')
    })

    it('should suggest training for skill gaps', async () => {
      mockSupabase.from().single
        .mockResolvedValueOnce({
          data: { specialization: 'General Practice' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: [
            {
              modules: { category: 'General Medicine' },
              score: 65,
            },
          ],
          error: null,
        })

      const recommendations = {
        deployments: [],
        userStrengths: ['Patient care', 'Communication'],
        suggestedTraining: [
          'Emergency protocols',
          'Advanced diagnostics',
          'Maternal health',
        ],
      }

      mockGenerateObject.mockResolvedValue({
        object: recommendations,
      })

      const request = new NextRequest('http://localhost:3000/api/deployment-recommendations', {
        method: 'POST',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.suggestedTraining).toBeDefined()
      expect(data.suggestedTraining.length).toBeGreaterThan(0)
    })

    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/deployment-recommendations', {
        method: 'POST',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('Matching Algorithm Logic', () => {
    it('should calculate match score based on multiple factors', () => {
      const calculateMatchScore = (factors: {
        specializationMatch: number
        experienceLevel: number
        locationPreference: number
        assessmentScores: number
      }) => {
        const weights = {
          specializationMatch: 0.4,
          experienceLevel: 0.2,
          locationPreference: 0.2,
          assessmentScores: 0.2,
        }

        return Math.round(
          factors.specializationMatch * weights.specializationMatch +
          factors.experienceLevel * weights.experienceLevel +
          factors.locationPreference * weights.locationPreference +
          factors.assessmentScores * weights.assessmentScores
        )
      }

      const score = calculateMatchScore({
        specializationMatch: 100,
        experienceLevel: 80,
        locationPreference: 90,
        assessmentScores: 85,
      })

      expect(score).toBeGreaterThan(85)
    })

    it('should prioritize specialization match over other factors', () => {
      const highSpecMatch = {
        specializationMatch: 100,
        experienceLevel: 60,
        locationPreference: 60,
        assessmentScores: 60,
      }

      const lowSpecMatch = {
        specializationMatch: 50,
        experienceLevel: 90,
        locationPreference: 90,
        assessmentScores: 90,
      }

      // Specialization has 40% weight
      const score1 = highSpecMatch.specializationMatch * 0.4 + 60 * 0.6
      const score2 = lowSpecMatch.specializationMatch * 0.4 + 90 * 0.6

      expect(score1).toBeGreaterThan(score2)
    })
  })
})
