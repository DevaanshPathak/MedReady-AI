import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'

describe('Input Component', () => {
  it('renders input field', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('handles text input', async () => {
    const user = userEvent.setup()
    render(<Input placeholder="Type here" />)
    const input = screen.getByPlaceholderText('Type here') as HTMLInputElement
    
    await user.type(input, 'Hello World')
    expect(input.value).toBe('Hello World')
  })

  it('can be disabled', () => {
    render(<Input disabled placeholder="Disabled" />)
    const input = screen.getByPlaceholderText('Disabled')
    expect(input).toBeDisabled()
  })

  it('accepts different input types', () => {
    const { rerender } = render(<Input type="email" placeholder="Email" />)
    expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email')

    rerender(<Input type="password" placeholder="Password" />)
    expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password')
  })

  it('applies focus styles on focus', () => {
    render(<Input placeholder="Focus me" />)
    const input = screen.getByPlaceholderText('Focus me')
    expect(input).toHaveClass('focus-visible:border-ring', 'focus-visible:ring-ring/50')
  })

  it('supports custom className', () => {
    render(<Input className="custom-input" placeholder="Custom" />)
    const input = screen.getByPlaceholderText('Custom')
    expect(input).toHaveClass('custom-input')
  })
})
