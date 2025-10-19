/**
 * Tests for Certificate Verification API
 * Covers blockchain verification and certificate lookup
 */

import { POST, GET } from '@/app/api/verify-certificate/route'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/blockchain')

const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}))

const mockBlockchain = {
  verifyCertificate: jest.fn(),
  getUserCertificates: jest.fn(),
}

jest.mock('@/lib/blockchain', () => ({
  CertificateBlockchain: mockBlockchain,
}))

describe('Certificate Verification API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/verify-certificate', () => {
    const certificateHash = 'abc123validhash'

    it('should verify valid certificate', async () => {
      const blockData = {
        index: 5,
        timestamp: Date.now(),
        hash: certificateHash,
        nonce: 12345,
        certificateData: {
          userId: 'user-123',
          moduleId: 'module-456',
          skill: 'Emergency Medicine',
        },
      }

      mockBlockchain.verifyCertificate.mockResolvedValue({
        isValid: true,
        block: blockData,
        message: 'Certificate is valid and verified on blockchain',
      })

      const certificateData = {
        id: 'cert-1',
        certificate_hash: certificateHash,
        profiles: {
          full_name: 'Dr. John Doe',
          email: 'john@example.com',
        },
        modules: {
          title: 'Emergency Medicine Fundamentals',
          description: 'Comprehensive emergency care training',
        },
      }

      mockSupabase.from().single.mockResolvedValue({
        data: certificateData,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/verify-certificate', {
        method: 'POST',
        body: JSON.stringify({ certificateHash }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.verified).toBe(true)
      expect(data.certificate).toBeDefined()
      expect(data.certificate.blockchainData).toEqual({
        blockIndex: blockData.index,
        timestamp: blockData.timestamp,
        hash: blockData.hash,
        nonce: blockData.nonce,
      })
    })

    it('should reject invalid certificate hash', async () => {
      mockBlockchain.verifyCertificate.mockResolvedValue({
        isValid: false,
        message: 'Certificate not found in blockchain',
      })

      const request = new NextRequest('http://localhost:3000/api/verify-certificate', {
        method: 'POST',
        body: JSON.stringify({ certificateHash: 'invalid-hash' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.verified).toBe(false)
      expect(data.message).toBe('Certificate not found in blockchain')
    })

    it('should reject tampered certificate', async () => {
      mockBlockchain.verifyCertificate.mockResolvedValue({
        isValid: false,
        message: 'Certificate hash is invalid (tampered)',
      })

      const request = new NextRequest('http://localhost:3000/api/verify-certificate', {
        method: 'POST',
        body: JSON.stringify({ certificateHash: 'tampered-hash' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.verified).toBe(false)
      expect(data.message).toContain('tampered')
    })

    it('should require certificate hash parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/verify-certificate', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Certificate hash is required')
    })
  })

  describe('GET /api/verify-certificate', () => {
    const userId = 'user-123'

    it('should retrieve all user certificates', async () => {
      const certificates = [
        {
          index: 1,
          timestamp: Date.now() - 86400000,
          hash: 'hash1',
          certificateData: {
            userId,
            moduleId: 'module-1',
            skill: 'Emergency Medicine',
            issuedAt: new Date().toISOString(),
          },
        },
        {
          index: 2,
          timestamp: Date.now(),
          hash: 'hash2',
          certificateData: {
            userId,
            moduleId: 'module-2',
            skill: 'Maternal Health',
            issuedAt: new Date().toISOString(),
          },
        },
      ]

      mockBlockchain.getUserCertificates.mockResolvedValue(certificates)

      const url = new URL('http://localhost:3000/api/verify-certificate')
      url.searchParams.set('userId', userId)
      const request = new NextRequest(url)

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.certificates).toHaveLength(2)
      expect(data.certificates[0].hash).toBe('hash1')
      expect(data.certificates[1].hash).toBe('hash2')
      expect(mockBlockchain.getUserCertificates).toHaveBeenCalledWith(userId)
    })

    it('should return empty array for user with no certificates', async () => {
      mockBlockchain.getUserCertificates.mockResolvedValue([])

      const url = new URL('http://localhost:3000/api/verify-certificate')
      url.searchParams.set('userId', userId)
      const request = new NextRequest(url)

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.certificates).toEqual([])
    })

    it('should require userId parameter', async () => {
      const url = new URL('http://localhost:3000/api/verify-certificate')
      const request = new NextRequest(url)

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('User ID is required')
    })
  })
})
