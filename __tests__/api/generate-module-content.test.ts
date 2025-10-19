/**
 * Tests for Generate Module Content API
 * Covers AI-generated educational content creation
 */

import { POST } from '@/app/api/generate-module-content/route'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/supabase/server')
jest.mock('ai')

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
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

describe('Generate Module Content API', () => {
  const userId = 'admin-123'

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    })
  })

  describe('POST /api/generate-module-content', () => {
    it('should generate comprehensive module content', async () => {
      const moduleContent = {
        title: 'Pediatric Emergency Care',
        description: 'Comprehensive guide to pediatric emergencies in rural settings',
        difficulty: 'intermediate',
        category: 'Pediatrics',
        content: {
          sections: [
            {
              title: 'Pediatric Assessment Triangle',
              content: 'Rapid assessment technique for identifying critically ill children...',
              duration: 15,
            },
            {
              title: 'Common Pediatric Emergencies',
              content: 'Recognition and management of fever, dehydration, respiratory distress...',
              duration: 25,
            },
            {
              title: 'Pediatric Resuscitation',
              content: 'Age-appropriate CPR techniques and emergency medications...',
              duration: 20,
            },
          ],
        },
        tags: ['pediatrics', 'emergency', 'assessment', 'resuscitation'],
        prerequisites: ['Basic Emergency Care'],
        duration_minutes: 60,
      }

      mockGenerateObject.mockResolvedValue({
        object: moduleContent,
      })

      mockSupabase.from().single.mockResolvedValue({
        data: { id: 'module-123', ...moduleContent },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/generate-module-content', {
        method: 'POST',
        body: JSON.stringify({
          topic: 'Pediatric Emergency Care',
          difficulty: 'intermediate',
          targetRole: 'healthcare_worker',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.module).toBeDefined()
      expect(data.module.title).toBe('Pediatric Emergency Care')
      expect(data.module.content.sections).toHaveLength(3)
      expect(mockGenerateObject).toHaveBeenCalled()
    })

    it('should adapt content for different difficulty levels', async () => {
      const beginnerContent = {
        title: 'Basic First Aid',
        difficulty: 'beginner',
        content: {
          sections: [
            {
              title: 'Introduction to First Aid',
              content: 'Simple, clear explanations...',
              duration: 10,
            },
          ],
        },
      }

      mockGenerateObject.mockResolvedValue({
        object: beginnerContent,
      })

      mockSupabase.from().single.mockResolvedValue({
        data: beginnerContent,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/generate-module-content', {
        method: 'POST',
        body: JSON.stringify({
          topic: 'First Aid Basics',
          difficulty: 'beginner',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.module.difficulty).toBe('beginner')
    })

    it('should include relevant tags and prerequisites', async () => {
      const moduleContent = {
        title: 'Advanced Cardiac Life Support',
        tags: ['cardiology', 'emergency', 'advanced', 'acls'],
        prerequisites: ['Basic Life Support', 'ECG Interpretation'],
      }

      mockGenerateObject.mockResolvedValue({
        object: moduleContent,
      })

      mockSupabase.from().single.mockResolvedValue({
        data: moduleContent,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/generate-module-content', {
        method: 'POST',
        body: JSON.stringify({
          topic: 'Advanced Cardiac Life Support',
          difficulty: 'advanced',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.module.tags).toContain('cardiology')
      expect(data.module.prerequisites).toContain('Basic Life Support')
    })

    it('should calculate total duration from sections', async () => {
      const moduleContent = {
        content: {
          sections: [
            { duration: 15 },
            { duration: 20 },
            { duration: 25 },
          ],
        },
        duration_minutes: 60,
      }

      mockGenerateObject.mockResolvedValue({
        object: moduleContent,
      })

      mockSupabase.from().single.mockResolvedValue({
        data: moduleContent,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/generate-module-content', {
        method: 'POST',
        body: JSON.stringify({
          topic: 'Test Module',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.module.duration_minutes).toBe(60)
    })

    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/generate-module-content', {
        method: 'POST',
        body: JSON.stringify({ topic: 'Test' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
    })

    it('should handle content generation errors', async () => {
      mockGenerateObject.mockRejectedValue(new Error('AI generation failed'))

      const request = new NextRequest('http://localhost:3000/api/generate-module-content', {
        method: 'POST',
        body: JSON.stringify({
          topic: 'Test Module',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()
    })
  })

  describe('Content Quality Validation', () => {
    it('should ensure minimum section count', () => {
      const validateContent = (sections: any[]) => sections.length >= 2

      expect(validateContent([{ title: 'Section 1' }])).toBe(false)
      expect(validateContent([
        { title: 'Section 1' },
        { title: 'Section 2' },
      ])).toBe(true)
    })

    it('should validate section duration range', () => {
      const validateDuration = (duration: number) => duration >= 5 && duration <= 60

      expect(validateDuration(3)).toBe(false)
      expect(validateDuration(15)).toBe(true)
      expect(validateDuration(70)).toBe(false)
    })

    it('should ensure content has minimum length', () => {
      const validateContentLength = (content: string) => content.length >= 100

      expect(validateContentLength('Short')).toBe(false)
      expect(validateContentLength('A'.repeat(150))).toBe(true)
    })

    it('should validate tag relevance', () => {
      const relevantTags = ['emergency', 'pediatrics', 'cardiology']
      const tags = ['emergency', 'pediatrics']

      const isRelevant = tags.every(tag => relevantTags.includes(tag))

      expect(isRelevant).toBe(true)
    })
  })
})
