# Advanced Learning Features Documentation

## Overview
MedReady AI now includes advanced learning features designed to enhance retention, engagement, and collaborative learning:

1. **Spaced Repetition Algorithm** - Optimized review scheduling based on SM-2 algorithm
2. **Timed Quiz Mode** - Practice under time pressure with countdown timer
3. **Bookmarking Questions** - Save and annotate difficult questions
4. **Progress Sharing with Peers** - Social learning and peer connections

---

## 1. Spaced Repetition System

### How It Works
Based on the **SM-2 (SuperMemo 2) Algorithm**, the system schedules question reviews based on:
- **Ease Factor**: How easy the question is for you (1.3-2.5+)
- **Interval**: Days until next review (1, 6, then exponentially increasing)
- **Repetitions**: Number of successful reviews

### Quality Ratings
When you answer a question, the system assigns a quality score:
- **5**: Perfect recall
- **4**: Correct with hesitation
- **3**: Correct with difficulty
- **2**: Incorrect but remembered
- **1**: Incorrect, barely recalled
- **0**: Complete blank

### Database Schema

```sql
CREATE TABLE spaced_repetition (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  question_id TEXT, -- Hash of question content
  module_id UUID REFERENCES modules(id),
  ease_factor DECIMAL(3,2) DEFAULT 2.5,
  interval_days INTEGER DEFAULT 1,
  repetitions INTEGER DEFAULT 0,
  next_review_date TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ
);
```

### Usage in Component

```tsx
import { AssessmentQuizEnhanced } from "@/components/assessment-quiz-enhanced"

<AssessmentQuizEnhanced
  assessment={assessment}
  userId={userId}
  moduleId={moduleId}
/>
```

The component automatically:
- Tracks question difficulty per user
- Calculates optimal review dates
- Shows "Due for review" badges on questions
- Updates ease factors based on performance

### Algorithm Implementation

```sql
-- Calculate next review using SM-2
CREATE FUNCTION calculate_next_review(
  quality INTEGER,           -- 0-5 rating
  current_ease_factor DECIMAL,
  current_interval INTEGER,
  current_repetitions INTEGER
) RETURNS (new_ease_factor, new_interval, new_repetitions)
```

**Formula**:
- New EF = Old EF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
- If quality < 3: Reset to interval 1, repetitions 0
- If quality >= 3:
  - Repetition 1: Interval 1 day
  - Repetition 2: Interval 6 days
  - Repetition 3+: Interval = Old Interval × Ease Factor

### API Endpoint

```typescript
// Update spaced repetition after answering question
await supabase.rpc("update_spaced_repetition", {
  p_user_id: userId,
  p_question_id: questionHash,
  p_module_id: moduleId,
  p_quality: 4, // User's quality rating (0-5)
})
```

---

## 2. Timed Quiz Mode

### Features
- ⏱️ Countdown timer with visual indicator
- ⏸️ Pause/resume functionality
- ⚠️ Warning when time is running low (<1 minute)
- 📊 Time tracking for performance analysis

### Timer Display
```tsx
{mode === "timed" && (
  <div className="flex items-center gap-2">
    {timeRemaining < 60 && (
      <Badge variant="destructive" className="animate-pulse">
        Hurry!
      </Badge>
    )}
    <div className="text-2xl font-mono font-bold">
      <Clock className="h-5 w-5" />
      {formatTime(timeRemaining)}
    </div>
    <Button onClick={() => setIsPaused(!isPaused)}>
      {isPaused ? <Play /> : <Pause />}
    </Button>
  </div>
)}
```

### Database Schema

```sql
CREATE TABLE quiz_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  assessment_id UUID REFERENCES assessments(id),
  mode TEXT CHECK (mode IN ('practice', 'timed', 'spaced_repetition')),
  time_limit_seconds INTEGER,
  time_spent_seconds INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ
);
```

### Auto-Submit on Timeout
When time runs out, the quiz automatically submits:

