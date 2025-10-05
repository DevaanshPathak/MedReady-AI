-- MedReady AI - Test Users Creation Script
-- Creates 3 test users: Administrator, Healthcare Worker, and Institution

-- Insert test users into auth.users (Supabase auth table)
-- Note: These are test users with simple passwords for development

-- 1. Administrator Test User
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@medready.test',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Dr. Priya Sharma", "role": "administrator", "specialization": "Healthcare Administration", "location": "Mumbai, Maharashtra"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- 2. Healthcare Worker Test User
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'nurse@medready.test',
  crypt('nurse123', gen_salt('bf')),
  NOW(),
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Rajesh Kumar", "role": "healthcare_worker", "specialization": "Emergency Medicine", "location": "Rural Rajasthan"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- 3. Institution Test User
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'hospital@medready.test',
  crypt('hospital123', gen_salt('bf')),
  NOW(),
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "AIIMS Delhi", "role": "institution", "specialization": "Medical Institution", "location": "New Delhi"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- The profiles will be automatically created by the trigger function handle_new_user()
-- that was set up in script 003_create_profile_trigger.sql

-- Verify the users were created
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.specialization,
  p.location,
  p.created_at
FROM public.profiles p
WHERE p.email IN (
  'admin@medready.test',
  'nurse@medready.test', 
  'hospital@medready.test'
)
ORDER BY p.role;
