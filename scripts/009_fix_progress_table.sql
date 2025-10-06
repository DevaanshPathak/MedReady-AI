-- Fix progress table to include current_section field
-- Add missing current_section field to progress table
ALTER TABLE public.progress 
ADD COLUMN IF NOT EXISTS current_section INTEGER DEFAULT 0;

-- Add missing time_taken field to assessment_attempts table
ALTER TABLE public.assessment_attempts 
ADD COLUMN IF NOT EXISTS time_taken INTEGER;

-- Update the assessment generation API to use correct field names
-- The API is using time_limit but the table has time_limit_minutes
-- Let's make sure the field names match

-- Add RLS policy for module_content_cache insert/update
CREATE POLICY "Users can insert cached module content"
  ON module_content_cache FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update cached module content"
  ON module_content_cache FOR UPDATE
  TO authenticated
  USING (true);

-- Add RLS policy for assessments insert/update (for AI generation)
CREATE POLICY "Anyone can insert assessments"
  ON public.assessments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update assessments"
  ON public.assessments FOR UPDATE
  TO authenticated
  USING (true);
