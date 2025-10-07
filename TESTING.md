# Testing Guide for MedReady AI

## Overview
This project uses **Jest** and **React Testing Library** for unit and integration tests, with automated testing via **GitHub Actions**.

## Testing Stack
- **Jest 29.7.0** - JavaScript testing framework
- **React Testing Library 14.3.1** - React component testing utilities
- **@testing-library/jest-dom** - Custom Jest matchers for DOM assertions
- **@testing-library/user-event** - User interaction simulation
- **jest-environment-jsdom** - DOM environment for browser testing

## Running Tests

### Local Development
```bash
# Run all tests
pnpm test

# Run tests in watch mode (auto-rerun on file changes)
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run tests in CI mode (single run, no watch)
pnpm test:ci
```

### Coverage Thresholds
Configured in `jest.config.js`:
- **Branches**: 50%
- **Functions**: 50%
- **Lines**: 50%
- **Statements**: 50%

## Test Structure

```
__tests__/
├── components/        # UI component tests
│   ├── button.test.tsx
│   ├── card.test.tsx
│   └── input.test.tsx
├── lib/              # Utility and library tests
│   ├── utils.test.ts
│   └── supabase-client.test.ts
└── app/              # Page and route tests
    └── auth/
        ├── login.test.tsx
        └── signup.test.tsx
```

## Writing Tests

### Component Test Example
```typescript
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })
})
```

### User Interaction Test Example
```typescript
import userEvent from '@testing-library/user-event'

it('handles user input', async () => {
  const user = userEvent.setup()
  render(<Input placeholder="Type here" />)
  const input = screen.getByPlaceholderText('Type here')
  
  await user.type(input, 'Hello World')
  expect(input).toHaveValue('Hello World')
})
```

### Async Test Example
```typescript
import { waitFor } from '@testing-library/react'

it('loads data asynchronously', async () => {
  render(<DataComponent />)
  
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument()
  })
})
```

## Mocking

### Supabase Client Mock
Already configured in `jest.setup.js`:
```typescript
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: { /* mocked auth methods */ },
    from: jest.fn(() => ({ /* mocked query builder */ })),
  })),
}))
```

### Next.js Router Mock
Already configured in `jest.setup.js`:
```typescript
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  redirect: jest.fn(),
}))
```

### Custom Mock Example
```typescript
jest.mock('@/lib/my-module', () => ({
  myFunction: jest.fn().mockReturnValue('mocked value'),
}))
```

## GitHub Actions CI/CD

### Workflows

#### 1. **Main CI Pipeline** (`.github/workflows/ci.yml`)
Runs on every push and PR:
- ✅ Dependency security check (`pnpm audit`)
- ✅ ESLint code quality check
- ✅ TypeScript type checking
- ✅ Unit tests with coverage
- ✅ Application build verification
- ✅ Upload coverage to Codecov (optional)

#### 2. **Dependency Review** (`.github/workflows/dependency-review.yml`)
Runs on PRs:
- ✅ Reviews new dependencies for security vulnerabilities
- ✅ Checks for license compliance
- ✅ Comments on PRs with findings

#### 3. **CodeQL Security Analysis** (`.github/workflows/codeql.yml`)
Runs on push, PR, and weekly schedule:
- ✅ Static code analysis for security vulnerabilities
- ✅ JavaScript/TypeScript security scanning
- ✅ Generates security alerts in GitHub Security tab

#### 4. **Dependabot** (`.github/dependabot.yml`)
Automated dependency updates:
- ✅ Weekly dependency update PRs
- ✅ Groups related packages together
- ✅ Security vulnerability patches

## CI Environment Setup

### Required GitHub Secrets
Add these in **Settings → Secrets and variables → Actions**:

```
NEXT_PUBLIC_SUPABASE_URL          # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Your Supabase anon key
CODECOV_TOKEN                      # (Optional) For coverage reporting
```

### Status Badges
Add to your README.md:
```markdown
![CI Tests](https://github.com/your-username/medready-ai/actions/workflows/ci.yml/badge.svg)
![CodeQL](https://github.com/your-username/medready-ai/actions/workflows/codeql.yml/badge.svg)
```

## Best Practices

### ✅ DO
- Write tests for critical user flows (auth, chat, learning modules)
- Test component behavior, not implementation details
- Use `screen.getByRole()` for accessibility-friendly queries
- Mock external dependencies (API calls, Supabase, etc.)
- Keep tests focused and isolated
- Use descriptive test names: `it('should redirect to dashboard after login')`

### ❌ DON'T
- Test third-party library internals
- Write implementation-detail tests (CSS classes, internal state)
- Skip async handling (`waitFor`, `async/await`)
- Ignore TypeScript errors in tests
- Mock everything (only mock external dependencies)

## Debugging Tests

### VSCode Integration
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest: Current Test",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["${file}", "--config", "jest.config.js"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Debug Single Test
```bash
# Run specific test file
pnpm test button.test.tsx

# Run tests matching pattern
pnpm test --testNamePattern="renders button"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Common Issues

#### Issue: "Cannot find module '@testing-library/react'"
**Solution**: Run `pnpm install` to install test dependencies

#### Issue: "ReferenceError: document is not defined"
**Solution**: Ensure `jest.config.js` sets `testEnvironment: 'jsdom'`

#### Issue: Tests fail with "fetch is not defined"
**Solution**: Add `global.fetch = jest.fn()` to `jest.setup.js`

#### Issue: React 19 peer dependency warnings
**Solution**: These are warnings only, tests will run fine. React Testing Library will update support soon.

## Additional Resources
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Quick Reference

### Useful Testing Library Queries
```typescript
// By role (preferred for accessibility)
screen.getByRole('button', { name: /submit/i })
screen.getByRole('textbox', { name: /email/i })

// By label text
screen.getByLabelText(/password/i)

// By placeholder
screen.getByPlaceholderText(/enter email/i)

// By text content
screen.getByText(/welcome/i)

// By test ID (use sparingly)
screen.getByTestId('custom-element')
```

### Assertion Examples
```typescript
expect(element).toBeInTheDocument()
expect(element).toBeVisible()
expect(element).toBeDisabled()
expect(element).toHaveClass('active')
expect(element).toHaveAttribute('href', '/dashboard')
expect(element).toHaveValue('test@example.com')
expect(mockFn).toHaveBeenCalledTimes(1)
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
```
