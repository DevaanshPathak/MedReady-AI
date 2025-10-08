import { describe, it, expect, beforeEach } from '@jest/globals'

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}))

describe('Peer Connections Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Peer Request Creation', () => {
    it('should create peer connection request successfully', async () => {
      const connectionData = {
        user_id: 'test-user-id',
        peer_id: 'peer-user-id',
        status: 'pending',
      }

      mockSupabase.from().insert.mockResolvedValueOnce({
        data: { id: 'connection-id', ...connectionData },
        error: null,
      })

      const result = await createPeerConnection(connectionData)

      expect(mockSupabase.from).toHaveBeenCalledWith('peer_connections')
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(connectionData)
      expect(result.id).toBe('connection-id')
    })

    it('should find peer by email before creating connection', async () => {
      const userEmail = 'peer@example.com'
      const userId = 'test-user-id'

      // Mock finding peer by email
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: { id: 'peer-id', email: userEmail },
        error: null,
      })

      // Mock creating connection
      mockSupabase.from().insert.mockResolvedValueOnce({
        data: { id: 'connection-id' },
        error: null,
      })

      const result = await sendPeerRequest(userId, userEmail)

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(result.success).toBe(true)
    })

    it('should handle peer not found error', async () => {
      const userEmail = 'nonexistent@example.com'
      const userId = 'test-user-id'

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'No rows found' },
      })

      const result = await sendPeerRequest(userId, userEmail)

      expect(result.success).toBe(false)
      expect(result.error).toContain('User not found')
    })

    it('should prevent duplicate connection requests', async () => {
      const userId = 'test-user-id'
      const peerId = 'peer-user-id'

      // Mock existing connection
      mockSupabase.from().select().eq().eq().single.mockResolvedValueOnce({
        data: { id: 'existing-connection', status: 'pending' },
        error: null,
      })

      const result = await checkExistingConnection(userId, peerId)

      expect(result.exists).toBe(true)
      expect(result.status).toBe('pending')
    })
  })

  describe('Peer Request Management', () => {
    it('should accept peer connection request', async () => {
      const connectionId = 'connection-id'

      mockSupabase.from().update().eq.mockResolvedValueOnce({
        data: { id: connectionId, status: 'accepted' },
        error: null,
      })

      const result = await acceptPeerRequest(connectionId)

      expect(mockSupabase.from).toHaveBeenCalledWith('peer_connections')
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        status: 'accepted',
        accepted_at: expect.any(String),
      })
      expect(result.success).toBe(true)
    })

    it('should reject peer connection request', async () => {
      const connectionId = 'connection-id'

      mockSupabase.from().update().eq.mockResolvedValueOnce({
        data: { id: connectionId, status: 'rejected' },
        error: null,
      })

      const result = await rejectPeerRequest(connectionId)

      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        status: 'rejected',
        rejected_at: expect.any(String),
      })
      expect(result.success).toBe(true)
    })

    it('should cancel peer connection request', async () => {
      const connectionId = 'connection-id'

      mockSupabase.from().delete().eq.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      const result = await cancelPeerRequest(connectionId)

      expect(mockSupabase.from().delete).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })
  })

  describe('Peer Connection Loading', () => {
    it('should load all peer connections for user', async () => {
      const userId = 'test-user-id'
      const mockConnections = [
        {
          id: 'conn-1',
          user_id: userId,
          peer_id: 'peer-1',
          status: 'accepted',
          accepted_at: '2024-01-01T00:00:00Z',
          peer_profile: {
            id: 'peer-1',
            full_name: 'John Doe',
            email: 'john@example.com',
            specialization: 'Cardiology',
            location: 'New York',
            avatar_url: 'https://example.com/avatar.jpg',
          },
        },
        {
          id: 'conn-2',
          user_id: userId,
          peer_id: 'peer-2',
          status: 'pending',
          peer_profile: {
            id: 'peer-2',
            full_name: 'Jane Smith',
            email: 'jane@example.com',
            specialization: 'Pediatrics',
            location: 'California',
            avatar_url: 'https://example.com/avatar2.jpg',
          },
        },
      ]

      mockSupabase.from().select().eq().order.mockResolvedValueOnce({
        data: mockConnections,
        error: null,
      })

      const result = await loadPeerConnections(userId)

      expect(mockSupabase.from).toHaveBeenCalledWith('peer_connections')
      expect(result).toEqual(mockConnections)
    })

    it('should separate connections by status', () => {
      const connections = [
        { id: '1', status: 'pending' },
        { id: '2', status: 'accepted' },
        { id: '3', status: 'accepted' },
        { id: '4', status: 'rejected' },
        { id: '5', status: 'pending' },
      ]

      const { pending, accepted, rejected } = categorizeConnections(connections)

      expect(pending).toHaveLength(2)
      expect(accepted).toHaveLength(2)
      expect(rejected).toHaveLength(1)
    })

    it('should handle empty connections list', async () => {
      const userId = 'test-user-id'

      mockSupabase.from().select().eq().order.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      const result = await loadPeerConnections(userId)

      expect(result).toEqual([])
    })
  })

  describe('Peer Connection Validation', () => {
    it('should validate peer connection data', () => {
      const validConnection = {
        user_id: 'test-user-id',
        peer_id: 'peer-user-id',
        status: 'pending',
      }

      const invalidConnection = {
        user_id: 'test-user-id',
        // Missing required fields
        status: 'pending',
      }

      expect(validateConnectionData(validConnection)).toBe(true)
      expect(validateConnectionData(invalidConnection)).toBe(false)
    })

    it('should validate connection status', () => {
      expect(isValidStatus('pending')).toBe(true)
      expect(isValidStatus('accepted')).toBe(true)
      expect(isValidStatus('rejected')).toBe(true)
      expect(isValidStatus('invalid')).toBe(false)
    })

    it('should prevent self-connection', () => {
      const userId = 'test-user-id'

      expect(canConnectToPeer(userId, userId)).toBe(false)
      expect(canConnectToPeer(userId, 'different-user-id')).toBe(true)
    })
  })

  describe('Peer Connection Analytics', () => {
    it('should calculate connection statistics', () => {
      const connections = [
        { status: 'pending', created_at: '2024-01-01T00:00:00Z' },
        { status: 'accepted', created_at: '2024-01-02T00:00:00Z' },
        { status: 'accepted', created_at: '2024-01-03T00:00:00Z' },
        { status: 'rejected', created_at: '2024-01-04T00:00:00Z' },
        { status: 'accepted', created_at: '2024-01-05T00:00:00Z' },
      ]

      const stats = calculateConnectionStats(connections)

      expect(stats.total).toBe(5)
      expect(stats.pending).toBe(1)
      expect(stats.accepted).toBe(3)
      expect(stats.rejected).toBe(1)
      expect(stats.acceptanceRate).toBe(0.75) // 3 accepted out of 4 total (excluding pending)
    })

    it('should identify most active connection periods', () => {
      const connections = [
        { created_at: '2024-01-01T09:00:00Z' }, // Monday 9 AM
        { created_at: '2024-01-01T14:00:00Z' }, // Monday 2 PM
        { created_at: '2024-01-02T09:00:00Z' }, // Tuesday 9 AM
        { created_at: '2024-01-03T16:00:00Z' }, // Wednesday 4 PM
        { created_at: '2024-01-04T09:00:00Z' }, // Thursday 9 AM
      ]

      const activity = calculateConnectionActivity(connections)

      expect(activity.peakHour).toBe(9) // 9 AM has most connections
      expect(activity.peakDay).toBe(1) // Monday (day 1) has most connections
    })
  })

  describe('Peer Connection Search', () => {
    it('should search peers by name', async () => {
      const searchTerm = 'john'
      const mockPeers = [
        {
          id: 'peer-1',
          full_name: 'John Doe',
          email: 'john@example.com',
          specialization: 'Cardiology',
        },
        {
          id: 'peer-2',
          full_name: 'Jane Johnson',
          email: 'jane@example.com',
          specialization: 'Pediatrics',
        },
        {
          id: 'peer-3',
          full_name: 'Bob Smith',
          email: 'bob@example.com',
          specialization: 'Neurology',
        },
      ]

      mockSupabase.from().select().ilike().limit.mockResolvedValueOnce({
        data: mockPeers.filter(p => 
          p.full_name.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        error: null,
      })

      const result = await searchPeers(searchTerm)

      expect(result).toHaveLength(2)
      expect(result.every(p => 
        p.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      )).toBe(true)
    })

    it('should search peers by specialization', async () => {
      const specialization = 'Cardiology'
      const mockPeers = [
        {
          id: 'peer-1',
          full_name: 'John Doe',
          specialization: 'Cardiology',
        },
        {
          id: 'peer-2',
          full_name: 'Jane Smith',
          specialization: 'Pediatrics',
        },
      ]

      mockSupabase.from().select().eq().limit.mockResolvedValueOnce({
        data: mockPeers.filter(p => p.specialization === specialization),
        error: null,
      })

      const result = await searchPeersBySpecialization(specialization)

      expect(result).toHaveLength(1)
      expect(result[0].specialization).toBe(specialization)
    })
  })

  describe('Peer Connection Notifications', () => {
    it('should generate connection request notification', () => {
      const requestData = {
        requester_name: 'John Doe',
        requester_specialization: 'Cardiology',
        connection_id: 'conn-123',
      }

      const notification = generateConnectionRequestNotification(requestData)

      expect(notification.title).toContain('New Connection Request')
      expect(notification.message).toContain('John Doe')
      expect(notification.message).toContain('Cardiology')
    })

    it('should generate connection accepted notification', () => {
      const acceptData = {
        accepter_name: 'Jane Smith',
        connection_id: 'conn-123',
      }

      const notification = generateConnectionAcceptedNotification(acceptData)

      expect(notification.title).toContain('Connection Accepted')
      expect(notification.message).toContain('Jane Smith')
    })

    it('should handle notification preferences', () => {
      const userPreferences = {
        emailNotifications: true,
        pushNotifications: false,
        connectionRequests: true,
        connectionAccepted: true,
      }

      expect(shouldSendNotification(userPreferences, 'connection_request')).toBe(true)
      expect(shouldSendNotification(userPreferences, 'connection_accepted')).toBe(true)
      expect(shouldSendNotification(userPreferences, 'progress_shared')).toBe(false)
    })
  })

  describe('Peer Connection Cleanup', () => {
    it('should clean up old rejected connections', async () => {
      const cutoffDate = new Date('2024-01-01')

      mockSupabase.from().delete().eq().lt.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      await cleanupOldConnections(cutoffDate)

      expect(mockSupabase.from).toHaveBeenCalledWith('peer_connections')
      expect(mockSupabase.from().delete).toHaveBeenCalled()
    })

    it('should archive inactive connections', async () => {
      const inactiveConnections = [
        { id: 'conn-1', last_activity: '2023-12-01T00:00:00Z' },
        { id: 'conn-2', last_activity: '2023-11-15T00:00:00Z' },
      ]

      mockSupabase.from().update().eq().in.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      await archiveInactiveConnections(inactiveConnections)

      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        status: 'archived',
        archived_at: expect.any(String),
      })
    })
  })
})

