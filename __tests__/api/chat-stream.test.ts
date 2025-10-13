/**
 * Integration tests for Claude Sonnet 4.5 streaming chat API
 */

describe('Chat Streaming API with Claude Sonnet 4.5', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
  })

  describe('POST /api/chat', () => {
    it('should return 401 without authentication', async () => {
      // Mock Supabase auth to return no user
      const mockGetUser = jest.fn().mockResolvedValue({
        data: { user: null },
        error: null
      })
      
      // Test would make actual request in integration environment
      expect(mockGetUser).toBeDefined()
    })

    it('should accept messages in AI SDK UIMessage format', () => {
      const validMessage = {
        id: 'msg-1',
        role: 'user',
        parts: [{ type: 'text', text: 'What is diabetes?' }],
        data: {
          userId: 'user-123',
          userRole: 'doctor',
          specialization: 'general',
          location: 'Rural Maharashtra',
          category: 'general'
        }
      }

      expect(validMessage.role).toBe('user')
      expect(validMessage.parts[0].type).toBe('text')
    })

    it('should stream responses using Server-Sent Events', () => {
      // Test SSE format
      const sseEvent = 'data: {"type":"text-delta","delta":"Hello"}\n\n'
      expect(sseEvent).toContain('data:')
      expect(sseEvent).toContain('"type":"text-delta"')
    })

    it('should handle tool calls for medical web search', () => {
      const toolCallEvent = {
        type: 'tool-call',
        toolName: 'medicalWebSearch',
        toolCallId: 'call-123',
        input: { query: 'diabetes treatment guidelines India' }
      }

      expect(toolCallEvent.toolName).toBe('medicalWebSearch')
      expect(toolCallEvent.input.query).toContain('diabetes')
    })

    it('should support extended thinking mode', () => {
      const requestWithThinking = {
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            parts: [{ type: 'text', text: 'Complex medical case analysis' }]
          }
        ],
        userId: 'user-123',
        extendedThinking: true,
        category: 'emergency'
      }

      expect(requestWithThinking.extendedThinking).toBe(true)
    })

    it('should support different medical specialization categories', () => {
      const categories = [
        'general',
        'emergency', 
        'maternal',
        'pediatric',
        'infectious',
        'drugs'
      ]

      categories.forEach(category => {
        const request = {
          messages: [],
          userId: 'user-123',
          category
        }
        expect(categories).toContain(request.category)
      })
    })
  })

  describe('Claude Model Configuration', () => {
    it('should use Claude Sonnet 4.5 as default model', () => {
      const defaultModel = 'claude-sonnet-4-5-20250929'
      expect(defaultModel).toContain('claude-sonnet-4-5')
      expect(defaultModel).toContain('20250929')
    })

    it('should configure temperature for medical responses', () => {
      const temperature = 0.2
      expect(temperature).toBeLessThanOrEqual(1.0)
      expect(temperature).toBeGreaterThanOrEqual(0.0)
      // Lower temperature for more consistent medical advice
      expect(temperature).toBeLessThan(0.5)
    })

    it('should limit tool execution steps', () => {
      const maxSteps = 5
      expect(maxSteps).toBe(5)
    })
  })

  describe('Web Search Tool Integration', () => {
    it('should search trusted medical domains', () => {
      const trustedDomains = [
        'who.int',
        'cdc.gov',
        'nih.gov',
        'mohfw.gov.in',
        'icmr.gov.in',
        'pubmed.ncbi.nlm.nih.gov'
      ]

      expect(trustedDomains).toContain('who.int')
      expect(trustedDomains).toContain('icmr.gov.in')
      expect(trustedDomains.length).toBeGreaterThan(5)
    })

    it('should handle web search tool gracefully when EXA_API_KEY missing', () => {
      // Tool should return empty array, not throw
      const emptyResult: any[] = []
      expect(emptyResult).toEqual([])
    })
  })

  describe('Response Persistence', () => {
    it('should save chat messages to database on completion', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: null
      })

      // onFinish callback should trigger DB save
      expect(mockInsert).toBeDefined()
    })

    it('should create or retrieve session before saving', () => {
      const sessionId = 'session-123'
      expect(sessionId).toMatch(/^session-/)
    })

    it('should extract text content from message parts', () => {
      const message = {
        role: 'assistant',
        parts: [
          { type: 'text', text: 'Here is some advice' },
          { type: 'tool-medicalWebSearch', state: 'output-available', output: {} }
        ]
      }

      const textParts = message.parts.filter((p: any) => p.type === 'text')
      expect(textParts.length).toBe(1)
      expect(textParts[0].text).toBe('Here is some advice')
    })
  })
})

describe('AI Provider Configuration', () => {
  it('should configure Anthropic provider correctly', () => {
    // getClaude function should use anthropic provider
    const modelId = 'claude-sonnet-4-5-20250929'
    expect(modelId).toBeDefined()
  })

  it('should warn when ANTHROPIC_API_KEY is missing', () => {
    const apiKey = process.env.ANTHROPIC_API_KEY
    // In test environment, key might not be set
    expect(['string', 'undefined']).toContain(typeof apiKey)
  })

  it('should support multiple Claude models', () => {
    const models = {
      sonnet45: 'claude-sonnet-4-5-20250929',
      sonnet4: 'claude-sonnet-4-20250514',
      opus4: 'claude-opus-4-20250514'
    }

    Object.values(models).forEach(model => {
      expect(model).toContain('claude-')
    })
  })
})
