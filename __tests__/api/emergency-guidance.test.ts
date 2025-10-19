/**
 * Tests for Emergency Guidance API
 * Covers emergency medical AI assistance
 */

import { POST } from '@/app/api/emergency-guidance/route'
import { NextRequest } from 'next/server'

// Mock AI SDK
jest.mock('ai', () => ({
  streamText: jest.fn(),
}))

jest.mock('@/lib/ai-provider', () => ({
  getClaude: jest.fn(() => 'claude-model'),
}))

const mockStreamText = require('ai').streamText

describe('Emergency Guidance API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/emergency-guidance', () => {
    it('should provide emergency medical guidance', async () => {
      const mockStream = {
        toTextStreamResponse: jest.fn(() => new Response('Emergency response')),
      }

      mockStreamText.mockResolvedValue(mockStream)

      const request = new NextRequest('http://localhost:3000/api/emergency-guidance', {
        method: 'POST',
        body: JSON.stringify({
          symptoms: 'chest pain, shortness of breath',
          patientAge: 55,
          severity: 'high',
        }),
      })

      const response = await POST(request)

      expect(mockStreamText).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-model',
          temperature: expect.any(Number),
        })
      )
      expect(response).toBeDefined()
    })

    it('should prioritize high severity cases', async () => {
      const mockStream = {
        toTextStreamResponse: jest.fn(() => new Response('Emergency response')),
      }

      mockStreamText.mockResolvedValue(mockStream)

      const request = new NextRequest('http://localhost:3000/api/emergency-guidance', {
        method: 'POST',
        body: JSON.stringify({
          symptoms: 'severe bleeding, unconscious',
          patientAge: 30,
          severity: 'critical',
        }),
      })

      await POST(request)

      const callArgs = mockStreamText.mock.calls[0][0]
      expect(callArgs.system || callArgs.messages[0].content).toContain('EMERGENCY')
    })

    it('should include patient context in prompt', async () => {
      const mockStream = {
        toTextStreamResponse: jest.fn(() => new Response('Emergency response')),
      }

      mockStreamText.mockResolvedValue(mockStream)

      const request = new NextRequest('http://localhost:3000/api/emergency-guidance', {
        method: 'POST',
        body: JSON.stringify({
          symptoms: 'fever, rash',
          patientAge: 5,
          patientSex: 'female',
          severity: 'medium',
          location: 'rural',
        }),
      })

      await POST(request)

      const callArgs = mockStreamText.mock.calls[0][0]
      const systemPrompt = callArgs.system || JSON.stringify(callArgs.messages)
      
      expect(systemPrompt).toContain('rural')
    })

    it('should handle missing optional parameters', async () => {
      const mockStream = {
        toTextStreamResponse: jest.fn(() => new Response('Emergency response')),
      }

      mockStreamText.mockResolvedValue(mockStream)

      const request = new NextRequest('http://localhost:3000/api/emergency-guidance', {
        method: 'POST',
        body: JSON.stringify({
          symptoms: 'headache',
        }),
      })

      const response = await POST(request)

      expect(response).toBeDefined()
      expect(mockStreamText).toHaveBeenCalled()
    })
  })
})
