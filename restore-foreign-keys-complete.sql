-- Complete foreign key restoration script that handles existing constraints
-- This script drops existing constraints first, then recreates them

-- Drop all existing foreign key constraints first
-- This prevents "already exists" errors

-- Drop profiles constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Drop streaks constraints
ALTER TABLE public.streaks DROP CONSTRAINT IF EXISTS streaks_created_by_fkey;

-- Drop challenges constraints
ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_created_by_fkey;

-- Drop groups constraints
ALTER TABLE public.groups DROP CONSTRAINT IF EXISTS groups_created_by_fkey;

-- Drop user_streaks constraints
ALTER TABLE public.user_streaks DROP CONSTRAINT IF EXISTS user_streaks_user_id_fkey;
ALTER TABLE public.user_streaks DROP CONSTRAINT IF EXISTS user_streaks_streak_id_fkey;

-- Drop checkins constraints
ALTER TABLE public.checkins DROP CONSTRAINT IF EXISTS checkins_user_streak_id_fkey;

-- Drop comments constraints
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_streak_id_fkey;
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;

-- Drop likes constraints
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_streak_id_fkey;
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_user_id_fkey;

-- Drop user_achievements constraints
ALTER TABLE public.user_achievements DROP CONSTRAINT IF EXISTS user_achievements_user_id_fkey;
ALTER TABLE public.user_achievements DROP CONSTRAINT IF EXISTS user_achievements_achievement_id_fkey;

-- Drop challenge_participants constraints
ALTER TABLE public.challenge_participants DROP CONSTRAINT IF EXISTS challenge_participants_challenge_id_fkey;
ALTER TABLE public.challenge_participants DROP CONSTRAINT IF EXISTS challenge_participants_user_id_fkey;

-- Drop group_members constraints
ALTER TABLE public.group_members DROP CONSTRAINT IF EXISTS group_members_group_id_fkey;
ALTER TABLE public.group_members DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;

-- Drop follows constraints
ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS follows_follower_id_fkey;
ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS follows_following_id_fkey;

-- Drop follow_requests constraints
ALTER TABLE public.follow_requests DROP CONSTRAINT IF EXISTS follow_requests_requester_id_fkey;
ALTER TABLE public.follow_requests DROP CONSTRAINT IF EXISTS follow_requests_target_id_fkey;

-- Drop notifications constraints
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- Drop notes constraints
ALTER TABLE public.notes DROP CONSTRAINT IF EXISTS notes_streak_id_fkey;
ALTER TABLE public.notes DROP CONSTRAINT IF EXISTS notes_user_id_fkey;

-- Drop reminders constraints
ALTER TABLE public.reminders DROP CONSTRAINT IF EXISTS reminders_user_id_fkey;
ALTER TABLE public.reminders DROP CONSTRAINT IF EXISTS reminders_streak_id_fkey;

-- Drop reports constraints
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_reporter_id_fkey;
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_reported_user_id_fkey;
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_reported_streak_id_fkey;

-- Drop activity_log constraints
ALTER TABLE public.activity_log DROP CONSTRAINT IF EXISTS activity_log_streak_id_fkey;
ALTER TABLE public.activity_log DROP CONSTRAINT IF EXISTS activity_log_user_id_fkey;

-- Drop export_jobs constraints
ALTER TABLE public.export_jobs DROP CONSTRAINT IF EXISTS export_jobs_user_id_fkey;

-- Drop analytics_data constraints
ALTER TABLE public.analytics_data DROP CONSTRAINT IF EXISTS analytics_data_user_id_fkey;

-- Drop blocked_users constraints
ALTER TABLE public.blocked_users DROP CONSTRAINT IF EXISTS blocked_users_blocker_id_fkey;
ALTER TABLE public.blocked_users DROP CONSTRAINT IF EXISTS blocked_users_blocked_id_fkey;

-- Drop conversations constraints
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_participant1_id_fkey;
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_participant2_id_fkey;

-- Drop messages constraints
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

-- Drop message_reads constraints
ALTER TABLE public.message_reads DROP CONSTRAINT IF EXISTS message_reads_message_id_fkey;
ALTER TABLE public.message_reads DROP CONSTRAINT IF EXISTS message_reads_user_id_fkey;

-- Drop message_preferences constraints
ALTER TABLE public.message_preferences DROP CONSTRAINT IF EXISTS message_preferences_user_id_fkey;

-- Drop notification_preferences constraints
ALTER TABLE public.notification_preferences DROP CONSTRAINT IF EXISTS notification_preferences_user_id_fkey;

-- Drop widgets constraints
ALTER TABLE public.widgets DROP CONSTRAINT IF EXISTS widgets_user_id_fkey;

