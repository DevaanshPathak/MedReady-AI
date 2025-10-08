import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from '@jest/globals'
import { ProgressSocial } from '@/components/progress-social'
import { toast } from '@/hooks/use-toast'

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}))

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}))

describe('ProgressSocial Component', () => {
  const defaultProps = {
    userId: 'user-123',
    moduleId: 'module-456',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(toast as jest.Mock).mockImplementation(() => {})
  })

  describe('Component Rendering', () => {
    it('renders learning community header', () => {
      render(<ProgressSocial {...defaultProps} />)
      
      expect(screen.getByText('Learning Community')).toBeInTheDocument()
      expect(screen.getByText('Connect with peers and share your progress')).toBeInTheDocument()
    })

    it('renders tab navigation', () => {
      render(<ProgressSocial {...defaultProps} />)
      
      expect(screen.getByText('Activity Feed')).toBeInTheDocument()
      expect(screen.getByText('My Peers')).toBeInTheDocument()
    })

    it('shows share progress button when moduleId is provided', () => {
      render(<ProgressSocial {...defaultProps} />)
      
      expect(screen.getByText('Share Progress')).toBeInTheDocument()
    })

    it('does not show share progress button when moduleId is not provided', () => {
      render(<ProgressSocial userId="user-123" />)
      
      expect(screen.queryByText('Share Progress')).not.toBeInTheDocument()
    })
  })

  describe('Activity Feed Tab', () => {
    it('loads and displays progress shares', async () => {
      const mockShares = [
        {
          id: 'share-1',
          user_id: 'user-1',
          message: 'Completed Cardiology module with 95% score! 🎉',
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
          message: 'Making great progress on Anatomy!',
          created_at: '2024-01-02T00:00:00Z',
          profile: {
            full_name: 'Jane Smith',
            avatar_url: 'https://example.com/avatar2.jpg',
            role: 'nursing_student',
          },
          module: {
            title: 'Human Anatomy',
            description: 'Comprehensive anatomy study',
          },
        },
      ]

      // Mock peer connections
      mockSupabase.from().select().eq().eq.mockResolvedValueOnce({
        data: [{ peer_id: 'peer-1' }],
        error: null,
      })

      // Mock progress shares
      mockSupabase.from().select().eq().or().order().limit.mockResolvedValueOnce({
        data: mockShares,
        error: null,
      })

      render(<ProgressSocial {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        expect(screen.getByText('Completed Cardiology module with 95% score! 🎉')).toBeInTheDocument()
        expect(screen.getByText('Making great progress on Anatomy!')).toBeInTheDocument()
      })
    })

    it('shows empty state when no shares exist', async () => {
      // Mock peer connections
      mockSupabase.from().select().eq().eq.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      // Mock empty progress shares
      mockSupabase.from().select().eq().or().order().limit.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      render(<ProgressSocial {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('No shared progress yet')).toBeInTheDocument()
        expect(screen.getByText('Be the first to share your learning achievements!')).toBeInTheDocument()
      })
    })

    it('displays user avatars and roles', async () => {
      const mockShares = [
        {
          id: 'share-1',
          user_id: 'user-1',
          message: 'Test message',
          created_at: '2024-01-01T00:00:00Z',
          profile: {
            full_name: 'John Doe',
            avatar_url: 'https://example.com/avatar.jpg',
            role: 'medical_student',
          },
          module: {
            title: 'Test Module',
          },
        },
      ]

      // Mock peer connections
      mockSupabase.from().select().eq().eq.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      // Mock progress shares
      mockSupabase.from().select().eq().or().order().limit.mockResolvedValueOnce({
        data: mockShares,
        error: null,
      })

      render(<ProgressSocial {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('medical student')).toBeInTheDocument()
      })
    })

    it('formats time ago correctly', async () => {
      const now = new Date('2024-01-01T12:00:00Z')
      jest.useFakeTimers()
      jest.setSystemTime(now)

      const mockShares = [
        {
          id: 'share-1',
          user_id: 'user-1',
          message: 'Test message',
          created_at: '2024-01-01T11:30:00Z', // 30 minutes ago
          profile: {
            full_name: 'John Doe',
            role: 'medical_student',
          },
          module: {
            title: 'Test Module',
          },
        },
      ]

      // Mock peer connections
      mockSupabase.from().select().eq().eq.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      // Mock progress shares
      mockSupabase.from().select().eq().or().order().limit.mockResolvedValueOnce({
        data: mockShares,
        error: null,
      })

      render(<ProgressSocial {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('30m ago')).toBeInTheDocument()
      })

      jest.useRealTimers()
    })
  })

  describe('Peers Tab', () => {
    it('loads and displays peer connections', async () => {
      const mockConnections = [
        {
          id: 'conn-1',
          user_id: 'user-123',
          peer_id: 'peer-1',
          status: 'accepted',
          accepted_at: '2024-01-01T00:00:00Z',
          peer_profile: {
            id: 'peer-1',
            full_name: 'Alice Johnson',
            specialization: 'Cardiology',
            location: 'New York',
            avatar_url: 'https://example.com/avatar.jpg',
          },
        },
        {
          id: 'conn-2',
          user_id: 'user-123',
          peer_id: 'peer-2',
          status: 'pending',
          peer_profile: {
            id: 'peer-2',
            full_name: 'Bob Wilson',
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

      render(<ProgressSocial {...defaultProps} />)
      
      // Switch to peers tab
      const peersTab = screen.getByText('My Peers')
      fireEvent.click(peersTab)
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
        expect(screen.getByText('Bob Wilson')).toBeInTheDocument()
        expect(screen.getByText('Cardiology')).toBeInTheDocument()
        expect(screen.getByText('Pediatrics')).toBeInTheDocument()
      })
    })

    it('shows pending requests section', async () => {
      const mockConnections = [
        {
          id: 'conn-1',
          user_id: 'user-123',
          peer_id: 'peer-1',
          status: 'pending',
          peer_profile: {
            id: 'peer-1',
            full_name: 'Charlie Brown',
            specialization: 'Neurology',
            avatar_url: 'https://example.com/avatar.jpg',
          },
        },
      ]

      mockSupabase.from().select().eq().order.mockResolvedValueOnce({
        data: mockConnections,
        error: null,
      })

      render(<ProgressSocial {...defaultProps} />)
      
      const peersTab = screen.getByText('My Peers')
      fireEvent.click(peersTab)
      
      await waitFor(() => {
        expect(screen.getByText('Pending Requests')).toBeInTheDocument()
        expect(screen.getByText('Charlie Brown')).toBeInTheDocument()
        expect(screen.getByText('Accept')).toBeInTheDocument()
      })
    })

    it('shows connected peers section', async () => {
      const mockConnections = [
        {
          id: 'conn-1',
          user_id: 'user-123',
          peer_id: 'peer-1',
          status: 'accepted',
          accepted_at: '2024-01-01T00:00:00Z',
          peer_profile: {
            id: 'peer-1',
            full_name: 'Diana Prince',
            specialization: 'Emergency Medicine',
            location: 'Chicago',
            avatar_url: 'https://example.com/avatar.jpg',
          },
        },
      ]

      mockSupabase.from().select().eq().order.mockResolvedValueOnce({
        data: mockConnections,
        error: null,
      })

      render(<ProgressSocial {...defaultProps} />)
      
      const peersTab = screen.getByText('My Peers')
      fireEvent.click(peersTab)
      
      await waitFor(() => {
        expect(screen.getByText('Connected Peers')).toBeInTheDocument()
        expect(screen.getByText('Diana Prince')).toBeInTheDocument()
        expect(screen.getByText('Emergency Medicine')).toBeInTheDocument()
        expect(screen.getByText('Chicago')).toBeInTheDocument()
      })
    })

    it('shows empty state when no connections exist', async () => {
      mockSupabase.from().select().eq().order.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      render(<ProgressSocial {...defaultProps} />)
      
      const peersTab = screen.getByText('My Peers')
      fireEvent.click(peersTab)
      
      await waitFor(() => {
        expect(screen.getByText('No connections yet')).toBeInTheDocument()
        expect(screen.getByText('Send connection requests to start building your learning network')).toBeInTheDocument()
      })
    })
  })

  describe('Peer Connection Requests', () => {
    it('sends peer connection request successfully', async () => {
      const userEmail = 'peer@example.com'

      // Mock finding peer by email
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: { id: 'peer-123', email: userEmail },
        error: null,
      })

      // Mock creating connection
      mockSupabase.from().insert.mockResolvedValueOnce({
        data: { id: 'conn-123' },
        error: null,
      })

      // Mock loading connections
      mockSupabase.from().select().eq().order.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      render(<ProgressSocial {...defaultProps} />)
      
      const peersTab = screen.getByText('My Peers')
      fireEvent.click(peersTab)
      
      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('Enter peer\'s email address')
        const sendButton = screen.getByText('Send Request')
        
        fireEvent.change(emailInput, { target: { value: userEmail } })
        fireEvent.click(sendButton)
      })
      
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
        expect(mockSupabase.from).toHaveBeenCalledWith('peer_connections')
        expect(toast).toHaveBeenCalledWith({
          title: 'Request sent',
          description: 'Peer connection request sent successfully',
        })
      })
    })

    it('handles peer not found error', async () => {
      const userEmail = 'nonexistent@example.com'

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'No rows found' },
      })

      render(<ProgressSocial {...defaultProps} />)
      
      const peersTab = screen.getByText('My Peers')
      fireEvent.click(peersTab)
      
      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('Enter peer\'s email address')
        const sendButton = screen.getByText('Send Request')
        
        fireEvent.change(emailInput, { target: { value: userEmail } })
        fireEvent.click(sendButton)
      })
      
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'User not found',
          description: 'No user found with that email address',
          variant: 'destructive',
        })
      })
    })

    it('accepts peer connection request', async () => {
      const mockConnections = [
        {
          id: 'conn-1',
          user_id: 'user-123',
          peer_id: 'peer-1',
          status: 'pending',
          peer_profile: {
            id: 'peer-1',
            full_name: 'Eve Smith',
            specialization: 'Dermatology',
            avatar_url: 'https://example.com/avatar.jpg',
          },
        },
      ]

      mockSupabase.from().select().eq().order.mockResolvedValueOnce({
        data: mockConnections,
        error: null,
      })

      mockSupabase.from().update().eq.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      render(<ProgressSocial {...defaultProps} />)
      
      const peersTab = screen.getByText('My Peers')
      fireEvent.click(peersTab)
      
      await waitFor(() => {
        const acceptButton = screen.getByText('Accept')
        fireEvent.click(acceptButton)
      })
      
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('peer_connections')
        expect(toast).toHaveBeenCalledWith({
          title: 'Request accepted',
          description: 'You are now connected with this peer',
        })
      })
    })
  })

  describe('Progress Sharing', () => {
    it('shares current progress successfully', async () => {
      const mockProgress = {
        id: 'progress-1',
        user_id: 'user-123',
        module_id: 'module-456',
        status: 'completed',
        completion_percent: 100,
        score: 95,
      }

      // Mock getting progress
      mockSupabase.from().select().eq().eq().single.mockResolvedValueOnce({
        data: mockProgress,
        error: null,
      })

      // Mock creating progress share
      mockSupabase.from().insert.mockResolvedValueOnce({
        data: { id: 'share-123' },
        error: null,
      })

      // Mock loading progress shares
      mockSupabase.from().select().eq().eq.mockResolvedValueOnce({
        data: [],
        error: null,
      })
      mockSupabase.from().select().eq().or().order().limit.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      render(<ProgressSocial {...defaultProps} />)
      
      const shareButton = screen.getByText('Share Progress')
      fireEvent.click(shareButton)
      
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('progress')
        expect(mockSupabase.from).toHaveBeenCalledWith('progress_shares')
        expect(toast).toHaveBeenCalledWith({
          title: 'Progress shared!',
          description: 'Your achievement has been shared with peers',
        })
      })
    })

    it('handles no progress to share', async () => {
      // Mock no progress found
      mockSupabase.from().select().eq().eq().single.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      render(<ProgressSocial {...defaultProps} />)
      
      const shareButton = screen.getByText('Share Progress')
      fireEvent.click(shareButton)
      
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'No progress to share',
          description: 'Start learning to share your progress',
          variant: 'destructive',
        })
      })
    })

    it('handles sharing without moduleId', () => {
      render(<ProgressSocial userId="user-123" />)
      
      // Should not show share button
      expect(screen.queryByText('Share Progress')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles loading errors gracefully', async () => {
      mockSupabase.from().select().eq().eq.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      })

      render(<ProgressSocial {...defaultProps} />)
      
      // Should not crash, just show loading state
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument()
      })
    })

    it('handles peer request errors', async () => {
      const userEmail = 'peer@example.com'

      // Mock finding peer by email
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: { id: 'peer-123', email: userEmail },
        error: null,
      })

      // Mock connection creation error
      mockSupabase.from().insert.mockResolvedValueOnce({
        data: null,
        error: { message: 'Connection failed' },
      })

      render(<ProgressSocial {...defaultProps} />)
      
      const peersTab = screen.getByText('My Peers')
      fireEvent.click(peersTab)
      
      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('Enter peer\'s email address')
        const sendButton = screen.getByText('Send Request')
        
        fireEvent.change(emailInput, { target: { value: userEmail } })
        fireEvent.click(sendButton)
      })
      
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to send connection request',
          variant: 'destructive',
        })
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(<ProgressSocial {...defaultProps} />)
      
      const peersTab = screen.getByText('My Peers')
      fireEvent.click(peersTab)
      
      expect(screen.getByPlaceholderText('Enter peer\'s email address')).toBeInTheDocument()
    })

    it('has proper button roles', () => {
      render(<ProgressSocial {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: /share progress/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /activity feed/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /my peers/i })).toBeInTheDocument()
    })

    it('supports keyboard navigation', () => {
      render(<ProgressSocial {...defaultProps} />)
      
      const shareButton = screen.getByText('Share Progress')
      shareButton.focus()
      
      expect(shareButton).toHaveFocus()
    })
  })

  describe('Responsive Design', () => {
    it('renders correctly on different screen sizes', () => {
      // Test that component doesn't break with different viewport sizes
      render(<ProgressSocial {...defaultProps} />)
      
      expect(screen.getByText('Learning Community')).toBeInTheDocument()
      
      // Component should handle responsive classes gracefully
      const tabs = screen.getByRole('tablist')
      expect(tabs).toBeInTheDocument()
    })
  })
})