// Helper functions for testing
async function createPeerConnection(connectionData: any) {
  const { data, error } = await mockSupabase
    .from('peer_connections')
    .insert(connectionData)

  if (error) throw error
  return data
}

async function sendPeerRequest(userId: string, peerEmail: string) {
  try {
    // Find peer by email
    const { data: peerData, error: peerError } = await mockSupabase
      .from('profiles')
      .select('id')
      .eq('email', peerEmail)
      .single()

    if (peerError || !peerData) {
      return { success: false, error: 'User not found' }
    }

    // Create connection request
    const { error } = await mockSupabase.from('peer_connections').insert({
      user_id: userId,
      peer_id: peerData.id,
      status: 'pending',
    })

    if (error) throw error

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to send request' }
  }
}

async function checkExistingConnection(userId: string, peerId: string) {
  const { data, error } = await mockSupabase
    .from('peer_connections')
    .select('id, status')
    .eq('user_id', userId)
    .eq('peer_id', peerId)
    .single()

  if (error) {
    return { exists: false }
  }

  return { exists: true, status: data.status }
}

async function acceptPeerRequest(connectionId: string) {
  try {
    const { data, error } = await mockSupabase
      .from('peer_connections')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', connectionId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to accept request' }
  }
}

async function rejectPeerRequest(connectionId: string) {
  try {
    const { data, error } = await mockSupabase
      .from('peer_connections')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
      })
      .eq('id', connectionId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to reject request' }
  }
}