-- Drop unique constraints
ALTER TABLE public.user_streaks DROP CONSTRAINT IF EXISTS user_streaks_user_streak_unique;
ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS follows_follower_following_unique;
ALTER TABLE public.follow_requests DROP CONSTRAINT IF EXISTS follow_requests_requester_target_unique;
ALTER TABLE public.blocked_users DROP CONSTRAINT IF EXISTS blocked_users_blocker_blocked_unique;
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_participants_unique;
ALTER TABLE public.message_reads DROP CONSTRAINT IF EXISTS message_reads_message_user_unique;
ALTER TABLE public.user_achievements DROP CONSTRAINT IF EXISTS user_achievements_user_achievement_unique;
ALTER TABLE public.challenge_participants DROP CONSTRAINT IF EXISTS challenge_participants_challenge_user_unique;
ALTER TABLE public.group_members DROP CONSTRAINT IF EXISTS group_members_group_user_unique;
ALTER TABLE public.checkins DROP CONSTRAINT IF EXISTS checkins_user_streak_date_unique;
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_streak_user_unique;
ALTER TABLE public.message_preferences DROP CONSTRAINT IF EXISTS message_preferences_user_unique;
ALTER TABLE public.notification_preferences DROP CONSTRAINT IF EXISTS notification_preferences_user_unique;

-- Now recreate all foreign key constraints (excluding profiles -> auth.users)

-- Restore foreign key constraints for streaks table
ALTER TABLE public.streaks 
ADD CONSTRAINT streaks_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Restore foreign key constraints for challenges table
ALTER TABLE public.challenges 
ADD CONSTRAINT challenges_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Restore foreign key constraints for groups table
ALTER TABLE public.groups 
ADD CONSTRAINT groups_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Restore foreign key constraints for user_streaks table
ALTER TABLE public.user_streaks 
ADD CONSTRAINT user_streaks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_streaks 
ADD CONSTRAINT user_streaks_streak_id_fkey 
FOREIGN KEY (streak_id) REFERENCES public.streaks(id) ON DELETE CASCADE;

-- Restore foreign key constraints for checkins table
ALTER TABLE public.checkins 
ADD CONSTRAINT checkins_user_streak_id_fkey 
FOREIGN KEY (user_streak_id) REFERENCES public.user_streaks(id) ON DELETE CASCADE;

-- Restore foreign key constraints for comments table
ALTER TABLE public.comments 
ADD CONSTRAINT comments_streak_id_fkey 
FOREIGN KEY (streak_id) REFERENCES public.streaks(id) ON DELETE CASCADE;

ALTER TABLE public.comments 
ADD CONSTRAINT comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Restore foreign key constraints for likes table
ALTER TABLE public.likes 
ADD CONSTRAINT likes_streak_id_fkey 
FOREIGN KEY (streak_id) REFERENCES public.streaks(id) ON DELETE CASCADE;

ALTER TABLE public.likes 
ADD CONSTRAINT likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Restore foreign key constraints for user_achievements table
ALTER TABLE public.user_achievements 
ADD CONSTRAINT user_achievements_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_achievements 
ADD CONSTRAINT user_achievements_achievement_id_fkey 
FOREIGN KEY (achievement_id) REFERENCES public.achievements(id) ON DELETE CASCADE;

-- Restore foreign key constraints for challenge_participants table
ALTER TABLE public.challenge_participants 
ADD CONSTRAINT challenge_participants_challenge_id_fkey 
FOREIGN KEY (challenge_id) REFERENCES public.challenges(id) ON DELETE CASCADE;

ALTER TABLE public.challenge_participants 
ADD CONSTRAINT challenge_participants_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Restore foreign key constraints for group_members table
ALTER TABLE public.group_members 
ADD CONSTRAINT group_members_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;

