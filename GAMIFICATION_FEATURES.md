# Gamification & Advanced Learning Features Documentation

## Overview
MedReady AI now includes comprehensive gamification, study tracking, and personalized learning features to enhance user engagement and learning outcomes.

---

## 🎯 Features Implemented

### 1. **Study Streaks** 🔥
Track daily learning consistency and build strong study habits.

**Features:**
- Current streak counter (consecutive days)
- Longest streak record
- Total study days tracked
- 30-day activity calendar visualization
- Automatic streak updates on any learning activity

**Database:**
- `study_streaks` table
- `daily_activities` table for historical tracking
- Automatic streak calculation via `update_study_streak()` function

**API Endpoints:**
- `GET /api/streaks` - Fetch current streak data
- `POST /api/streaks` - Update streak (called automatically on activity)

**UI Component:**
- `<StudyStreakCard />` - Displays on dashboard
- Shows current, longest, and total days
- Visual 30-day activity calendar
- Motivational messages based on streak length

---

### 2. **Gamification System** 🏆
Points, levels, ranks, and achievements to motivate continuous learning.

**Features:**
- **Points System:** Earn points for completing activities
- **Levels:** Progress through 50+ levels (Beginner → Intermediate → Advanced → Professional → Expert → Master)
- **Ranks:** Earn prestigious ranks based on level
- **Experience (XP):** Track progress toward next level
- **Achievements/Badges:** 14 default achievements unlockable

**Points Breakdown:**
- Complete assessment: 10-50 points (based on score)
- Perfect score (100%): 25 bonus points
- Module completion: Automatic certificate + achievement points
- 7-day streak: 30 points
- 30-day streak: 100 points
- 100-day streak: 500 points

**Database:**
- `user_gamification` - User stats (points, level, XP, rank)
- `achievements` - Available achievements
- `user_achievements` - Earned achievements
- Functions: `award_points()`, `check_achievements()`

**API Endpoints:**
- `GET /api/gamification` - Fetch user stats and achievements
- `POST /api/gamification` - Award points or check achievements

**UI Component:**
- `<GamificationCard />` - Full stats dashboard
- Tabs: Stats / Achievements
- Progress bar to next level
- Earned and locked achievements display

---

### 3. **Weak Area Identification** 🎯
AI-powered analysis of learning gaps and areas needing improvement.

**Features:**
- Automatic analysis of past assessment performance
- Category and topic-level tracking
- Accuracy percentage calculation
- Priority levels (high/medium/low) based on performance
- Tracks number of attempts per topic

**Algorithm:**
- Analyzes all assessment attempts
- Groups by module category and topic
- Calculates average score per topic
- Flags areas below 80% accuracy
- Prioritizes:
  - **High:** < 50% accuracy
  - **Medium:** 50-70% accuracy
  - **Low:** 70-80% accuracy

**Database:**
- `weak_areas` table
- Function: `analyze_weak_areas()` - SQL-based analysis

**API Endpoints:**
- `GET /api/weak-areas` - Analyze and return weak areas
- `POST /api/weak-areas` - Update specific weak area

**UI Component:**
- `<WeakAreasCard />` - Displays on dashboard
- Top 5 weak areas with priority badges
- Progress bars showing accuracy
- Links to relevant modules

---

### 4. **Personalized Recommendations** 💡
Smart learning path suggestions based on performance and progress.

**Features:**
- 4 types of recommendations:
  1. **Weak Area Focus** - Modules for identified weak areas
  2. **Next Topic** - Suggested new modules based on learning path
  3. **Review** - Modules with low scores that need review
  4. **Spaced Repetition** - Questions due for review

**Recommendation Algorithm:**
- Fetches weak areas (top priority)
- Identifies modules with low completion scores
- Checks spaced repetition due dates
- Suggests beginner/intermediate modules for learning path
- Ranks all recommendations by priority (1-10)
- Returns top 10 personalized suggestions

**Database:**
- `recommendations` table
- Auto-expires after 7 days
- Tracks completion status

**API Endpoints:**
- `GET /api/recommendations` - Generate and fetch recommendations
- `POST /api/recommendations` - Mark recommendation as completed

**UI Component:**
- `<RecommendationsCard />` - Displays on dashboard
- Shows top 5 recommendations
- Type badges (Weak Area, Review, Next Topic, etc.)
- Direct links to modules
- Reasons for each recommendation

---

## 📊 Database Schema

### New Tables

```sql
-- Study streaks and activity
study_streaks (user_id, current_streak, longest_streak, last_activity_date, total_study_days)
daily_activities (user_id, activity_date, activities_completed, time_spent_minutes, points_earned)

-- Weak areas and recommendations
weak_areas (user_id, category, topic, attempts, correct_answers, accuracy_percentage, priority)
recommendations (user_id, recommendation_type, title, description, module_id, priority, reason)

-- Gamification
user_gamification (user_id, total_points, level, experience_points, next_level_points, badges_earned, rank)
achievements (code, name, description, icon, category, points, requirement_type, requirement_value)
user_achievements (user_id, achievement_id, earned_at)
```

### Key Functions

1. **`update_study_streak(p_user_id UUID)`**
   - Updates user's streak based on last activity date
   - Handles streak continuation or reset
   - Updates longest streak record

2. **`analyze_weak_areas(p_user_id UUID)`**
   - Returns weak areas from assessment history
   - Groups by category and topic
   - Calculates accuracy and priority

3. **`award_points(p_user_id UUID, p_points INTEGER, p_reason TEXT)`**
   - Awards points to user
   - Handles level progression
   - Updates rank based on level
   - Returns JSON with level-up status

4. **`check_achievements(p_user_id UUID)`**
   - Checks all achievement requirements
   - Auto-awards earned achievements
   - Triggers point awards for achievements

