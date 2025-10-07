import { cn } from '@/lib/utils'

describe('Utils - cn function', () => {
  it('merges class names correctly', () => {
    const result = cn('class-1', 'class-2')
    expect(result).toBe('class-1 class-2')
  })

  it('handles conditional classes', () => {
    const isActive = true
    const result = cn('base', isActive && 'active')
    expect(result).toBe('base active')
  })

  it('filters out falsy values', () => {
    const result = cn('base', false, null, undefined, 'valid')
    expect(result).toBe('base valid')
  })

  it('merges Tailwind classes correctly', () => {
    const result = cn('p-4', 'p-8')
    // The later class should override
    expect(result).toContain('p-8')
    expect(result).not.toContain('p-4')
  })

  it('handles array of classes', () => {
    const result = cn(['class-1', 'class-2'], 'class-3')
    expect(result).toContain('class-1')
    expect(result).toContain('class-2')
    expect(result).toContain('class-3')
  })

  it('handles empty input', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('handles object notation', () => {
    const result = cn({ 'active': true, 'disabled': false })
    expect(result).toContain('active')
    expect(result).not.toContain('disabled')
  })
})
