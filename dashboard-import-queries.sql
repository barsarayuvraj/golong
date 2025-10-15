-- Dashboard SQL Editor Import Queries
-- Run these in the NEW database SQL editor after copying data from old database

-- ========================================
-- IMPORT INSTRUCTIONS:
-- ========================================
-- 1. Copy the results from each export query in the old database
-- 2. Paste the data into the corresponding INSERT statements below
-- 3. Run each INSERT statement in the new database SQL editor
-- 4. Verify the data was imported correctly

-- ========================================
-- 1. IMPORT PROFILES DATA
-- ========================================
-- Replace the VALUES with your exported profiles data
INSERT INTO public.profiles (id, username, full_name, avatar_url, bio, website, location, created_at, updated_at)
VALUES 
  -- Paste your exported profiles data here
  -- Example: ('uuid-here', 'username', 'Full Name', 'avatar-url', 'bio', 'website', 'location', '2024-01-01', '2024-01-01'),
  -- Add more rows as needed
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  website = EXCLUDED.website,
  location = EXCLUDED.location,
  updated_at = EXCLUDED.updated_at;

-- ========================================
-- 2. IMPORT STREAKS DATA
-- ========================================
INSERT INTO public.streaks (id, title, description, category, is_public, tags, created_by, created_at, updated_at)
VALUES 
  -- Paste your exported streaks data here
  -- Example: ('uuid-here', 'Streak Title', 'Description', 'category', true, ARRAY['tag1', 'tag2'], 'user-uuid', '2024-01-01', '2024-01-01'),
  -- Add more rows as needed
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_public = EXCLUDED.is_public,
  tags = EXCLUDED.tags,
  updated_at = EXCLUDED.updated_at;

-- ========================================
-- 3. IMPORT USER_STREAKS DATA
-- ========================================
INSERT INTO public.user_streaks (id, user_id, streak_id, current_streak_days, longest_streak_days, is_active, joined_at, last_checkin_at, created_at, updated_at)
VALUES 
  -- Paste your exported user_streaks data here
  -- Example: ('uuid-here', 'user-uuid', 'streak-uuid', 5, 10, true, '2024-01-01', '2024-01-01', '2024-01-01', '2024-01-01'),
  -- Add more rows as needed
ON CONFLICT (id) DO UPDATE SET
  current_streak_days = EXCLUDED.current_streak_days,
  longest_streak_days = EXCLUDED.longest_streak_days,
  is_active = EXCLUDED.is_active,
  last_checkin_at = EXCLUDED.last_checkin_at,
  updated_at = EXCLUDED.updated_at;

-- ========================================
-- 4. IMPORT CHECKINS DATA
-- ========================================
INSERT INTO public.checkins (id, user_streak_id, notes, mood, created_at, updated_at)
VALUES 
  -- Paste your exported checkins data here
  -- Example: ('uuid-here', 'user-streak-uuid', 'Checkin notes', 'happy', '2024-01-01', '2024-01-01'),
  -- Add more rows as needed
ON CONFLICT (id) DO UPDATE SET
  notes = EXCLUDED.notes,
  mood = EXCLUDED.mood,
  updated_at = EXCLUDED.updated_at;

-- ========================================
-- 5. IMPORT COMMENTS DATA
-- ========================================
INSERT INTO public.comments (id, user_id, streak_id, content, created_at, updated_at)
VALUES 
  -- Paste your exported comments data here
  -- Example: ('uuid-here', 'user-uuid', 'streak-uuid', 'Comment content', '2024-01-01', '2024-01-01'),
  -- Add more rows as needed
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = EXCLUDED.updated_at;

-- ========================================
-- 6. IMPORT LIKES DATA
-- ========================================
INSERT INTO public.likes (id, user_id, streak_id, created_at)
VALUES 
  -- Paste your exported likes data here
  -- Example: ('uuid-here', 'user-uuid', 'streak-uuid', '2024-01-01'),
  -- Add more rows as needed
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 7. VERIFY IMPORT (run after importing all data)
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
