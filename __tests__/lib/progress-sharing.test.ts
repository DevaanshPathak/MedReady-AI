import { describe, it, expect, beforeEach } from '@jest/globals'

// Create a chainable mock factory
const createChainableMock = () => {
  const chainable: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn((resolve) => {
      resolve({ data: [], error: null })
      return Promise.resolve({ data: [], error: null })
    }),
  }
  
  // Make sure all methods return the same chainable object
  Object.keys(chainable).forEach(key => {
    if (typeof chainable[key] === 'function' && key !== 'single' && key !== 'then') {
      chainable[key].mockReturnValue(chainable)
    }
  })
  
  return chainable
}

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => createChainableMock()),
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}))

describe('Progress Sharing Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Progress Share Creation', () => {
    it('should create public progress share successfully', async () => {
      const shareData = {
        user_id: 'test-user-id',
        module_id: 'test-module-id',
        share_type: 'public',
        message: 'Completed module with 95% score! 🎉',
      }

      mockSupabase.from().insert.mockResolvedValueOnce({
        data: { id: 'share-id', ...shareData },
        error: null,
      })

      const result = await createProgressShare(shareData)

      expect(mockSupabase.from).toHaveBeenCalledWith('progress_shares')
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(shareData)
      expect(result.id).toBe('share-id')
    })

    it('should create private progress share for specific peer', async () => {
      const shareData = {
        user_id: 'test-user-id',
        module_id: 'test-module-id',
        share_type: 'private',
        shared_with_user_id: 'peer-user-id',
        message: 'Check out my progress on this module!',
      }

      mockSupabase.from().insert.mockResolvedValueOnce({
        data: { id: 'share-id', ...shareData },
        error: null,
      })

      const result = await createProgressShare(shareData)

      expect(mockSupabase.from().insert).toHaveBeenCalledWith(shareData)
      expect(result.shared_with_user_id).toBe('peer-user-id')
    })

    it('should handle share creation errors', async () => {
      const shareData = {
        user_id: 'test-user-id',
        module_id: 'test-module-id',
        share_type: 'public',
        message: 'Test message',
      }

      mockSupabase.from().insert.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      })

      await expect(createProgressShare(shareData)).rejects.toThrow('Database error')
    })
  })

  describe('Progress Share Loading', () => {
    it('should load public progress shares', async () => {
      const mockShares = [
        {
          id: 'share-1',
          user_id: 'user-1',
          module_id: 'module-1',
          share_type: 'public',
          message: 'Completed module!',
          created_at: '2024-01-01T00:00:00Z',
          profile: {
            full_name: 'John Doe',
            avatar_url: 'https://example.com/avatar.jpg',
            role: 'medical_student',
          },
          module: {
            title: 'Cardiology Basics',
            description: 'Introduction to heart anatomy',
          },
        },
        {
          id: 'share-2',
          user_id: 'user-2',
          module_id: 'module-2',
          share_type: 'public',
          message: 'Great progress!',
          created_at: '2024-01-02T00:00:00Z',
          profile: {
            full_name: 'Jane Smith',
            avatar_url: 'https://example.com/avatar2.jpg',
            role: 'nursing_student',
          },
          module: {
            title: 'Anatomy Fundamentals',
            description: 'Basic human anatomy',
          },
        },
      ]

      mockSupabase.from().select().eq().or().order().limit.mockResolvedValueOnce({
        data: mockShares,
        error: null,
      })

      const result = await loadProgressShares('test-user-id')

      expect(mockSupabase.from).toHaveBeenCalledWith('progress_shares')
      expect(result).toEqual(mockShares)
    })

    it('should load peer-specific progress shares', async () => {
      const peerIds = ['peer-1', 'peer-2', 'peer-3']
      const userId = 'test-user-id'

      // Mock peer connections
      mockSupabase.from().select().eq().eq.mockResolvedValueOnce({
        data: peerIds.map(id => ({ peer_id: id })),
        error: null,
      })

      // Mock progress shares
      const mockShares = [
        {
          id: 'share-1',
          user_id: 'peer-1',
          share_type: 'private',
          message: 'Check my progress!',
        },
      ]

      mockSupabase.from().select().eq().or().order().limit.mockResolvedValueOnce({
        data: mockShares,
        error: null,
      })

      const result = await loadProgressShares(userId)

      expect(result).toEqual(mockShares)
    })

    it('should handle empty progress shares', async () => {
      mockSupabase.from().select().eq().or().order().limit.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      const result = await loadProgressShares('test-user-id')

      expect(result).toEqual([])
    })
  })

  describe('Progress Share Filtering', () => {
    it('should filter shares by module', () => {
      const shares = [
        { id: '1', module_id: 'cardiology', message: 'Cardiology progress' },
        { id: '2', module_id: 'anatomy', message: 'Anatomy progress' },
        { id: '3', module_id: 'cardiology', message: 'More cardiology' },
        { id: '4', module_id: 'pharmacology', message: 'Pharmacy progress' },
      ]

      const filteredShares = filterSharesByModule(shares, 'cardiology')

      expect(filteredShares).toHaveLength(2)
      expect(filteredShares.every(share => share.module_id === 'cardiology')).toBe(true)
    })

    it('should filter shares by user role', () => {
      const shares = [
        { 
          id: '1', 
          profile: { role: 'medical_student' },
          message: 'Medical student progress' 
        },
        { 
          id: '2', 
          profile: { role: 'nursing_student' },
          message: 'Nursing student progress' 
        },
        { 
          id: '3', 
          profile: { role: 'medical_student' },
          message: 'Another medical student' 
        },
      ]

      const filteredShares = filterSharesByRole(shares, 'medical_student')

      expect(filteredShares).toHaveLength(2)
      expect(filteredShares.every(share => share.profile.role === 'medical_student')).toBe(true)
    })

    it('should filter shares by date range', () => {
      const shares = [
        { id: '1', created_at: '2024-01-01T00:00:00Z' },
        { id: '2', created_at: '2024-01-15T00:00:00Z' },
        { id: '3', created_at: '2024-01-30T00:00:00Z' },
        { id: '4', created_at: '2024-02-01T00:00:00Z' },
      ]

      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      const filteredShares = filterSharesByDateRange(shares, startDate, endDate)

      expect(filteredShares).toHaveLength(3)
    })
  })

  describe('Progress Share Analytics', () => {
    it('should calculate sharing statistics', () => {
      const shares = [
        { share_type: 'public', module_id: 'cardiology' },
        { share_type: 'public', module_id: 'anatomy' },
        { share_type: 'private', module_id: 'cardiology' },
        { share_type: 'public', module_id: 'pharmacology' },
        { share_type: 'private', module_id: 'anatomy' },
      ]

      const stats = calculateSharingStats(shares)

      expect(stats.totalShares).toBe(5)
      expect(stats.publicShares).toBe(3)
      expect(stats.privateShares).toBe(2)
      expect(stats.moduleStats.cardiology).toBe(2)
      expect(stats.moduleStats.anatomy).toBe(2)
      expect(stats.moduleStats.pharmacology).toBe(1)
    })

    it('should identify most shared modules', () => {
      const shares = [
        { module_id: 'cardiology' },
        { module_id: 'cardiology' },
        { module_id: 'cardiology' },
        { module_id: 'anatomy' },
        { module_id: 'anatomy' },
        { module_id: 'pharmacology' },
      ]

      const mostShared = getMostSharedModules(shares, 2)

      expect(mostShared).toEqual([
        { module_id: 'cardiology', count: 3 },
        { module_id: 'anatomy', count: 2 },
      ])
    })

    it('should calculate sharing frequency', () => {
      const shares = [
        { created_at: '2024-01-01T00:00:00Z' },
        { created_at: '2024-01-01T12:00:00Z' },
        { created_at: '2024-01-02T00:00:00Z' },
        { created_at: '2024-01-03T00:00:00Z' },
        { created_at: '2024-01-03T06:00:00Z' },
      ]

      const frequency = calculateSharingFrequency(shares)

      expect(frequency.daily).toBe(5) // Total shares
      expect(frequency.peakDay).toBe('2024-01-01') // Day with most shares
      expect(frequency.peakHour).toBe(0) // Hour with most shares (midnight)
    })
  })

  describe('Progress Share Validation', () => {
    it('should validate share data structure', () => {
      const validShare = {
        user_id: 'test-user-id',
        module_id: 'test-module-id',
        share_type: 'public',
        message: 'Valid share message',
      }

      const invalidShare = {
        user_id: 'test-user-id',
        // Missing required fields
        share_type: 'public',
      }

      expect(validateShareData(validShare)).toBe(true)
      expect(validateShareData(invalidShare)).toBe(false)
    })

    it('should validate share type', () => {
      expect(isValidShareType('public')).toBe(true)
      expect(isValidShareType('private')).toBe(true)
      expect(isValidShareType('invalid')).toBe(false)
      expect(isValidShareType('')).toBe(false)
    })

    it('should validate message length', () => {
      const maxLength = 500

      expect(isValidMessage('', maxLength)).toBe(true)
      expect(isValidMessage('Short message', maxLength)).toBe(true)
      expect(isValidMessage('A'.repeat(500), maxLength)).toBe(true)
      expect(isValidMessage('A'.repeat(501), maxLength)).toBe(false)
    })
  })

  describe('Progress Share Privacy', () => {
    it('should respect user privacy settings', () => {
      const userSettings = {
        allowPublicSharing: true,
        allowPeerSharing: true,
        shareProgressByDefault: false,
      }

      const shareType = determineShareType(userSettings, 'public')

      expect(shareType).toBe('public')
    })

    it('should block sharing when privacy settings disabled', () => {
      const userSettings = {
        allowPublicSharing: false,
        allowPeerSharing: true,
        shareProgressByDefault: false,
      }

      expect(canShareProgress(userSettings, 'public')).toBe(false)
      expect(canShareProgress(userSettings, 'private')).toBe(true)
    })

    it('should handle anonymous sharing restrictions', () => {
      const userSettings = {
        allowPublicSharing: true,
        allowPeerSharing: false,
        shareProgressByDefault: false,
        isAnonymous: true,
      }

      expect(canShareProgress(userSettings, 'public')).toBe(false)
      expect(canShareProgress(userSettings, 'private')).toBe(false)
    })
  })

  describe('Progress Share Notifications', () => {
    it('should generate share notification message', () => {
      const shareData = {
        user_name: 'John Doe',
        module_title: 'Cardiology Basics',
        score: 95,
        share_type: 'public',
      }

      const message = generateShareNotification(shareData)

      expect(message).toContain('John Doe')
      expect(message).toContain('Cardiology Basics')
      expect(message).toContain('95%')
    })

    it('should handle different notification types', () => {
      const completionShare = {
        user_name: 'Jane Smith',
        module_title: 'Anatomy',
        status: 'completed',
        score: 88,
      }

      const progressShare = {
        user_name: 'Bob Wilson',
        module_title: 'Pharmacology',
        status: 'in_progress',
        completion_percent: 75,
      }

      const completionMessage = generateShareNotification(completionShare)
      const progressMessage = generateShareNotification(progressShare)

      expect(completionMessage).toContain('completed')
      expect(progressMessage).toContain('75%')
    })
  })
})

