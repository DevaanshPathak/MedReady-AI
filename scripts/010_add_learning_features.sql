-- Add Spaced Repetition, Bookmarks, and Social Features
-- Run this after 001_create_schema.sql

-- Spaced repetition tracking for questions
CREATE TABLE IF NOT EXISTS public.spaced_repetition (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL, -- Hash of question content
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  ease_factor DECIMAL(3,2) DEFAULT 2.5, -- SM-2 algorithm ease factor
  interval_days INTEGER DEFAULT 1, -- Days until next review
  repetitions INTEGER DEFAULT 0, -- Number of successful repetitions
  next_review_date TIMESTAMPTZ DEFAULT NOW(),
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id, module_id)
);

-- Bookmarked questions
CREATE TABLE IF NOT EXISTS public.bookmarked_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL, -- Index in the questions array
  question_hash TEXT NOT NULL, -- Hash of question content for reference
  notes TEXT, -- User notes about the question
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_id, question_index)
);

-- Progress sharing with peers
CREATE TABLE IF NOT EXISTS public.progress_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL means public
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  share_type TEXT NOT NULL DEFAULT 'friends' CHECK (share_type IN ('public', 'friends', 'specific')),
  message TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Peer connections/friendships
CREATE TABLE IF NOT EXISTS public.peer_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  peer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(user_id, peer_id),
  CHECK (user_id != peer_id)
);

-- Quiz sessions for timed mode
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('practice', 'timed', 'spaced_repetition')),
  time_limit_seconds INTEGER, -- For timed mode
  time_spent_seconds INTEGER DEFAULT 0,
  questions_order JSONB NOT NULL, -- Shuffled order of questions
  answers JSONB DEFAULT '{}', -- User answers
  bookmarked_indices INTEGER[] DEFAULT '{}',
  is_completed BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_spaced_repetition_user_next_review ON public.spaced_repetition(user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_spaced_repetition_module ON public.spaced_repetition(module_id);
CREATE INDEX IF NOT EXISTS idx_bookmarked_questions_user ON public.bookmarked_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarked_questions_module ON public.bookmarked_questions(module_id);
CREATE INDEX IF NOT EXISTS idx_progress_shares_user ON public.progress_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_shares_shared_with ON public.progress_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_peer_connections_user ON public.peer_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_peer_connections_peer ON public.peer_connections(peer_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user ON public.quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_assessment ON public.quiz_sessions(assessment_id);

-- Enable RLS
ALTER TABLE public.spaced_repetition ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarked_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for spaced_repetition
CREATE POLICY "Users can view their own spaced repetition data"
  ON public.spaced_repetition FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spaced repetition data"
  ON public.spaced_repetition FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spaced repetition data"
  ON public.spaced_repetition FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for bookmarked_questions
CREATE POLICY "Users can view their own bookmarks"
  ON public.bookmarked_questions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks"
  ON public.bookmarked_questions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookmarks"
  ON public.bookmarked_questions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON public.bookmarked_questions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for progress_shares
CREATE POLICY "Users can view their own shares"
  ON public.progress_shares FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view shares shared with them"
  ON public.progress_shares FOR SELECT
  USING (auth.uid() = shared_with_user_id OR share_type = 'public');

CREATE POLICY "Users can insert their own shares"
  ON public.progress_shares FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shares"
  ON public.progress_shares FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shares"
  ON public.progress_shares FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for peer_connections
CREATE POLICY "Users can view their own connections"
  ON public.peer_connections FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = peer_id);

CREATE POLICY "Users can insert their own connections"
  ON public.peer_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections"
  ON public.peer_connections FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = peer_id);

-- RLS Policies for quiz_sessions
CREATE POLICY "Users can view their own quiz sessions"
  ON public.quiz_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz sessions"
  ON public.quiz_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz sessions"
  ON public.quiz_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to calculate next review date using SM-2 algorithm
CREATE OR REPLACE FUNCTION calculate_next_review(
  quality INTEGER, -- User's response quality (0-5)
  current_ease_factor DECIMAL,
  current_interval INTEGER,
  current_repetitions INTEGER
) RETURNS TABLE (
  new_ease_factor DECIMAL,
  new_interval INTEGER,
  new_repetitions INTEGER
) AS $$
DECLARE
  ef DECIMAL;
  interval_days INTEGER;
  reps INTEGER;
BEGIN
  -- Calculate new ease factor
  ef := current_ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  -- Ensure ease factor stays within bounds
  IF ef < 1.3 THEN
    ef := 1.3;
  END IF;
  
  -- Calculate new interval and repetitions
  IF quality < 3 THEN
    -- Failed - reset
    reps := 0;
    interval_days := 1;
  ELSE
    -- Passed - increase interval
    reps := current_repetitions + 1;
    
    IF reps = 1 THEN
      interval_days := 1;
    ELSIF reps = 2 THEN
      interval_days := 6;
    ELSE
      interval_days := ROUND(current_interval * ef);
    END IF;
  END IF;
  
  RETURN QUERY SELECT ef, interval_days, reps;
END;
$$ LANGUAGE plpgsql;

-- Function to update spaced repetition after review
CREATE OR REPLACE FUNCTION update_spaced_repetition(
  p_user_id UUID,
  p_question_id TEXT,
  p_module_id UUID,
  p_quality INTEGER
) RETURNS VOID AS $$
DECLARE
  current_record RECORD;
  new_values RECORD;
BEGIN
  -- Get current spaced repetition data
  SELECT * INTO current_record
  FROM public.spaced_repetition
  WHERE user_id = p_user_id 
    AND question_id = p_question_id 
    AND module_id = p_module_id;
  
  IF NOT FOUND THEN
    -- Create new record with defaults
    INSERT INTO public.spaced_repetition (
      user_id, question_id, module_id, 
      ease_factor, interval_days, repetitions,
      next_review_date, last_reviewed_at
    ) VALUES (
      p_user_id, p_question_id, p_module_id,
      2.5, 1, 0,
      NOW() + INTERVAL '1 day', NOW()
    );
  ELSE
    -- Calculate new values
    SELECT * INTO new_values FROM calculate_next_review(
      p_quality,
      current_record.ease_factor,
      current_record.interval_days,
      current_record.repetitions
    );
    
    -- Update record
    UPDATE public.spaced_repetition
    SET 
      ease_factor = new_values.new_ease_factor,
      interval_days = new_values.new_interval,
      repetitions = new_values.new_repetitions,
      next_review_date = NOW() + (new_values.new_interval || ' days')::INTERVAL,
      last_reviewed_at = NOW(),
      updated_at = NOW()
    WHERE user_id = p_user_id 
      AND question_id = p_question_id 
      AND module_id = p_module_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
