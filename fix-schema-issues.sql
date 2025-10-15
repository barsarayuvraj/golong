-- Fix schema issues in target database

-- Add missing columns to streaks table
ALTER TABLE public.streaks 
ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_member_left_at TIMESTAMPTZ;

-- Drop foreign key constraints temporarily to allow data insertion
-- We'll recreate them after migration

-- Drop foreign key constraints from profiles table
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Drop foreign key constraints from challenges table  
ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_created_by_fkey;

-- Drop foreign key constraints from groups table
ALTER TABLE public.groups DROP CONSTRAINT IF EXISTS groups_created_by_fkey;

-- Drop foreign key constraints from user_streaks table
ALTER TABLE public.user_streaks DROP CONSTRAINT IF EXISTS user_streaks_user_id_fkey;
ALTER TABLE public.user_streaks DROP CONSTRAINT IF EXISTS user_streaks_streak_id_fkey;

-- Drop foreign key constraints from checkins table
ALTER TABLE public.checkins DROP CONSTRAINT IF EXISTS checkins_user_streak_id_fkey;

-- Drop foreign key constraints from comments table
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_streak_id_fkey;
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;

-- Drop foreign key constraints from likes table
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_streak_id_fkey;
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_user_id_fkey;

-- Drop foreign key constraints from user_achievements table
ALTER TABLE public.user_achievements DROP CONSTRAINT IF EXISTS user_achievements_user_id_fkey;
ALTER TABLE public.user_achievements DROP CONSTRAINT IF EXISTS user_achievements_achievement_id_fkey;

-- Drop foreign key constraints from challenge_participants table
ALTER TABLE public.challenge_participants DROP CONSTRAINT IF EXISTS challenge_participants_challenge_id_fkey;
ALTER TABLE public.challenge_participants DROP CONSTRAINT IF EXISTS challenge_participants_user_id_fkey;

-- Drop foreign key constraints from group_members table
ALTER TABLE public.group_members DROP CONSTRAINT IF EXISTS group_members_group_id_fkey;
ALTER TABLE public.group_members DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;

-- Drop foreign key constraints from follows table
ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS follows_follower_id_fkey;
ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS follows_following_id_fkey;

-- Drop foreign key constraints from follow_requests table
ALTER TABLE public.follow_requests DROP CONSTRAINT IF EXISTS follow_requests_requester_id_fkey;
ALTER TABLE public.follow_requests DROP CONSTRAINT IF EXISTS follow_requests_target_id_fkey;

-- Drop foreign key constraints from notifications table
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- Drop foreign key constraints from notes table
ALTER TABLE public.notes DROP CONSTRAINT IF EXISTS notes_streak_id_fkey;
ALTER TABLE public.notes DROP CONSTRAINT IF EXISTS notes_user_id_fkey;

-- Drop foreign key constraints from reminders table
ALTER TABLE public.reminders DROP CONSTRAINT IF EXISTS reminders_user_id_fkey;
ALTER TABLE public.reminders DROP CONSTRAINT IF EXISTS reminders_streak_id_fkey;

-- Drop foreign key constraints from reports table
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_reporter_id_fkey;
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_reported_user_id_fkey;
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_reported_streak_id_fkey;

-- Drop foreign key constraints from activity_log table
ALTER TABLE public.activity_log DROP CONSTRAINT IF EXISTS activity_log_streak_id_fkey;
ALTER TABLE public.activity_log DROP CONSTRAINT IF EXISTS activity_log_user_id_fkey;

-- Drop foreign key constraints from export_jobs table
ALTER TABLE public.export_jobs DROP CONSTRAINT IF EXISTS export_jobs_user_id_fkey;

-- Drop foreign key constraints from analytics_data table
ALTER TABLE public.analytics_data DROP CONSTRAINT IF EXISTS analytics_data_user_id_fkey;

-- Drop foreign key constraints from blocked_users table
ALTER TABLE public.blocked_users DROP CONSTRAINT IF EXISTS blocked_users_blocker_id_fkey;
ALTER TABLE public.blocked_users DROP CONSTRAINT IF EXISTS blocked_users_blocked_id_fkey;

-- Drop foreign key constraints from conversations table
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_participant1_id_fkey;
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_participant2_id_fkey;

-- Drop foreign key constraints from messages table
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

-- Drop foreign key constraints from message_reads table
ALTER TABLE public.message_reads DROP CONSTRAINT IF EXISTS message_reads_message_id_fkey;
ALTER TABLE public.message_reads DROP CONSTRAINT IF EXISTS message_reads_user_id_fkey;

-- Drop foreign key constraints from message_preferences table
ALTER TABLE public.message_preferences DROP CONSTRAINT IF EXISTS message_preferences_user_id_fkey;

-- Drop foreign key constraints from notification_preferences table
ALTER TABLE public.notification_preferences DROP CONSTRAINT IF EXISTS notification_preferences_user_id_fkey;

-- Drop foreign key constraints from widgets table
ALTER TABLE public.widgets DROP CONSTRAINT IF EXISTS widgets_user_id_fkey;
