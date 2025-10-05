-- Add table for caching AI-generated module content
CREATE TABLE IF NOT EXISTS module_content_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add table for emergency consultations
CREATE TABLE IF NOT EXISTS emergency_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symptoms TEXT NOT NULL,
  severity TEXT NOT NULL,
  patient_age INTEGER,
  patient_gender TEXT,
  vital_signs JSONB,
  ai_guidance TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_module_content_cache_module ON module_content_cache(module_id);
CREATE INDEX idx_emergency_consultations_user ON emergency_consultations(user_id);
CREATE INDEX idx_emergency_consultations_created ON emergency_consultations(created_at DESC);

-- Enable RLS
ALTER TABLE module_content_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_consultations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view cached module content"
  ON module_content_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view their own emergency consultations"
  ON emergency_consultations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emergency consultations"
  ON emergency_consultations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
