-- Dashboard SQL Editor Export Queries
-- Run these in the OLD database SQL editor, then copy results to import into NEW database

-- ========================================
-- 1. EXPORT PROFILES DATA
-- ========================================
SELECT 
  id,
  username,
  full_name,
  avatar_url,
  bio,
  website,
  location,
  created_at,
  updated_at
FROM public.profiles
ORDER BY created_at;

-- ========================================
-- 2. EXPORT STREAKS DATA  
-- ========================================
SELECT 
  id,
  title,
  description,
  category,
  is_public,
  tags,
  created_by,
  created_at,
  updated_at
FROM public.streaks
ORDER BY created_at;

-- ========================================
-- 3. EXPORT USER_STREAKS DATA
-- ========================================
SELECT 
  id,
  user_id,
  streak_id,
  current_streak_days,
  longest_streak_days,
  is_active,
  joined_at,
  last_checkin_at,
  created_at,
  updated_at
FROM public.user_streaks
ORDER BY joined_at;

-- ========================================
-- 4. EXPORT CHECKINS DATA
-- ========================================
SELECT 
  id,
  user_streak_id,
  notes,
  mood,
  created_at,
  updated_at
FROM public.checkins
ORDER BY created_at;

-- ========================================
-- 5. EXPORT COMMENTS DATA
-- ========================================
SELECT 
  id,
  user_id,
  streak_id,
  content,
  created_at,
  updated_at
FROM public.comments
ORDER BY created_at;

-- ========================================
-- 6. EXPORT LIKES DATA
-- ========================================
SELECT 
  id,
  user_id,
  streak_id,
  created_at
FROM public.likes
ORDER BY created_at;

-- ========================================
-- 7. EXPORT RLS POLICIES (for reference)
-- ========================================
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
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ========================================
-- 8. COUNT RECORDS (to verify export)
-- ========================================
SELECT 
  'profiles' as table_name, COUNT(*) as record_count FROM public.profiles
UNION ALL
SELECT 
  'streaks' as table_name, COUNT(*) as record_count FROM public.streaks
UNION ALL
SELECT 
  'user_streaks' as table_name, COUNT(*) as record_count FROM public.user_streaks
UNION ALL
SELECT 
  'checkins' as table_name, COUNT(*) as record_count FROM public.checkins
UNION ALL
SELECT 
  'comments' as table_name, COUNT(*) as record_count FROM public.comments
UNION ALL
SELECT 
  'likes' as table_name, COUNT(*) as record_count FROM public.likes
ORDER BY table_name;
