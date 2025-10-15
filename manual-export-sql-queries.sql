-- Manual Data Export Queries for Old Database
-- Run these queries in the Supabase SQL Editor for project: gzhccauxdtboxrurwogk
-- Copy the results and save them as separate files

-- 1. Export all profiles data
SELECT * FROM public.profiles;

-- 2. Export all streaks data  
SELECT * FROM public.streaks;

-- 3. Export all user_streaks data
SELECT * FROM public.user_streaks;

-- 4. Export all checkins data
SELECT * FROM public.checkins;

-- 5. Export all comments data
SELECT * FROM public.comments;

-- 6. Export all likes data
SELECT * FROM public.likes;

-- 7. Export RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public';

-- 8. Export table schemas
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 9. Export indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public';

-- 10. Export functions
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public';
