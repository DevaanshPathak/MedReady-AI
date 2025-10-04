-- MedReady AI Database Schema
-- This schema should be executed in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL,
  explanation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Policies for questions
CREATE POLICY "Users can view their own questions" 
  ON public.questions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own questions" 
  ON public.questions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- User answers table
CREATE TABLE IF NOT EXISTS public.user_answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_answer INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_taken INTEGER, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

-- Policies for user_answers
CREATE POLICY "Users can view their own answers" 
  ON public.user_answers FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own answers" 
  ON public.user_answers FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Quiz sessions table
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER DEFAULT 0,
  score DECIMAL(5,2),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_taken INTEGER -- in seconds
);

-- Enable Row Level Security
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for quiz_sessions
CREATE POLICY "Users can view their own quiz sessions" 
  ON public.quiz_sessions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz sessions" 
  ON public.quiz_sessions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz sessions" 
  ON public.quiz_sessions FOR UPDATE 
  USING (auth.uid() = user_id);

-- User progress/statistics table
CREATE TABLE IF NOT EXISTS public.user_progress (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  accuracy DECIMAL(5,2) DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_time_spent INTEGER DEFAULT 0, -- in seconds
  weak_topics JSONB DEFAULT '[]'::jsonb,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Policies for user_progress
CREATE POLICY "Users can view their own progress" 
  ON public.user_progress FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" 
  ON public.user_progress FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
  ON public.user_progress FOR UPDATE 
  USING (auth.uid() = user_id);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  
  INSERT INTO public.user_progress (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update accuracy and streak
CREATE OR REPLACE FUNCTION update_user_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_progress
  SET 
    total_questions = total_questions + 1,
    correct_answers = correct_answers + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    accuracy = ROUND(((correct_answers + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END)::DECIMAL / (total_questions + 1)::DECIMAL) * 100, 2),
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update progress when answer is submitted
DROP TRIGGER IF EXISTS on_answer_submitted ON public.user_answers;
CREATE TRIGGER on_answer_submitted
  AFTER INSERT ON public.user_answers
  FOR EACH ROW EXECUTE FUNCTION update_user_progress();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_user_id ON public.questions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions(topic);
CREATE INDEX IF NOT EXISTS idx_user_answers_user_id ON public.user_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON public.quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
