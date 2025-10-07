# Architecture: Advanced Learning Features

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MedReady AI Platform                          │
│                     Advanced Learning Features                       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
         ┌──────────────┐  ┌───────────────┐  ┌──────────────┐
         │ Spaced Rep   │  │  Timed Quiz   │  │  Bookmarks   │
         │  Algorithm   │  │     Mode      │  │   & Notes    │
         └──────────────┘  └───────────────┘  └──────────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
         ┌──────────────┐  ┌───────────────┐  ┌──────────────┐
         │   Progress   │  │     Peer      │  │   Activity   │
         │   Sharing    │  │ Connections   │  │     Feed     │
         └──────────────┘  └───────────────┘  └──────────────┘
```

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Frontend Components                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │      AssessmentQuizEnhanced Component                    │   │
│  │                                                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │ Mode Selector│  │   Question   │  │  Navigation  │  │   │
│  │  │  Practice    │  │   Display    │  │    Controls  │  │   │
│  │  │  Timed       │  │              │  │              │  │   │
│  │  │  Review      │  └──────────────┘  └──────────────┘  │   │
│  │  └──────────────┘                                       │   │
│  │                                                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │    Timer     │  │   Bookmark   │  │   Progress   │  │   │
│  │  │  Component   │  │    Button    │  │     Bar      │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         ProgressSocial Component                         │   │
│  │                                                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │  Activity    │  │     Peer     │  │    Share     │  │   │
│  │  │    Feed      │  │     List     │  │    Button    │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Client                               │
│                   (lib/supabase/client.ts)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Database Layer                              │
│                    (PostgreSQL + RLS)                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Relationships

```
┌──────────────┐
│   profiles   │
│  (users)     │
└──────┬───────┘
       │
       │ user_id (FK)
       │
       ├─────────────────────────────────────────────────┐
       │                                                  │
       ▼                                                  ▼
┌─────────────────────┐                        ┌──────────────────┐
│  spaced_repetition  │                        │ bookmarked_      │
│                     │                        │   questions      │
│  - user_id          │                        │  - user_id       │
│  - question_id      │                        │  - module_id     │
│  - module_id        │                        │  - question_idx  │
│  - ease_factor      │                        │  - notes         │
│  - interval_days    │                        └──────────────────┘
│  - next_review_date │
└─────────────────────┘
       │
       │ user_id (FK)
       │
       ▼
┌─────────────────────┐
│   quiz_sessions     │
│                     │
│  - user_id          │
│  - assessment_id    │
│  - mode             │
│  - time_spent       │
│  - answers          │
└─────────────────────┘
       │
       │ user_id (FK)
       │
       ├────────────────────────────┐
       │                            │
       ▼                            ▼
┌──────────────────┐      ┌────────────────────┐
│ peer_connections │      │  progress_shares   │
│                  │      │                    │
│  - user_id       │      │  - user_id         │
│  - peer_id       │      │  - module_id       │
│  - status        │      │  - share_type      │
│  - accepted_at   │      │  - message         │
└──────────────────┘      └────────────────────┘
```

---

## Data Flow: Spaced Repetition

```
┌────────────────┐
│  User answers  │
│   question     │
└───────┬────────┘
        │
        ▼
┌────────────────────────────┐
│ Calculate quality score    │
│ (correct/incorrect + ease) │
└───────┬────────────────────┘
        │
        ▼
┌────────────────────────────┐
│ Call: update_spaced_       │
│       repetition()         │
└───────┬────────────────────┘
        │
        ▼
┌────────────────────────────┐
│ PostgreSQL Function        │
│ calculate_next_review()    │
│                            │
│ Inputs:                    │
│  - quality (0-5)           │
│  - current ease_factor     │
│  - current interval        │
│  - current repetitions     │
│                            │
│ Outputs:                   │
│  - new ease_factor         │
│  - new interval (days)     │
│  - new repetitions         │
└───────┬────────────────────┘
        │
        ▼
┌────────────────────────────┐
│ Update spaced_repetition   │
│ table with new values      │
│                            │
│ next_review_date =         │
│  NOW() + interval days     │
└────────────────────────────┘
```

---

## Data Flow: Timed Quiz

```
┌────────────────┐
│  User starts   │
│  timed quiz    │
└───────┬────────┘
        │
        ▼
┌────────────────────────────┐
│ Create quiz_session        │
│ - mode: 'timed'            │
│ - time_limit_seconds       │
│ - started_at: NOW()        │
└───────┬────────────────────┘
        │
        ▼
┌────────────────────────────┐
│ Start countdown timer      │
│ useEffect interval(1s)     │
└───────┬────────────────────┘
        │
        ├──────────────────┐
        │                  │
        ▼                  ▼