```typescript
useEffect(() => {
  if (mode !== "timed" || showResults || isPaused) return

  const timer = setInterval(() => {
    setTimeRemaining((prev) => {
      if (prev <= 1) {
        handleSubmit() // Auto-submit when time expires
        return 0
      }
      return prev - 1
    })
  }, 1000)

  return () => clearInterval(timer)
}, [mode, showResults, isPaused])
```

---

## 3. Bookmarking Questions

### Features
- 📌 Bookmark difficult questions for later review
- 📝 Add personal notes to bookmarked questions
- 🔍 Quick navigation to bookmarked questions
- 💾 Persistent storage across sessions

### Database Schema

```sql
CREATE TABLE bookmarked_questions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  module_id UUID REFERENCES modules(id),
  assessment_id UUID REFERENCES assessments(id),
  question_index INTEGER,
  question_hash TEXT, -- For deduplication
  notes TEXT, -- User's personal notes
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, module_id, question_index)
);
```

### Usage in Component

```tsx
// Toggle bookmark
const toggleBookmark = async (questionIndex: number) => {
  const isBookmarked = bookmarkedQuestions.has(questionIndex)
  
  if (isBookmarked) {
    await supabase
      .from("bookmarked_questions")
      .delete()
      .eq("user_id", userId)
      .eq("module_id", moduleId)
      .eq("question_index", questionIndex)
  } else {
    await supabase.from("bookmarked_questions").insert({
      user_id: userId,
      module_id: moduleId,
      question_index: questionIndex,
      question_hash: generateQuestionHash(question),
    })
  }
}

// Save notes
const saveQuestionNote = async (questionIndex: number, note: string) => {
  await supabase
    .from("bookmarked_questions")
    .update({ notes: note })
    .eq("user_id", userId)
    .eq("question_index", questionIndex)
}
```

### UI Components

**Bookmark Button**:
```tsx
<Button
  variant={bookmarkedQuestions.has(currentQuestion) ? "default" : "outline"}
  onClick={() => toggleBookmark(currentQuestion)}
>
  {bookmarkedQuestions.has(currentQuestion) ? (
    <BookmarkCheck className="h-4 w-4" />
  ) : (
    <Bookmark className="h-4 w-4" />
  )}
</Button>
```

**Notes Textarea** (appears when question is bookmarked):
```tsx
{bookmarkedQuestions.has(currentQuestion) && (
  <Textarea
    placeholder="Add notes about this question..."
    value={questionNotes[currentQuestion] || ""}
    onChange={(e) => saveQuestionNote(currentQuestion, e.target.value)}
  />
)}
```

**Bookmarked Questions Summary**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Bookmarked Questions</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="flex flex-wrap gap-2">
      {Array.from(bookmarkedQuestions).map((index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => setCurrentQuestion(index)}
        >
          <BookmarkCheck className="h-3 w-3 mr-1" />
          Question {index + 1}
        </Button>
      ))}
    </div>
  </CardContent>
</Card>
```

### Question Hashing
Questions are hashed to handle content changes:

```typescript
const generateQuestionHash = (question: Question): string => {
  const content = `${question.question}|${question.options.join("|")}`
  return crypto.createHash("sha256").update(content).digest("hex").substring(0, 16)
}
```

---

## 4. Progress Sharing with Peers

### Features
- 🤝 Connect with other healthcare workers
- 📢 Share learning achievements
- 👥 View peer activity feed
- 🎯 Collaborative learning community

### Database Schema

```sql
-- Peer connections
CREATE TABLE peer_connections (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  peer_id UUID REFERENCES profiles(id),
  status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  UNIQUE(user_id, peer_id)
);

-- Progress shares
CREATE TABLE progress_shares (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  shared_with_user_id UUID REFERENCES profiles(id), -- NULL = public
  module_id UUID REFERENCES modules(id),
  share_type TEXT CHECK (share_type IN ('public', 'friends', 'specific')),
  message TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ
);
```

### Component Usage

```tsx
import { ProgressSocial } from "@/components/progress-social"