---

## 🎮 Achievement List

| Achievement | Description | Points | Requirement |
|------------|-------------|--------|-------------|
| 🎯 First Steps | Complete your first module | 10 | 1 module |
| 📚 Knowledge Seeker | Complete 5 modules | 50 | 5 modules |
| 🎓 Master Learner | Complete 10 modules | 100 | 10 modules |
| 💯 Perfect Score | Score 100% on an assessment | 25 | 100% score |
| 🔥 Consistent Learner | 7-day study streak | 30 | 7-day streak |
| ⭐ Dedicated Student | 30-day study streak | 100 | 30-day streak |
| 👑 Unstoppable | 100-day study streak | 500 | 100-day streak |
| ⚡ Speed Demon | Complete timed quiz < 10 min | 20 | Fast completion |
| 📌 Bookworm | Bookmark 10 questions | 15 | 10 bookmarks |
| 🤝 Social Butterfly | Connect with 5 peers | 25 | 5 connections |
| 💬 Helpful Peer | Share progress 10 times | 30 | 10 shares |
| 🌅 Early Bird | Study before 8 AM | 10 | Early study |
| 🦉 Night Owl | Study after 10 PM | 10 | Late study |
| 🏆 Certificate Collector | Earn 3 certificates | 75 | 3 certificates |

---

## 🔄 Integration Points

### Assessment Completion Flow

When a user completes an assessment:

1. **Score Calculation** - Calculate final score
2. **Progress Update** - Mark module as completed (if passed)
3. **Certificate Generation** - Generate certificate (if passed)
4. **Points Award** - Award 10-50 points based on score
5. **Streak Update** - Update daily study streak
6. **Achievement Check** - Check for new achievements
7. **Weak Area Analysis** - Analyze performance for weak areas
8. **Recommendations** - Generate new recommendations

### Dashboard Integration

The dashboard (`app/dashboard/page.tsx`) now includes:

```tsx
<StudyStreakCard />      // Top row left
<GamificationCard />     // Top row right
<WeakAreasCard />        // Middle row left
<RecommendationsCard />  // Middle row right
```

---

## 🎨 UI Components

### StudyStreakCard
- **Location:** `components/study-streak-card.tsx`
- **Props:** None (fetches data internally)
- **Features:**
  - Current/longest/total streak display
  - 30-day activity calendar
  - Motivational messages
  - Fire icon animation for active streaks

### GamificationCard
- **Location:** `components/gamification-card.tsx`
- **Props:** None (fetches data internally)
- **Features:**
  - Two tabs: Stats and Achievements
  - Level progress bar
  - Points, level, rank display
  - Earned and locked achievements
  - Next milestone indicators

### WeakAreasCard
- **Location:** `components/weak-areas-card.tsx`
- **Props:** None (fetches data internally)
- **Features:**
  - Top 5 weak areas
  - Accuracy progress bars
  - Priority badges (high/medium/low)
  - Attempt count display

### RecommendationsCard
- **Location:** `components/recommendations-card.tsx`
- **Props:** None (fetches data internally)
- **Features:**
  - Top 5 personalized recommendations
  - Type badges and icons
  - Reason explanations
  - Direct module links

---

## 🚀 Usage Examples

### Manually Award Points
```typescript
await fetch("/api/gamification", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "award_points",
    points: 50,
    reason: "Completed special challenge",
  }),
})
```

### Check User Achievements
```typescript
await fetch("/api/gamification", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "check_achievements",
  }),
})
```

### Get Weak Areas
```typescript
const response = await fetch("/api/weak-areas")
const { weakAreas, count } = await response.json()
```

### Get Recommendations
```typescript
const response = await fetch("/api/recommendations")
const { recommendations, count } = await response.json()
```

---

## 📈 Analytics & Insights

The system now tracks:
- Daily study habits and consistency
- Performance trends by topic
- Learning gaps and improvement areas
- Engagement metrics (points, levels, achievements)
- Module completion rates
- Assessment scores over time

This data powers:
- Personalized learning paths
- Adaptive recommendations
- Motivation through gamification
- Habit formation through streaks

---

## 🎯 Best Practices

### For Users
1. **Study Daily** - Maintain your streak for consistency
2. **Focus on Weak Areas** - Prioritize high-priority recommendations
3. **Complete Recommendations** - Follow personalized suggestions
4. **Earn Achievements** - Unlock all badges for maximum points
5. **Track Progress** - Monitor level and rank progression

### For Developers
1. **Call Streak API** - Update streak on any learning activity
2. **Award Points** - Give points for meaningful achievements
3. **Run Analysis** - Periodically analyze weak areas
4. **Generate Recommendations** - Refresh recommendations after assessments
5. **Check Achievements** - Trigger achievement checks after major events

---

## 🔧 Migration

To add these features to your database:

```bash
psql -f scripts/011_add_streaks_and_gamification.sql
```

This creates all tables, indexes, RLS policies, and functions.

---

## 📝 Notes

- All features are real-time and update automatically
- RLS policies ensure data privacy
- Gamification is opt-in (users can ignore if preferred)
- Weak area analysis runs on-demand via API
- Recommendations expire after 7 days
- Achievements are checked automatically after point awards

---

## 🎉 Summary

These features transform MedReady AI from a simple learning platform into an **engaging, personalized, and motivating educational experience** that:

✅ Encourages daily learning habits (streaks)
✅ Rewards progress and achievements (gamification)
✅ Identifies knowledge gaps (weak areas)
✅ Guides learning paths (recommendations)
✅ Makes learning fun and competitive (points, levels, badges)

**Result:** Higher engagement, better retention, and improved learning outcomes! 🚀

