import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SignUpPage from '@/app/auth/sign-up/page'

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn().mockResolvedValue({
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null,
      }),
    },
  })),
}))

describe('Sign Up Page', () => {
  it('renders sign up form with all fields', () => {
    render(<SignUpPage />)
    
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/specialization/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('has link to login page', () => {
    render(<SignUpPage />)
    const signInLink = screen.getByText(/sign in/i)
    expect(signInLink).toBeInTheDocument()
    expect(signInLink.closest('a')).toHaveAttribute('href', '/auth/login')
  })

  it('allows typing in all form fields', async () => {
    const user = userEvent.setup()
    render(<SignUpPage />)
    
    const nameInput = screen.getByLabelText(/full name/i) as HTMLInputElement
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement
    const specializationInput = screen.getByLabelText(/specialization/i) as HTMLInputElement
    const locationInput = screen.getByLabelText(/location/i) as HTMLInputElement
    
    await user.type(nameInput, 'Dr. John Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(specializationInput, 'Cardiology')
    await user.type(locationInput, 'Mumbai, India')
    
    expect(nameInput.value).toBe('Dr. John Doe')
    expect(emailInput.value).toBe('john@example.com')
    expect(passwordInput.value).toBe('password123')
    expect(specializationInput.value).toBe('Cardiology')
    expect(locationInput.value).toBe('Mumbai, India')
  })

  it('has proper z-index on role selector to prevent overlap', () => {
    const { container } = render(<SignUpPage />)
    const roleField = container.querySelector('[id="role"]')?.closest('div')
    expect(roleField).toHaveClass('z-10')
  })

  it('enforces minimum password length', () => {
    render(<SignUpPage />)
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement
    expect(passwordInput).toHaveAttribute('minLength', '6')
  })

  it('marks required fields as required', () => {
    render(<SignUpPage />)
    
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    
    expect(nameInput).toBeRequired()
    expect(emailInput).toBeRequired()
    expect(passwordInput).toBeRequired()
  })

  it('has proper input types', () => {
    render(<SignUpPage />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const textInput = screen.getByLabelText(/full name/i)
    
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(textInput).toHaveAttribute('type', 'text')
  })
})