<ProgressSocial userId={userId} moduleId={moduleId} />
```

### Key Functions

**Send Peer Request**:
```typescript
const sendPeerRequest = async (peerEmail: string) => {
  // Find peer by email
  const { data: peerData } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", peerEmail)
    .single()

  // Create connection request
  await supabase.from("peer_connections").insert({
    user_id: userId,
    peer_id: peerData.id,
    status: "pending",
  })
}
```

**Accept Peer Request**:
```typescript
const acceptPeerRequest = async (connectionId: string) => {
  await supabase
    .from("peer_connections")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", connectionId)
}
```

**Share Progress**:
```typescript
const shareProgress = async () => {
  await supabase.from("progress_shares").insert({
    user_id: userId,
    module_id: moduleId,
    share_type: "public",
    message: `Completed quiz with ${score}% score!`,
  })
}
```

### Activity Feed
Shows recent achievements from:
- ✅ Public shares (all users)
- ✅ Connected peers only
- ✅ Specific shares (direct shares)

```typescript
const loadProgressShares = async () => {
  // Get accepted peer IDs
  const { data: connections } = await supabase
    .from("peer_connections")
    .select("peer_id")
    .eq("user_id", userId)
    .eq("status", "accepted")

  const peerIds = connections?.map((c) => c.peer_id) || []

  // Load public shares and peer shares
  const { data } = await supabase
    .from("progress_shares")
    .select(`
      *,
      profile:profiles!user_id(*),
      module:modules(*)
    `)
    .eq("is_active", true)
    .or(`share_type.eq.public,user_id.in.(${peerIds.join(",")})`)
    .order("created_at", { ascending: false })
    .limit(50)
}
```

---

## Integration Guide

### 1. Run Database Migration

```bash
# Execute in Supabase SQL editor
psql -f scripts/010_add_learning_features.sql
```

### 2. Update Module Page

```tsx
// app/learn/[moduleId]/page.tsx
import { AssessmentQuizEnhanced } from "@/components/assessment-quiz-enhanced"
import { ProgressSocial } from "@/components/progress-social"

export default function ModulePage({ params }: { params: { moduleId: string } }) {
  return (
    <div className="space-y-8">
      {/* Quiz with all features */}
      <AssessmentQuizEnhanced
        assessment={assessment}
        userId={userId}
        moduleId={params.moduleId}
      />
      
      {/* Social features */}
      <ProgressSocial
        userId={userId}
        moduleId={params.moduleId}
      />
    </div>
  )
}
```

### 3. Add Dashboard Widget

```tsx
// Show due reviews on dashboard
const { data: dueReviews } = await supabase
  .from("spaced_repetition")
  .select("*")
  .eq("user_id", userId)
  .lte("next_review_date", new Date().toISOString())
  .order("next_review_date", { ascending: true })
  .limit(10)

<Card>
  <CardHeader>
    <CardTitle>Due for Review</CardTitle>
    <CardDescription>{dueReviews.length} questions need review</CardDescription>
  </CardHeader>
  <CardContent>
    {dueReviews.map((review) => (
      <Link href={`/learn/${review.module_id}?mode=spaced_repetition`}>
        Review questions
      </Link>
    ))}
  </CardContent>
</Card>
```

---

## Best Practices

### Spaced Repetition
- ✅ Review questions as soon as they're due
- ✅ Be honest with quality ratings (don't overestimate)
- ✅ Focus on questions with low ease factors
- ✅ Consistent daily reviews are better than cramming

### Timed Quizzes
- ✅ Use for exam preparation
- ✅ Simulate real test conditions
- ✅ Practice time management
- ✅ Review mistakes after completion

### Bookmarking
- ✅ Bookmark questions you get wrong
- ✅ Add detailed notes explaining why
- ✅ Review bookmarked questions weekly
- ✅ Remove bookmarks once mastered

### Social Learning
- ✅ Connect with peers in your specialization
- ✅ Share achievements to motivate others
- ✅ Learn from peer progress
- ✅ Create study groups

---

## Performance Considerations

### Indexes
All tables have appropriate indexes for common queries:

```sql
-- Spaced repetition lookup
CREATE INDEX idx_spaced_repetition_user_next_review 
  ON spaced_repetition(user_id, next_review_date);

