# Contributing to MedReady AI

Thank you for your interest in contributing to MedReady AI! This document provides guidelines and instructions for contributing.

## 🚀 Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/MedReady-AI.git`
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env.local` and add your keys
5. Run the development server: `npm run dev`
6. Open [http://localhost:3000](http://localhost:3000)

## 📋 Development Workflow

### Setting Up Your Development Environment

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/MedReady-AI.git
cd MedReady-AI

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

### Creating a Branch

Always create a new branch for your changes:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding tests

## 🎯 Areas to Contribute

### High Priority

- [ ] Add more medical specialties/topics
- [ ] Implement spaced repetition algorithm
- [ ] Add difficulty progression system
- [ ] Create study plan generator
- [ ] Add flashcard feature
- [ ] Implement performance predictions

### Medium Priority

- [ ] Add image-based questions
- [ ] Implement question bookmarking
- [ ] Add social features (leaderboards, study groups)
- [ ] Create mobile app (React Native)
- [ ] Add offline mode
- [ ] Implement question favorites

### Documentation

- [ ] Add API documentation
- [ ] Create component documentation
- [ ] Add video tutorials
- [ ] Write blog posts about features
- [ ] Translate documentation

## 🔧 Code Style

We use ESLint and TypeScript for code quality. Please ensure:

```bash
# Run linter
npm run lint

# Build to check for type errors
npm run build
```

### TypeScript

- Always use TypeScript types
- Avoid `any` types when possible
- Export types from `src/types/index.ts`

### React Components

- Use functional components with hooks
- Use descriptive component names
- Keep components focused and small
- Add comments for complex logic

Example:
```typescript
// Good
const QuestionCard: React.FC<QuestionCardProps> = ({ question, onAnswer }) => {
  // Component logic
}

// Avoid
const Card = (props: any) => {
  // Component logic
}
```

### File Organization

```
src/
├── app/              # Next.js app router pages
│   ├── api/         # API routes
│   ├── auth/        # Authentication pages
│   └── ...
├── components/       # Reusable components
├── lib/             # Library code (OpenAI, utilities)
├── middleware.ts    # Clerk authentication middleware
├── types/           # TypeScript types
└── utils/           # Utility functions
```

## 🧪 Testing

While we don't have extensive tests yet, please:

1. Test your changes manually
2. Test on different screen sizes
3. Check browser console for errors
4. Verify database operations work

## 📝 Commit Messages

Use clear, descriptive commit messages:

```bash
# Good
git commit -m "Add ability to bookmark questions"
git commit -m "Fix quiz timer not stopping on completion"
git commit -m "Update README with deployment instructions"

# Avoid
git commit -m "update"
git commit -m "fix bug"
git commit -m "changes"
```

### Commit Message Format

```
<type>: <subject>

<body (optional)>

<footer (optional)>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

## 🔀 Pull Request Process

1. **Update your fork**
   ```bash
   git fetch upstream
   git merge upstream/main
   ```

2. **Make your changes**
   - Write clean, commented code
   - Follow the code style guidelines
   - Test your changes thoroughly

3. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill in the PR template

### PR Title Format

```
[Type] Brief description

Examples:
[Feature] Add question bookmarking functionality
[Fix] Resolve timer not stopping on quiz completion
[Docs] Update deployment guide
```

### PR Description Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Tested in production environment
- [ ] Added/updated tests

## Screenshots (if applicable)
Add screenshots here

## Related Issues
Fixes #123
```

## 🎨 UI/UX Guidelines

### Design Principles

1. **Simplicity**: Keep interfaces clean and intuitive
2. **Consistency**: Use existing components and patterns
3. **Accessibility**: Ensure all users can use the app
4. **Responsiveness**: Test on mobile, tablet, and desktop

### Colors

We use Tailwind CSS with a custom primary color palette:
- Primary: Blue (Healthcare theme)
- Success: Green
- Warning: Orange
- Error: Red

### Typography

- Headings: Bold, larger sizes
- Body: Regular weight
- Code: Monospace font

## 🐛 Reporting Bugs

When reporting bugs, please include:

1. **Description**: Clear description of the bug
2. **Steps to Reproduce**: Step-by-step instructions
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Screenshots**: If applicable
6. **Environment**: Browser, OS, device

## 💡 Suggesting Features

When suggesting features:

1. **Use Case**: Why is this feature needed?
2. **Description**: Detailed description of the feature
3. **Benefits**: Who benefits and how?
4. **Mockups**: Design mockups if applicable

## 📚 Resources

### Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Tools

- [Lucide Icons](https://lucide.dev/)
- [Recharts Documentation](https://recharts.org/)

## 🤝 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards others

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team.

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## ❓ Questions?

If you have questions:

1. Check existing issues and documentation
2. Ask in GitHub Discussions
3. Open a new issue with the "question" label

## 🙏 Thank You!

Your contributions make MedReady AI better for medical students everywhere. Thank you for your time and effort!

---

**Happy Coding! 🚀**