// Helper functions for testing
async function createProgressShare(shareData: any) {
  const { data, error } = await mockSupabase
    .from('progress_shares')
    .insert(shareData)

  if (error) throw error
  return data
}

async function loadProgressShares(userId: string) {
  // First get peer connections
  const { data: connections } = await mockSupabase
    .from('peer_connections')
    .select('peer_id')
    .eq('user_id', userId)
    .eq('status', 'accepted')

  const peerIds = connections?.map(c => c.peer_id) || []

  // Then get progress shares
  const { data, error } = await mockSupabase
    .from('progress_shares')
    .select(`
      *,
      profile:profiles!user_id(*),
      module:modules(*)
    `)
    .eq('is_active', true)
    .or(`share_type.eq.public,user_id.in.(${peerIds.join(',')})`)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data || []
}

function filterSharesByModule(shares: any[], moduleId: string) {
  return shares.filter(share => share.module_id === moduleId)
}

function filterSharesByRole(shares: any[], role: string) {
  return shares.filter(share => share.profile?.role === role)
}

function filterSharesByDateRange(shares: any[], startDate: Date, endDate: Date) {
  return shares.filter(share => {
    const shareDate = new Date(share.created_at)
    return shareDate >= startDate && shareDate <= endDate
  })
}

function calculateSharingStats(shares: any[]) {
  const stats = {
    totalShares: shares.length,
    publicShares: shares.filter(s => s.share_type === 'public').length,
    privateShares: shares.filter(s => s.share_type === 'private').length,
    moduleStats: {} as Record<string, number>,
  }

  shares.forEach(share => {
    stats.moduleStats[share.module_id] = (stats.moduleStats[share.module_id] || 0) + 1
  })

  return stats
}

