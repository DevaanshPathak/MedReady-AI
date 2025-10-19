/**
 * Tests for Certificate Generation API
 * Covers blockchain integration and certificate issuance
 */

import { POST } from '@/app/api/generate-certificate/route'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/blockchain')

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}))

const mockBlockchain = {
  addCertificate: jest.fn(),
}

jest.mock('@/lib/blockchain', () => ({
  CertificateBlockchain: mockBlockchain,
}))

describe('Certificate Generation API', () => {
  const userId = 'user-123'
  const moduleId = 'module-456'

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    })
  })

  describe('POST /api/generate-certificate', () => {
    it('should generate certificate for completed module', async () => {
      const progressData = {
        id: 'progress-1',
        user_id: userId,
        module_id: moduleId,
        status: 'completed',
        completion_percent: 100,
        modules: {
          id: moduleId,
          title: 'Emergency Medicine Fundamentals',
        },
      }

      const assessmentData = {
        id: 'attempt-1',
        user_id: userId,
        score: 85,
        passed: true,
      }

      mockSupabase.from().single
        .mockResolvedValueOnce({ data: progressData, error: null })
        .mockResolvedValueOnce({ data: assessmentData, error: null })
        .mockResolvedValueOnce({ data: null, error: null }) // No existing cert

      mockBlockchain.addCertificate.mockResolvedValue({
        hash: 'abc123hash',
        index: 5,
        timestamp: Date.now(),
        nonce: 12345,
      })

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

      const request = new NextRequest('http://localhost:3000/api/generate-certificate', {
        method: 'POST',
        body: JSON.stringify({ moduleId }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.certificate).toBeDefined()
      expect(data.blockchain).toBeDefined()
      expect(data.blockchain.hash).toBe('abc123hash')
      expect(mockBlockchain.addCertificate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          moduleId,
          skill: 'Emergency Medicine Fundamentals',
        })
      )
    })

    it('should return existing certificate if already issued', async () => {
      const existingCert = {
        id: 'cert-existing',
        user_id: userId,
        module_id: moduleId,
        certificate_hash: 'existing-hash',
      }

      mockSupabase.from().single
        .mockResolvedValueOnce({
          data: { status: 'completed' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { passed: true },
          error: null,
        })
        .mockResolvedValueOnce({ data: existingCert, error: null })

      const request = new NextRequest('http://localhost:3000/api/generate-certificate', {
        method: 'POST',
        body: JSON.stringify({ moduleId }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.certificate).toEqual(existingCert)
      expect(mockBlockchain.addCertificate).not.toHaveBeenCalled()
    })

    it('should reject if module not completed', async () => {
      mockSupabase.from().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      })

      const request = new NextRequest('http://localhost:3000/api/generate-certificate', {
        method: 'POST',
        body: JSON.stringify({ moduleId }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Module not completed')
    })

    it('should reject if assessment not passed', async () => {
      mockSupabase.from().single
        .mockResolvedValueOnce({
          data: { status: 'completed' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Not found' },
        })

      const request = new NextRequest('http://localhost:3000/api/generate-certificate', {
        method: 'POST',
        body: JSON.stringify({ moduleId }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Assessment not passed')
    })

    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/generate-certificate', {
        method: 'POST',
        body: JSON.stringify({ moduleId }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })
})
