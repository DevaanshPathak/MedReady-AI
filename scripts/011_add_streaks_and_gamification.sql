-- Add Study Streaks, Weak Areas, and Gamification Features
-- Run this after 010_add_learning_features.sql

-- Study streaks tracking
CREATE TABLE IF NOT EXISTS public.study_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  total_study_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Daily activity log
CREATE TABLE IF NOT EXISTS public.daily_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  activities_completed INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, activity_date)
);

-- Weak areas identification
CREATE TABLE IF NOT EXISTS public.weak_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  topic TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  accuracy_percentage DECIMAL(5,2),
  last_attempt_at TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category, topic)
);

-- Personalized recommendations
CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('weak_area', 'next_topic', 'review', 'new_skill')),
  title TEXT NOT NULL,
  description TEXT,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 5, -- 1-10 scale
  reason TEXT,
  is_completed BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements and badges
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT,
  points INTEGER DEFAULT 0,
  requirement_type TEXT, -- 'streak', 'modules_completed', 'score', 'time_spent', etc.
  requirement_value INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements (earned badges)
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Gamification points and levels
CREATE TABLE IF NOT EXISTS public.user_gamification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  experience_points INTEGER DEFAULT 0,
  next_level_points INTEGER DEFAULT 100,
  badges_earned INTEGER DEFAULT 0,
  rank TEXT DEFAULT 'Beginner',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_study_streaks_user ON public.study_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_activities_user_date ON public.daily_activities(user_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_weak_areas_user_priority ON public.weak_areas(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_recommendations_user ON public.recommendations(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gamification_user ON public.user_gamification(user_id);

-- Enable RLS
ALTER TABLE public.study_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weak_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own streaks"
  ON public.study_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks"
  ON public.study_streaks FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own activities"
  ON public.daily_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities"
  ON public.daily_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own weak areas"
  ON public.weak_areas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own recommendations"
  ON public.recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations"
  ON public.recommendations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view achievements"
  ON public.achievements FOR SELECT
  USING (true);

CREATE POLICY "Users can view their own earned achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own gamification data"
  ON public.user_gamification FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to create and update their own gamification rows
CREATE POLICY "Users can insert their own gamification"
  ON public.user_gamification FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gamification"
  ON public.user_gamification FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to update study streak
CREATE OR REPLACE FUNCTION update_study_streak(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_last_activity DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Get or create streak record
  INSERT INTO public.study_streaks (user_id, current_streak, longest_streak, last_activity_date, total_study_days)
  VALUES (p_user_id, 0, 0, v_today, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Get current streak data
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last_activity, v_current_streak, v_longest_streak
  FROM public.study_streaks
  WHERE user_id = p_user_id;

  -- If already logged activity today, do nothing
  IF v_last_activity = v_today THEN
    RETURN;
  END IF;

  -- Calculate new streak
  IF v_last_activity = v_today - INTERVAL '1 day' THEN
    -- Continue streak
    v_current_streak := v_current_streak + 1;
  ELSIF v_last_activity < v_today - INTERVAL '1 day' OR v_last_activity IS NULL THEN
    -- Streak broken, start new
    v_current_streak := 1;
  END IF;

  -- Update longest streak if needed
  IF v_current_streak > v_longest_streak THEN
    v_longest_streak := v_current_streak;
  END IF;

  -- Update streak record
  UPDATE public.study_streaks
  SET 
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_activity_date = v_today,
    total_study_days = total_study_days + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Log daily activity
  INSERT INTO public.daily_activities (user_id, activity_date, activities_completed)
  VALUES (p_user_id, v_today, 1)
  ON CONFLICT (user_id, activity_date) 
  DO UPDATE SET activities_completed = daily_activities.activities_completed + 1;
END;
$$ LANGUAGE plpgsql;

-- Function to analyze weak areas
CREATE OR REPLACE FUNCTION analyze_weak_areas(p_user_id UUID)
RETURNS TABLE (
  category TEXT,
  topic TEXT,
  accuracy DECIMAL,
  attempts INTEGER,
  priority TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.category,
    m.title as topic,
    CASE 
      WHEN COUNT(aa.id) = 0 THEN 0
      ELSE ROUND(AVG(aa.score), 2)
    END as accuracy,
    COUNT(aa.id)::INTEGER as attempts,
    CASE 
      WHEN AVG(aa.score) < 50 THEN 'high'::TEXT
      WHEN AVG(aa.score) < 70 THEN 'medium'::TEXT
      ELSE 'low'::TEXT
    END as priority
  FROM public.modules m
  LEFT JOIN public.assessments ast ON ast.module_id = m.id
  LEFT JOIN public.assessment_attempts aa ON aa.assessment_id = ast.id AND aa.user_id = p_user_id
  WHERE aa.id IS NOT NULL
  GROUP BY m.id, m.category, m.title
  HAVING AVG(aa.score) < 80 -- Only show areas below 80%
  ORDER BY accuracy ASC, attempts DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to award points and check level up
CREATE OR REPLACE FUNCTION award_points(
  p_user_id UUID,
  p_points INTEGER,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_total_points INTEGER;
  v_current_level INTEGER;
  v_experience INTEGER;
  v_next_level_points INTEGER;
  v_new_level INTEGER;
  v_leveled_up BOOLEAN := false;
  v_new_rank TEXT;
BEGIN
  -- Initialize gamification record if doesn't exist
  INSERT INTO public.user_gamification (user_id, total_points, level, experience_points, next_level_points)
  VALUES (p_user_id, 0, 1, 0, 100)
  ON CONFLICT (user_id) DO NOTHING;

  -- Get current stats
  SELECT total_points, level, experience_points, next_level_points
  INTO v_total_points, v_current_level, v_experience, v_next_level_points
  FROM public.user_gamification
  WHERE user_id = p_user_id;

  -- Add points
  v_total_points := v_total_points + p_points;
  v_experience := v_experience + p_points;

  -- Check for level up
  WHILE v_experience >= v_next_level_points LOOP
    v_experience := v_experience - v_next_level_points;
    v_current_level := v_current_level + 1;
    v_next_level_points := v_next_level_points + (v_current_level * 50); -- Scaling difficulty
    v_leveled_up := true;
  END LOOP;

  -- Determine rank based on level
  v_new_rank := CASE
    WHEN v_current_level >= 50 THEN 'Master'
    WHEN v_current_level >= 30 THEN 'Expert'
    WHEN v_current_level >= 20 THEN 'Professional'
    WHEN v_current_level >= 10 THEN 'Advanced'
    WHEN v_current_level >= 5 THEN 'Intermediate'
    ELSE 'Beginner'
  END;

  -- Update gamification record
  UPDATE public.user_gamification
  SET 
    total_points = v_total_points,
    level = v_current_level,
    experience_points = v_experience,
    next_level_points = v_next_level_points,
    rank = v_new_rank,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Return result
  RETURN jsonb_build_object(
    'points_awarded', p_points,
    'total_points', v_total_points,
    'level', v_current_level,
    'experience', v_experience,
    'next_level_points', v_next_level_points,
    'leveled_up', v_leveled_up,
    'rank', v_new_rank
  );
END;
$$ LANGUAGE plpgsql;

-- Insert default achievements
INSERT INTO public.achievements (code, name, description, icon, category, points, requirement_type, requirement_value)
VALUES 
  ('first_steps', 'First Steps', 'Complete your first module', '🎯', 'learning', 10, 'modules_completed', 1),
  ('knowledge_seeker', 'Knowledge Seeker', 'Complete 5 modules', '📚', 'learning', 50, 'modules_completed', 5),
  ('master_learner', 'Master Learner', 'Complete 10 modules', '🎓', 'learning', 100, 'modules_completed', 10),
  ('perfect_score', 'Perfect Score', 'Score 100% on an assessment', '💯', 'achievement', 25, 'score', 100),
  ('consistent_learner', 'Consistent Learner', '7-day study streak', '🔥', 'streak', 30, 'streak', 7),
  ('dedicated_student', 'Dedicated Student', '30-day study streak', '⭐', 'streak', 100, 'streak', 30),
  ('unstoppable', 'Unstoppable', '100-day study streak', '👑', 'streak', 500, 'streak', 100),
  ('speed_demon', 'Speed Demon', 'Complete a timed quiz in under 10 minutes', '⚡', 'achievement', 20, 'time_spent', 600),
  ('bookworm', 'Bookworm', 'Bookmark 10 questions', '📌', 'engagement', 15, 'bookmarks', 10),
  ('social_butterfly', 'Social Butterfly', 'Connect with 5 peers', '🤝', 'social', 25, 'peer_connections', 5),
  ('helpful_peer', 'Helpful Peer', 'Share progress 10 times', '💬', 'social', 30, 'progress_shares', 10),
  ('early_bird', 'Early Bird', 'Study before 8 AM', '🌅', 'engagement', 10, 'early_study', 1),
  ('night_owl', 'Night Owl', 'Study after 10 PM', '🦉', 'engagement', 10, 'late_study', 1),
  ('certificate_collector', 'Certificate Collector', 'Earn 3 certificates', '🏆', 'achievement', 75, 'certificates', 3)
ON CONFLICT (code) DO NOTHING;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_achievements(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_achievement RECORD;
  v_count INTEGER;
BEGIN
  -- Check each achievement
  FOR v_achievement IN 
    SELECT * FROM public.achievements 
    WHERE id NOT IN (
      SELECT achievement_id FROM public.user_achievements WHERE user_id = p_user_id
    )
  LOOP
    v_count := 0;
    
    -- Check requirement based on type
    CASE v_achievement.requirement_type
      WHEN 'modules_completed' THEN
        SELECT COUNT(DISTINCT module_id) INTO v_count
        FROM public.progress
        WHERE user_id = p_user_id AND status = 'completed';
        
      WHEN 'streak' THEN
        SELECT COALESCE(current_streak, 0) INTO v_count
        FROM public.study_streaks
        WHERE user_id = p_user_id;
        
      WHEN 'score' THEN
        SELECT COUNT(*) INTO v_count
        FROM public.assessment_attempts
        WHERE user_id = p_user_id AND score >= v_achievement.requirement_value;
        
      WHEN 'bookmarks' THEN
        SELECT COUNT(*) INTO v_count
        FROM public.bookmarked_questions
        WHERE user_id = p_user_id;
        
      WHEN 'peer_connections' THEN
        SELECT COUNT(*) INTO v_count
        FROM public.peer_connections
        WHERE user_id = p_user_id AND status = 'accepted';
        
      WHEN 'progress_shares' THEN
        SELECT COUNT(*) INTO v_count
        FROM public.progress_shares
        WHERE user_id = p_user_id;
        
      WHEN 'certificates' THEN
        SELECT COUNT(*) INTO v_count
        FROM public.certifications
        WHERE user_id = p_user_id;
        
      ELSE
        CONTINUE;
    END CASE;
    
    -- Award achievement if requirement met
    IF v_count >= v_achievement.requirement_value THEN
      INSERT INTO public.user_achievements (user_id, achievement_id)
      VALUES (p_user_id, v_achievement.id)
      ON CONFLICT DO NOTHING;
      
      -- Award points
      PERFORM award_points(p_user_id, v_achievement.points, 'Achievement: ' || v_achievement.name);
      
      -- Update badge count
      UPDATE public.user_gamification
      SET badges_earned = badges_earned + 1
      WHERE user_id = p_user_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