async function cancelPeerRequest(connectionId: string) {
  try {
    const { data, error } = await mockSupabase
      .from('peer_connections')
      .delete()
      .eq('id', connectionId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to cancel request' }
  }
}

async function loadPeerConnections(userId: string) {
  const { data, error } = await mockSupabase
    .from('peer_connections')
    .select(`
      *,
      peer_profile:profiles!peer_id(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

function categorizeConnections(connections: any[]) {
  return {
    pending: connections.filter(c => c.status === 'pending'),
    accepted: connections.filter(c => c.status === 'accepted'),
    rejected: connections.filter(c => c.status === 'rejected'),
  }
}

function validateConnectionData(connection: any): boolean {
  const requiredFields = ['user_id', 'peer_id', 'status']
  return requiredFields.every(field => connection.hasOwnProperty(field))
}

function isValidStatus(status: string): boolean {
  return ['pending', 'accepted', 'rejected', 'archived'].includes(status)
}

function canConnectToPeer(userId: string, peerId: string): boolean {
  return userId !== peerId
}

function calculateConnectionStats(connections: any[]) {
  const stats = {
    total: connections.length,
    pending: connections.filter(c => c.status === 'pending').length,
    accepted: connections.filter(c => c.status === 'accepted').length,
    rejected: connections.filter(c => c.status === 'rejected').length,
    acceptanceRate: 0,
  }

  const nonPending = connections.filter(c => c.status !== 'pending')
  if (nonPending.length > 0) {
    stats.acceptanceRate = stats.accepted / nonPending.length
  }

  return stats
}

function calculateConnectionActivity(connections: any[]) {
  const hourlyCounts = {} as Record<number, number>
  const dailyCounts = {} as Record<number, number>

  connections.forEach(conn => {
    const date = new Date(conn.created_at)
    const hour = date.getHours()
    const day = date.getDay()

    hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1
    dailyCounts[day] = (dailyCounts[day] || 0) + 1
  })

  const peakHour = Object.entries(hourlyCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0]

  const peakDay = Object.entries(dailyCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0]

  return {
    peakHour: peakHour ? parseInt(peakHour) : 0,
    peakDay: peakDay ? parseInt(peakDay) : 0,
  }
}

async function searchPeers(searchTerm: string) {
  const { data, error } = await mockSupabase
    .from('profiles')
    .select('id, full_name, email, specialization')
    .ilike('full_name', `%${searchTerm}%`)
    .limit(10)

  if (error) throw error
  return data || []
}

async function searchPeersBySpecialization(specialization: string) {
  const { data, error } = await mockSupabase
    .from('profiles')
    .select('id, full_name, specialization')
    .eq('specialization', specialization)
    .limit(20)

  if (error) throw error
  return data || []
}

function generateConnectionRequestNotification(requestData: any) {
  return {
    title: 'New Connection Request',
    message: `${requestData.requester_name} (${requestData.requester_specialization}) wants to connect with you`,
    type: 'connection_request',
    data: { connection_id: requestData.connection_id },
  }
}

function generateConnectionAcceptedNotification(acceptData: any) {
  return {
    title: 'Connection Accepted',
    message: `${acceptData.accepter_name} accepted your connection request`,
    type: 'connection_accepted',
    data: { connection_id: acceptData.connection_id },
  }
}

function shouldSendNotification(preferences: any, notificationType: string): boolean {
  if (!preferences.emailNotifications) return false
  
  switch (notificationType) {
    case 'connection_request':
      return preferences.connectionRequests
    case 'connection_accepted':
      return preferences.connectionAccepted
    default:
      return false
  }
}

async function cleanupOldConnections(cutoffDate: Date) {
  const { data, error } = await mockSupabase
    .from('peer_connections')
    .delete()
    .eq('status', 'rejected')
    .lt('created_at', cutoffDate.toISOString())

  if (error) throw error
  return data
}

async function archiveInactiveConnections(connections: any[]) {
  const connectionIds = connections.map(c => c.id)
  
  const { data, error } = await mockSupabase
    .from('peer_connections')
    .update({
      status: 'archived',
      archived_at: new Date().toISOString(),
    })
    .eq('id', connectionIds)

  if (error) throw error
  return data
}