┌──────────────┐   ┌──────────────┐
│ User pauses  │   │ Timer hits 0 │
└──────┬───────┘   └──────┬───────┘
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────┐
│ Update       │   │ Auto-submit  │
│ paused_at    │   │ quiz         │
└──────────────┘   └──────────────┘
```

---

## Data Flow: Bookmarking

```
┌────────────────┐
│  User clicks   │
│  bookmark icon │
└───────┬────────┘
        │
        ▼
┌────────────────────────────┐
│ Check if already           │
│ bookmarked?                │
└───────┬────────────────────┘
        │
        ├─────────Yes─────────┐
        │                     │
        No                    ▼
        │            ┌────────────────┐
        ▼            │ Delete from    │
┌────────────────┐   │ bookmarked_    │
│ Generate hash  │   │ questions      │
│ of question    │   └────────────────┘
└───────┬────────┘
        │
        ▼
┌────────────────────────────┐
│ Insert into bookmarked_    │
│ questions table            │
│                            │
│ - user_id                  │
│ - module_id                │
│ - question_index           │
│ - question_hash            │
│ - notes (optional)         │
└────────────────────────────┘
        │
        ▼
┌────────────────────────────┐
│ Update UI state            │
│ Show filled bookmark icon  │
│ Display notes textarea     │
└────────────────────────────┘
```

---

## Data Flow: Progress Sharing

```
┌────────────────┐
│ User completes │
│ quiz/module    │
└───────┬────────┘
        │
        ▼
┌────────────────────────────┐
│ User clicks                │
│ "Share Progress"           │
└───────┬────────────────────┘
        │
        ▼
┌────────────────────────────┐
│ Get current progress       │
│ - completion_percent       │
│ - score                    │
│ - status                   │
└───────┬────────────────────┘
        │
        ▼
┌────────────────────────────┐
│ Insert into                │
│ progress_shares            │
│                            │
│ - user_id                  │
│ - module_id                │
│ - share_type: 'public'     │
│ - message                  │
└───────┬────────────────────┘
        │
        ▼
┌────────────────────────────┐
│ Broadcast to:              │
│ - All users (if public)    │
│ - Connected peers          │
│ - Specific users           │
└────────────────────────────┘
        │
        ▼
┌────────────────────────────┐
│ Appear in Activity Feed    │
│ of relevant users          │
└────────────────────────────┘
```

---

## Data Flow: Peer Connections

```
┌────────────────┐
│  User A enters │
│  User B's email│
└───────┬────────┘
        │
        ▼
┌────────────────────────────┐
│ Look up User B             │
│ in profiles table          │
└───────┬────────────────────┘
        │
        ▼
┌────────────────────────────┐
│ Insert peer_connection     │
│                            │
│ - user_id: User A          │
│ - peer_id: User B          │
│ - status: 'pending'        │
└───────┬────────────────────┘
        │
        ▼
┌────────────────────────────┐
│ User B sees pending        │
│ request in UI              │
└───────┬────────────────────┘
        │
        ▼
┌────────────────────────────┐
│ User B clicks "Accept"     │
└───────┬────────────────────┘
        │
        ▼
┌────────────────────────────┐
│ Update peer_connection     │
│                            │
│ - status: 'accepted'       │
│ - accepted_at: NOW()       │
└───────┬────────────────────┘
        │
        ▼
┌────────────────────────────┐
│ Both users now see each    │
│ other in "Connected Peers" │
│                            │
│ Can now see each other's   │
│ shared progress            │
└────────────────────────────┘
```

---

## Security: Row Level Security (RLS)

```
┌──────────────────────────────────────────────────────────┐
│                  RLS Policy Architecture                  │
└──────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  spaced_repetition                                       │
│                                                          │
│  SELECT: auth.uid() = user_id                           │
│  INSERT: auth.uid() = user_id                           │
│  UPDATE: auth.uid() = user_id                           │
│  DELETE: NOT ALLOWED                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  bookmarked_questions                                    │
│                                                          │
│  SELECT: auth.uid() = user_id                           │
│  INSERT: auth.uid() = user_id                           │
│  UPDATE: auth.uid() = user_id                           │
│  DELETE: auth.uid() = user_id                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  progress_shares                                         │
│                                                          │
│  SELECT: auth.uid() = user_id                           │
│       OR auth.uid() = shared_with_user_id               │
│       OR share_type = 'public'                          │
│  INSERT: auth.uid() = user_id                           │
│  UPDATE: auth.uid() = user_id                           │
│  DELETE: auth.uid() = user_id                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  peer_connections                                        │
│                                                          │
│  SELECT: auth.uid() = user_id OR auth.uid() = peer_id   │
│  INSERT: auth.uid() = user_id                           │
│  UPDATE: auth.uid() = user_id OR auth.uid() = peer_id   │
│  DELETE: auth.uid() = user_id                           │
└─────────────────────────────────────────────────────────┘
```

---

## Performance Optimization

```
┌──────────────────────────────────────────────────────────┐
│                  Database Indexes                         │
└──────────────────────────────────────────────────────────┘