-- Bookmarks by user
CREATE INDEX idx_bookmarked_questions_user 
  ON bookmarked_questions(user_id);

-- Progress shares feed
CREATE INDEX idx_progress_shares_created 
  ON progress_shares(created_at DESC);

-- Peer connections
CREATE INDEX idx_peer_connections_user 
  ON peer_connections(user_id, status);
```

### Caching
Consider caching frequently accessed data:
- User's bookmarked questions
- Connected peers list
- Due review counts

### Batch Operations
When updating multiple spaced repetition records:

```typescript
// Use PostgreSQL function for batch updates
await Promise.all(
  questionResults.map(({ index, quality }) =>
    supabase.rpc("update_spaced_repetition", {
      p_user_id: userId,
      p_question_id: generateQuestionHash(questions[index]),
      p_module_id: moduleId,
      p_quality: quality,
    })
  )
)
```

---

## Testing

### Unit Tests
```typescript
// __tests__/components/assessment-quiz-enhanced.test.tsx
describe("AssessmentQuizEnhanced", () => {
  it("calculates spaced repetition correctly", () => {
    // Test SM-2 algorithm
  })
  
  it("toggles bookmarks", () => {
    // Test bookmark functionality
  })
  
  it("handles timed mode countdown", () => {
    // Test timer
  })
  
  it("shares progress", () => {
    // Test sharing
  })
})
```

### Integration Tests
```sql
-- Test spaced repetition function
SELECT * FROM calculate_next_review(4, 2.5, 6, 2);
-- Should return increased interval

SELECT * FROM calculate_next_review(1, 2.5, 6, 2);
-- Should reset to interval 1
```

---

## Future Enhancements

### Planned Features
1. **Adaptive Difficulty** - Adjust question difficulty based on performance
2. **Study Streaks** - Track consecutive days of practice
3. **Leaderboards** - Friendly competition among peers
4. **Study Groups** - Collaborative quiz sessions
5. **AI-Powered Insights** - Personalized study recommendations
6. **Gamification** - Badges, achievements, and rewards

### API Endpoints to Add
- `/api/spaced-repetition/due` - Get due reviews
- `/api/peers/suggest` - Suggest peers to connect with
- `/api/analytics/learning-insights` - Personal analytics

---

## Troubleshooting

### Spaced Repetition Not Updating
- Check if `update_spaced_repetition` function exists
- Verify user permissions on `spaced_repetition` table
- Ensure question hash is generated correctly

### Timer Not Working
- Check if `mode` is set to "timed"
- Verify `time_limit_minutes` in assessment
- Check browser console for errors

### Bookmarks Not Saving
- Verify unique constraint isn't violated
- Check RLS policies on `bookmarked_questions`
- Ensure `question_index` is correct

### Progress Not Sharing
- Verify peer connections are accepted
- Check `share_type` setting (public/friends/specific)
- Ensure RLS policies allow viewing

---

## Support

For issues or questions:
1. Check Supabase logs for errors
2. Review RLS policies in Supabase dashboard
3. Verify all migrations have been run
4. Check browser console for client-side errors

**Database Migrations**:
- `scripts/010_add_learning_features.sql` - Main migration

**Components**:
- `components/assessment-quiz-enhanced.tsx` - Enhanced quiz component
- `components/progress-social.tsx` - Social features component

**Types**:
- `lib/types.ts` - Updated TypeScript interfaces
