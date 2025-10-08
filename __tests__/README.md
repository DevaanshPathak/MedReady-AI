# MedReady AI - Advanced Learning Features Test Suite

This comprehensive test suite covers all the advanced learning features described in the architecture document.

## Test Structure

### Core Feature Tests

#### 1. Spaced Repetition Algorithm (`__tests__/lib/spaced-repetition.test.ts`)
- **Quality Score Calculation**: Tests the 0-5 quality scoring system
- **Ease Factor Updates**: Tests how ease factors change based on performance
- **Interval Calculation**: Tests the scheduling algorithm for reviews
- **Database Integration**: Tests RPC calls to PostgreSQL functions
- **Question Hash Generation**: Tests consistent hashing for question identification

#### 2. Timed Quiz Mode (`__tests__/lib/timed-quiz.test.ts`)
- **Timer Management**: Tests countdown, formatting, and auto-submission
- **Quiz Session Creation**: Tests session initialization and tracking
- **Answer Tracking**: Tests real-time answer updates
- **Pause/Resume Functionality**: Tests timer control features
- **Performance Metrics**: Tests speed and accuracy calculations

#### 3. Bookmarking and Notes (`__tests__/lib/bookmarking.test.ts`)
- **Question Hash Generation**: Tests consistent question identification
- **Bookmark Operations**: Tests add, remove, and toggle functionality
- **Notes Management**: Tests saving and updating question notes
- **Bookmark Loading**: Tests retrieval and filtering
- **Validation**: Tests data integrity and constraints

#### 4. Progress Sharing (`__tests__/lib/progress-sharing.test.ts`)
- **Share Creation**: Tests public and private sharing
- **Share Loading**: Tests feed generation and peer filtering
- **Analytics**: Tests sharing statistics and trends
- **Privacy Controls**: Tests user privacy settings
- **Notifications**: Tests share notification generation

#### 5. Peer Connections (`__tests__/lib/peer-connections.test.ts`)
- **Request Management**: Tests sending, accepting, and rejecting requests
- **Connection Loading**: Tests retrieval and categorization
- **Validation**: Tests data integrity and business rules
- **Analytics**: Tests connection statistics and activity
- **Search and Discovery**: Tests finding peers by name/specialization

### Component Tests

#### 6. AssessmentQuizEnhanced Component (`__tests__/components/assessment-quiz-enhanced.test.tsx`)
- **Mode Selection**: Tests switching between practice, timed, and spaced repetition
- **Question Navigation**: Tests moving between questions and progress tracking
- **Answer Selection**: Tests radio button interactions and state management
- **Bookmarking**: Tests bookmark toggle and notes functionality
- **Timer Functionality**: Tests countdown, pause/resume, and auto-submission
- **Quiz Submission**: Tests scoring, results display, and certificate generation
- **Progress Sharing**: Tests sharing achievements after completion
- **Spaced Repetition Integration**: Tests algorithm updates during review mode

#### 7. ProgressSocial Component (`__tests__/components/progress-social.test.tsx`)
- **Activity Feed**: Tests loading and displaying progress shares
- **Peer Management**: Tests connection requests and peer lists
- **Progress Sharing**: Tests sharing current progress
- **Error Handling**: Tests graceful failure handling
- **Accessibility**: Tests keyboard navigation and ARIA labels

### Database Tests

#### 8. Database Functions and RLS (`__tests__/database/functions.test.ts`)
- **Spaced Repetition Functions**: Tests PostgreSQL RPC functions
- **Row Level Security**: Tests user isolation and data access controls
- **Data Validation**: Tests constraints, foreign keys, and data types
- **Performance**: Tests indexing and query optimization
- **Security**: Tests cross-user access prevention

### Integration Tests

#### 9. Learning Features Integration (`__tests__/integration/learning-features.test.ts`)
- **Complete Learning Workflow**: Tests end-to-end user journey
- **Progress Sharing Integration**: Tests sharing and peer notification
- **Quiz Mode Integration**: Tests mode switching and state persistence
- **Error Handling**: Tests graceful failure handling
- **Performance**: Tests large dataset handling and pagination
- **Data Consistency**: Tests concurrent operations and data integrity

## Test Coverage

### Features Covered ✅
- ✅ Spaced Repetition Algorithm
- ✅ Timed Quiz Mode
- ✅ Bookmarking and Notes
- ✅ Progress Sharing
- ✅ Peer Connections
- ✅ AssessmentQuizEnhanced Component
- ✅ ProgressSocial Component
- ✅ Database Functions and RLS
- ✅ Integration Workflows

### Test Types
- **Unit Tests**: Individual function and component testing
- **Integration Tests**: Cross-feature workflow testing
- **Component Tests**: React component behavior testing
- **Database Tests**: SQL function and RLS policy testing
- **Performance Tests**: Large dataset and pagination testing

### Mocking Strategy
- **Supabase Client**: Mocked for all database operations
- **Next.js Router**: Mocked for navigation testing
- **Toast Notifications**: Mocked for user feedback testing
- **Crypto Functions**: Mocked for consistent hash generation
- **Timer Functions**: Mocked for reliable timing tests

## Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testPathPattern=spaced-repetition
npm test -- --testPathPattern=assessment-quiz-enhanced
npm test -- --testPathPattern=integration

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

## Test Data

All tests use consistent mock data that reflects real-world scenarios:
- **User IDs**: Consistent test user identifiers
- **Module IDs**: Medical education module identifiers
- **Assessment Data**: Realistic quiz questions and answers
- **Progress Data**: Sample completion percentages and scores
- **Peer Data**: Mock user profiles with specializations

## Architecture Compliance

These tests ensure compliance with the architecture document:
- **Data Flow**: Tests follow the documented data flow patterns
- **Component Hierarchy**: Tests verify proper component relationships
- **State Management**: Tests validate React state management patterns
- **Security**: Tests verify RLS policies and user isolation
- **Performance**: Tests validate indexing and optimization strategies

## Continuous Integration

The test suite is designed for CI/CD integration:
- **Fast Execution**: Tests complete in under 30 seconds
- **Deterministic**: No flaky tests or timing dependencies
- **Comprehensive Coverage**: All major features and edge cases covered
- **Clear Reporting**: Detailed test results and coverage reports

## Maintenance

To maintain test quality:
1. **Update Tests**: When adding new features, add corresponding tests
2. **Refactor Tests**: Keep tests DRY and maintainable
3. **Monitor Coverage**: Maintain high test coverage (>80%)
4. **Review Mocks**: Ensure mocks accurately reflect real behavior
5. **Performance**: Monitor test execution time and optimize as needed