spaced_repetition
├─ idx_spaced_repetition_user_next_review
│  ON (user_id, next_review_date)
└─ idx_spaced_repetition_module
   ON (module_id)

bookmarked_questions
├─ idx_bookmarked_questions_user
│  ON (user_id)
└─ idx_bookmarked_questions_module
   ON (module_id)

progress_shares
├─ idx_progress_shares_user
│  ON (user_id)
├─ idx_progress_shares_shared_with
│  ON (shared_with_user_id)
└─ idx_progress_shares_created
   ON (created_at DESC)

peer_connections
├─ idx_peer_connections_user
│  ON (user_id)
└─ idx_peer_connections_peer
   ON (peer_id)

quiz_sessions
├─ idx_quiz_sessions_user
│  ON (user_id)
└─ idx_quiz_sessions_assessment
   ON (assessment_id)
```

---

## State Management

```
┌──────────────────────────────────────────────────────────┐
│        AssessmentQuizEnhanced State                       │
└──────────────────────────────────────────────────────────┘

useState Hooks:
├─ mode: QuizMode
├─ currentQuestion: number
├─ answers: Record<number, number>
├─ bookmarkedQuestions: Set<number>
├─ questionNotes: Record<number, string>
├─ timeRemaining: number
├─ isPaused: boolean
├─ showResults: boolean
├─ score: number
├─ sessionId: string | null
└─ spacedRepetitionDue: number[]

useEffect Dependencies:
├─ Load bookmarks: [userId, moduleId]
├─ Load spaced repetition: [mode]
├─ Create session: [mode]
└─ Timer: [mode, showResults, isPaused]

┌──────────────────────────────────────────────────────────┐
│           ProgressSocial State                            │
└──────────────────────────────────────────────────────────┘

useState Hooks:
├─ activeTab: 'feed' | 'peers'
├─ progressShares: ProgressShare[]
├─ peerConnections: PeerConnection[]
└─ loading: boolean

useEffect Dependencies:
└─ Load data: [userId]
```

---

## API Integration Points

```
┌──────────────────────────────────────────────────────────┐
│                  External API Calls                       │
└──────────────────────────────────────────────────────────┘

POST /api/generate-certificate
├─ Triggered: After passing quiz
├─ Body: { moduleId }
└─ Response: { certificate }

RPC update_spaced_repetition
├─ Triggered: After answering question
├─ Params: { p_user_id, p_question_id, p_module_id, p_quality }
└─ Response: void

RPC calculate_next_review
├─ Triggered: By update_spaced_repetition
├─ Params: { quality, ease_factor, interval, repetitions }
└─ Response: { new_ease_factor, new_interval, new_repetitions }
```

---

## Component Hierarchy

```
App
└─ ModulePage
   ├─ AssessmentQuizEnhanced
   │  ├─ ModeSelector
   │  │  ├─ PracticeTab
   │  │  ├─ TimedTab
   │  │  └─ SpacedRepetitionTab
   │  ├─ ProgressBar
   │  ├─ Timer (if mode === 'timed')
   │  ├─ QuestionCard
   │  │  ├─ BookmarkButton
   │  │  ├─ QuestionText
   │  │  ├─ RadioOptions
   │  │  └─ NotesTextarea (if bookmarked)
   │  ├─ NavigationControls
   │  │  ├─ PreviousButton
   │  │  ├─ QuestionGrid
   │  │  └─ NextButton / SubmitButton
   │  └─ ResultsView (if showResults)
   │     ├─ ScoreDisplay
   │     ├─ ResultsBreakdown
   │     ├─ ActionButtons
   │     └─ ReviewAnswers
   └─ ProgressSocial
      ├─ TabSelector
      │  ├─ ActivityFeedTab
      │  └─ PeersTab
      ├─ ActivityFeed
      │  └─ ShareCard[]
      │     ├─ UserAvatar
      │     ├─ UserInfo
      │     └─ ShareMessage
      └─ PeersList
         ├─ PendingRequests
         │  └─ PeerCard[]
         ├─ ConnectedPeers
         │  └─ PeerCard[]
         └─ AddPeerForm
```

---

**This architecture supports**:
- ✅ Scalable learning system
- ✅ Real-time collaboration
- ✅ Secure data access
- ✅ Optimal performance
- ✅ Future extensibility