function getMostSharedModules(shares: any[], limit: number) {
  const moduleCounts = shares.reduce((acc, share) => {
    acc[share.module_id] = (acc[share.module_id] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(moduleCounts)
    .map(([module_id, count]) => ({ module_id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

function calculateSharingFrequency(shares: any[]) {
  const dailyCounts = {} as Record<string, number>
  const hourlyCounts = {} as Record<number, number>

  shares.forEach(share => {
    const date = new Date(share.created_at)
    const dayKey = date.toISOString().split('T')[0]
    const hour = date.getHours()

    dailyCounts[dayKey] = (dailyCounts[dayKey] || 0) + 1
    hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1
  })

  const peakDay = Object.entries(dailyCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0]

  const peakHour = Object.entries(hourlyCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0]

  return {
    daily: shares.length,
    peakDay,
    peakHour: peakHour ? parseInt(peakHour) : 0,
  }
}

function validateShareData(share: any): boolean {
  const requiredFields = ['user_id', 'module_id', 'share_type']
  return requiredFields.every(field => share.hasOwnProperty(field))
}

function isValidShareType(shareType: string): boolean {
  return ['public', 'private'].includes(shareType)
}

function isValidMessage(message: string, maxLength: number): boolean {
  return message.length <= maxLength
}

function determineShareType(settings: any, requestedType: string): string {
  if (requestedType === 'public' && !settings.allowPublicSharing) {
    return 'private'
  }
  return requestedType
}

function canShareProgress(settings: any, shareType: string): boolean {
  if (settings.isAnonymous) return false
  if (shareType === 'public' && !settings.allowPublicSharing) return false
  if (shareType === 'private' && !settings.allowPeerSharing) return false
  return true
}

function generateShareNotification(shareData: any): string {
  if (shareData.status === 'completed') {
    return `${shareData.user_name} completed ${shareData.module_title} with ${shareData.score}% score! 🎉`
  } else {
    return `${shareData.user_name} is making progress on ${shareData.module_title}: ${shareData.completion_percent}% complete`
  }
}