ALTER TABLE public.group_members 
ADD CONSTRAINT group_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Restore foreign key constraints for follows table
ALTER TABLE public.follows 
ADD CONSTRAINT follows_follower_id_fkey 
FOREIGN KEY (follower_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.follows 
ADD CONSTRAINT follows_following_id_fkey 
FOREIGN KEY (following_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Restore foreign key constraints for follow_requests table
ALTER TABLE public.follow_requests 
ADD CONSTRAINT follow_requests_requester_id_fkey 
FOREIGN KEY (requester_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.follow_requests 
ADD CONSTRAINT follow_requests_target_id_fkey 
FOREIGN KEY (target_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Restore foreign key constraints for notifications table
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Restore foreign key constraints for notes table
ALTER TABLE public.notes 
ADD CONSTRAINT notes_streak_id_fkey 
FOREIGN KEY (streak_id) REFERENCES public.streaks(id) ON DELETE CASCADE;

ALTER TABLE public.notes 
ADD CONSTRAINT notes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Restore foreign key constraints for reminders table
ALTER TABLE public.reminders 
ADD CONSTRAINT reminders_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.reminders 
ADD CONSTRAINT reminders_streak_id_fkey 
FOREIGN KEY (streak_id) REFERENCES public.streaks(id) ON DELETE CASCADE;

-- Restore foreign key constraints for reports table
ALTER TABLE public.reports 
ADD CONSTRAINT reports_reporter_id_fkey 
FOREIGN KEY (reporter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.reports 
ADD CONSTRAINT reports_reported_user_id_fkey 
FOREIGN KEY (reported_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.reports 
ADD CONSTRAINT reports_reported_streak_id_fkey 
FOREIGN KEY (reported_streak_id) REFERENCES public.streaks(id) ON DELETE SET NULL;

-- Restore foreign key constraints for activity_log table
ALTER TABLE public.activity_log 
ADD CONSTRAINT activity_log_streak_id_fkey 
FOREIGN KEY (streak_id) REFERENCES public.streaks(id) ON DELETE CASCADE;

ALTER TABLE public.activity_log 
ADD CONSTRAINT activity_log_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Restore foreign key constraints for export_jobs table
ALTER TABLE public.export_jobs 
ADD CONSTRAINT export_jobs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Restore foreign key constraints for analytics_data table
ALTER TABLE public.analytics_data 
ADD CONSTRAINT analytics_data_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Restore foreign key constraints for blocked_users table
ALTER TABLE public.blocked_users 
ADD CONSTRAINT blocked_users_blocker_id_fkey 
FOREIGN KEY (blocker_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.blocked_users 
ADD CONSTRAINT blocked_users_blocked_id_fkey 
FOREIGN KEY (blocked_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Restore foreign key constraints for conversations table
ALTER TABLE public.conversations 
ADD CONSTRAINT conversations_participant1_id_fkey 
FOREIGN KEY (participant1_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.conversations 
ADD CONSTRAINT conversations_participant2_id_fkey 
FOREIGN KEY (participant2_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Restore foreign key constraints for messages table
ALTER TABLE public.messages 
ADD CONSTRAINT messages_conversation_id_fkey 
FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;

ALTER TABLE public.messages 
ADD CONSTRAINT messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Restore foreign key constraints for message_reads table
ALTER TABLE public.message_reads 
ADD CONSTRAINT message_reads_message_id_fkey 
FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;

ALTER TABLE public.message_reads 
ADD CONSTRAINT message_reads_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Restore foreign key constraints for message_preferences table
ALTER TABLE public.message_preferences 
ADD CONSTRAINT message_preferences_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Restore foreign key constraints for notification_preferences table
ALTER TABLE public.notification_preferences 
ADD CONSTRAINT notification_preferences_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Restore foreign key constraints for widgets table
ALTER TABLE public.widgets 
ADD CONSTRAINT widgets_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add unique constraints
ALTER TABLE public.user_streaks 
ADD CONSTRAINT user_streaks_user_streak_unique 
UNIQUE (user_id, streak_id);

ALTER TABLE public.follows 
ADD CONSTRAINT follows_follower_following_unique 
UNIQUE (follower_id, following_id);

ALTER TABLE public.follow_requests 
ADD CONSTRAINT follow_requests_requester_target_unique 
UNIQUE (requester_id, target_id);

ALTER TABLE public.blocked_users 
ADD CONSTRAINT blocked_users_blocker_blocked_unique 
UNIQUE (blocker_id, blocked_id);

ALTER TABLE public.conversations 
ADD CONSTRAINT conversations_participants_unique 
UNIQUE (participant1_id, participant2_id);

ALTER TABLE public.message_reads 
ADD CONSTRAINT message_reads_message_user_unique 
UNIQUE (message_id, user_id);

ALTER TABLE public.user_achievements 
ADD CONSTRAINT user_achievements_user_achievement_unique 
UNIQUE (user_id, achievement_id);

ALTER TABLE public.challenge_participants 
ADD CONSTRAINT challenge_participants_challenge_user_unique 
UNIQUE (challenge_id, user_id);

ALTER TABLE public.group_members 
ADD CONSTRAINT group_members_group_user_unique 
UNIQUE (group_id, user_id);

ALTER TABLE public.checkins 
ADD CONSTRAINT checkins_user_streak_date_unique 
UNIQUE (user_streak_id, checkin_date);

ALTER TABLE public.likes 
ADD CONSTRAINT likes_streak_user_unique 
UNIQUE (streak_id, user_id);

-- Add unique constraint for message preferences (one per user)
ALTER TABLE public.message_preferences 
ADD CONSTRAINT message_preferences_user_unique 
UNIQUE (user_id);

-- Add unique constraint for notification preferences (one per user)
ALTER TABLE public.notification_preferences 
ADD CONSTRAINT notification_preferences_user_unique 
UNIQUE (user_id);
