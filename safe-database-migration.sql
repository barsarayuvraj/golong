-- Migration script for GoLong app - Add missing tables only
-- This script only creates tables that don't already exist

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Comments table for social features (if not exists)
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  streak_id UUID REFERENCES public.streaks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Likes table for social features (if not exists)
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  streak_id UUID REFERENCES public.streaks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(streak_id, user_id)
);

-- Notifications table (if not exists)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('streak_reminder', 'milestone', 'comment', 'like', 'follow', 'challenge', 'group_invite')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User notification preferences (if not exists)
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  streak_reminders BOOLEAN DEFAULT true,
  milestone_notifications BOOLEAN DEFAULT true,
  social_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements table (if not exists)
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  criteria JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements (if not exists)
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Streak templates (if not exists)
CREATE TABLE IF NOT EXISTS public.streak_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  suggested_duration INTEGER,
  tags TEXT[] DEFAULT '{}',
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reminders table for streak reminders (if not exists)
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  streak_id UUID REFERENCES public.streaks(id) ON DELETE CASCADE NOT NULL,
  time TIME NOT NULL,
  days_of_week INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}', -- Monday to Friday by default
  message TEXT,
  reminder_type TEXT DEFAULT 'push' CHECK (reminder_type IN ('push', 'email', 'both')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenges table for streak challenges (if not exists)
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  max_participants INTEGER,
  prize_description TEXT,
  rules TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenge participants (if not exists)
CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(challenge_id, user_id)
);

-- Groups table for group streaks (if not exists)
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  max_members INTEGER DEFAULT 50,
  is_private BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group members (if not exists)
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Widgets table for customizable dashboard widgets (if not exists)
CREATE TABLE IF NOT EXISTS public.widgets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('streak_counter', 'calendar', 'progress_chart', 'achievements', 'leaderboard')),
  config JSONB DEFAULT '{}',
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics data table for storing computed analytics (if not exists)
CREATE TABLE IF NOT EXISTS public.analytics_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  date DATE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, metric_name, date)
);

-- Export jobs table for data export functionality (if not exists)
CREATE TABLE IF NOT EXISTS public.export_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  export_type TEXT NOT NULL CHECK (export_type IN ('streaks', 'checkins', 'analytics', 'all')),
  format TEXT NOT NULL CHECK (format IN ('csv', 'json', 'pdf')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_comments_streak_id ON public.comments(streak_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_streak_id ON public.likes(streak_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_streak_templates_category ON public.streak_templates(category);
CREATE INDEX IF NOT EXISTS idx_streak_templates_popular ON public.streak_templates(is_popular) WHERE is_popular = true;
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_streak_id ON public.reminders(streak_id);
CREATE INDEX IF NOT EXISTS idx_challenges_created_by ON public.challenges(created_by);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON public.challenges(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge_id ON public.challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user_id ON public.challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON public.groups(created_by);
CREATE INDEX IF NOT EXISTS idx_groups_private ON public.groups(is_private);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_widgets_user_id ON public.widgets(user_id);
CREATE INDEX IF NOT EXISTS idx_widgets_type ON public.widgets(type);
CREATE INDEX IF NOT EXISTS idx_analytics_data_user_id ON public.analytics_data(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_data_date ON public.analytics_data(date);
CREATE INDEX IF NOT EXISTS idx_export_jobs_user_id ON public.export_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_export_jobs_status ON public.export_jobs(status);

-- Enable RLS on new tables (only if not already enabled)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'comments' AND schemaname = 'public') THEN
        ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'likes' AND schemaname = 'public') THEN
        ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notifications' AND schemaname = 'public') THEN
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notification_preferences' AND schemaname = 'public') THEN
        ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'achievements' AND schemaname = 'public') THEN
        ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_achievements' AND schemaname = 'public') THEN
        ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'streak_templates' AND schemaname = 'public') THEN
        ALTER TABLE public.streak_templates ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'reminders' AND schemaname = 'public') THEN
        ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'challenges' AND schemaname = 'public') THEN
        ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'challenge_participants' AND schemaname = 'public') THEN
        ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'groups' AND schemaname = 'public') THEN
        ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'group_members' AND schemaname = 'public') THEN
        ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'widgets' AND schemaname = 'public') THEN
        ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'analytics_data' AND schemaname = 'public') THEN
        ALTER TABLE public.analytics_data ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'export_jobs' AND schemaname = 'public') THEN
        ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create RLS policies (only if they don't exist)
-- Comments policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Anyone can view comments on public streaks') THEN
        CREATE POLICY "Anyone can view comments on public streaks" ON public.comments
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM public.streaks 
              WHERE id = streak_id AND is_public = true
            )
          );
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Users can create comments') THEN
        CREATE POLICY "Users can create comments" ON public.comments
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Users can update their own comments') THEN
        CREATE POLICY "Users can update their own comments" ON public.comments
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Users can delete their own comments') THEN
        CREATE POLICY "Users can delete their own comments" ON public.comments
          FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Likes policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'likes' AND policyname = 'Anyone can view likes on public streaks') THEN
        CREATE POLICY "Anyone can view likes on public streaks" ON public.likes
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM public.streaks 
              WHERE id = streak_id AND is_public = true
            )
          );
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'likes' AND policyname = 'Users can like/unlike streaks') THEN
        CREATE POLICY "Users can like/unlike streaks" ON public.likes
          FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Notifications policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view their own notifications') THEN
        CREATE POLICY "Users can view their own notifications" ON public.notifications
          FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can update their own notifications') THEN
        CREATE POLICY "Users can update their own notifications" ON public.notifications
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Notification preferences policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_preferences' AND policyname = 'Users can view their own notification preferences') THEN
        CREATE POLICY "Users can view their own notification preferences" ON public.notification_preferences
          FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_preferences' AND policyname = 'Users can update their own notification preferences') THEN
        CREATE POLICY "Users can update their own notification preferences" ON public.notification_preferences
          FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Achievements policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'achievements' AND policyname = 'Anyone can view achievements') THEN
        CREATE POLICY "Anyone can view achievements" ON public.achievements
          FOR SELECT USING (true);
    END IF;
END $$;

-- User achievements policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_achievements' AND policyname = 'Users can view their own achievements') THEN
        CREATE POLICY "Users can view their own achievements" ON public.user_achievements
          FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_achievements' AND policyname = 'Users can view public achievements') THEN
        CREATE POLICY "Users can view public achievements" ON public.user_achievements
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM public.profiles 
              WHERE id = user_id
            )
          );
    END IF;
END $$;

-- Streak templates policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'streak_templates' AND policyname = 'Anyone can view streak templates') THEN
        CREATE POLICY "Anyone can view streak templates" ON public.streak_templates
          FOR SELECT USING (true);
    END IF;
END $$;

-- Reminders policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reminders' AND policyname = 'Users can view their own reminders') THEN
        CREATE POLICY "Users can view their own reminders" ON public.reminders
          FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reminders' AND policyname = 'Users can create reminders for their streaks') THEN
        CREATE POLICY "Users can create reminders for their streaks" ON public.reminders
          FOR INSERT WITH CHECK (
            auth.uid() = user_id AND
            EXISTS (
              SELECT 1 FROM public.user_streaks 
              WHERE user_id = auth.uid() AND streak_id = reminders.streak_id
            )
          );
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reminders' AND policyname = 'Users can update their own reminders') THEN
        CREATE POLICY "Users can update their own reminders" ON public.reminders
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reminders' AND policyname = 'Users can delete their own reminders') THEN
        CREATE POLICY "Users can delete their own reminders" ON public.reminders
          FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Challenges policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'challenges' AND policyname = 'Anyone can view active challenges') THEN
        CREATE POLICY "Anyone can view active challenges" ON public.challenges
          FOR SELECT USING (is_active = true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'challenges' AND policyname = 'Users can create challenges') THEN
        CREATE POLICY "Users can create challenges" ON public.challenges
          FOR INSERT WITH CHECK (auth.uid() = created_by);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'challenges' AND policyname = 'Users can update their own challenges') THEN
        CREATE POLICY "Users can update their own challenges" ON public.challenges
          FOR UPDATE USING (auth.uid() = created_by);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'challenges' AND policyname = 'Users can delete their own challenges') THEN
        CREATE POLICY "Users can delete their own challenges" ON public.challenges
          FOR DELETE USING (auth.uid() = created_by);
    END IF;
END $$;

-- Challenge participants policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'challenge_participants' AND policyname = 'Anyone can view challenge participants') THEN
        CREATE POLICY "Anyone can view challenge participants" ON public.challenge_participants
          FOR SELECT USING (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'challenge_participants' AND policyname = 'Users can join challenges') THEN
        CREATE POLICY "Users can join challenges" ON public.challenge_participants
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'challenge_participants' AND policyname = 'Users can update their own participation') THEN
        CREATE POLICY "Users can update their own participation" ON public.challenge_participants
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Groups policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'groups' AND policyname = 'Anyone can view public groups') THEN
        CREATE POLICY "Anyone can view public groups" ON public.groups
          FOR SELECT USING (is_private = false);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'groups' AND policyname = 'Group members can view private groups') THEN
        CREATE POLICY "Group members can view private groups" ON public.groups
          FOR SELECT USING (
            is_private = false OR
            EXISTS (
              SELECT 1 FROM public.group_members 
              WHERE group_id = groups.id AND user_id = auth.uid()
            )
          );
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'groups' AND policyname = 'Users can create groups') THEN
        CREATE POLICY "Users can create groups" ON public.groups
          FOR INSERT WITH CHECK (auth.uid() = created_by);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'groups' AND policyname = 'Group admins can update groups') THEN
        CREATE POLICY "Group admins can update groups" ON public.groups
          FOR UPDATE USING (
            auth.uid() = created_by OR
            EXISTS (
              SELECT 1 FROM public.group_members 
              WHERE group_id = groups.id AND user_id = auth.uid() AND role IN ('admin', 'moderator')
            )
          );
    END IF;
END $$;

-- Group members policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'group_members' AND policyname = 'Group members can view group membership') THEN
        CREATE POLICY "Group members can view group membership" ON public.group_members
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM public.groups 
              WHERE id = group_id AND (
                is_private = false OR
                EXISTS (
                  SELECT 1 FROM public.group_members gm2 
                  WHERE gm2.group_id = group_id AND gm2.user_id = auth.uid()
                )
              )
            )
          );
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'group_members' AND policyname = 'Users can join groups') THEN
        CREATE POLICY "Users can join groups" ON public.group_members
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'group_members' AND policyname = 'Group admins can manage members') THEN
        CREATE POLICY "Group admins can manage members" ON public.group_members
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM public.group_members gm 
              WHERE gm.group_id = group_members.group_id 
                AND gm.user_id = auth.uid() 
                AND gm.role IN ('admin', 'moderator')
            )
          );
    END IF;
END $$;

-- Widgets policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'widgets' AND policyname = 'Users can view their own widgets') THEN
        CREATE POLICY "Users can view their own widgets" ON public.widgets
          FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'widgets' AND policyname = 'Users can create widgets') THEN
        CREATE POLICY "Users can create widgets" ON public.widgets
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'widgets' AND policyname = 'Users can update their own widgets') THEN
        CREATE POLICY "Users can update their own widgets" ON public.widgets
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'widgets' AND policyname = 'Users can delete their own widgets') THEN
        CREATE POLICY "Users can delete their own widgets" ON public.widgets
          FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Analytics data policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_data' AND policyname = 'Users can view their own analytics data') THEN
        CREATE POLICY "Users can view their own analytics data" ON public.analytics_data
          FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_data' AND policyname = 'Users can insert their own analytics data') THEN
        CREATE POLICY "Users can insert their own analytics data" ON public.analytics_data
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Export jobs policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'export_jobs' AND policyname = 'Users can view their own export jobs') THEN
        CREATE POLICY "Users can view their own export jobs" ON public.export_jobs
          FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'export_jobs' AND policyname = 'Users can create export jobs') THEN
        CREATE POLICY "Users can create export jobs" ON public.export_jobs
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'export_jobs' AND policyname = 'Users can update their own export jobs') THEN
        CREATE POLICY "Users can update their own export jobs" ON public.export_jobs
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create functions (only if they don't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_reminders_updated_at') THEN
        CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON public.reminders
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_challenges_updated_at') THEN
        CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON public.challenges
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_groups_updated_at') THEN
        CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_widgets_updated_at') THEN
        CREATE TRIGGER update_widgets_updated_at BEFORE UPDATE ON public.widgets
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create notification functions first
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  streak_creator UUID;
BEGIN
  -- Get the streak creator
  SELECT created_by INTO streak_creator
  FROM public.streaks
  WHERE id = NEW.streak_id;
  
  -- Don't notify if user likes their own streak
  IF streak_creator != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      streak_creator,
      'like',
      'Someone liked your streak!',
      'Your streak received a new like.',
      jsonb_build_object('streak_id', NEW.streak_id, 'liker_id', NEW.user_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  streak_creator UUID;
BEGIN
  -- Get the streak creator
  SELECT created_by INTO streak_creator
  FROM public.streaks
  WHERE id = NEW.streak_id;
  
  -- Don't notify if user comments on their own streak
  IF streak_creator != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      streak_creator,
      'comment',
      'New comment on your streak!',
      'Your streak received a new comment.',
      jsonb_build_object('streak_id', NEW.streak_id, 'commenter_id', NEW.user_id, 'comment_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create notification triggers after functions are created
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'create_like_notification_trigger') THEN
        CREATE TRIGGER create_like_notification_trigger
          AFTER INSERT ON public.likes
          FOR EACH ROW EXECUTE FUNCTION create_like_notification();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'create_comment_notification_trigger') THEN
        CREATE TRIGGER create_comment_notification_trigger
          AFTER INSERT ON public.comments
          FOR EACH ROW EXECUTE FUNCTION create_comment_notification();
    END IF;
END $$;

-- Insert default achievements (only if they don't exist)
INSERT INTO public.achievements (name, description, icon, criteria) 
SELECT * FROM (VALUES
('First Streak', 'Complete your first streak', '🔥', '{"min_days": 1}'::jsonb),
('Week Warrior', 'Maintain a streak for 7 days', '⚡', '{"min_days": 7}'::jsonb),
('Month Master', 'Maintain a streak for 30 days', '🏆', '{"min_days": 30}'::jsonb),
('Century Club', 'Maintain a streak for 100 days', '💯', '{"min_days": 100}'::jsonb),
('Social Butterfly', 'Join 10 public streaks', '🦋', '{"min_streaks": 10}'::jsonb),
('Comment King', 'Leave 50 comments on streaks', '💬', '{"min_comments": 50}'::jsonb),
('Like Machine', 'Like 100 streaks', '❤️', '{"min_likes": 100}'::jsonb),
('Group Leader', 'Create a group with 10+ members', '👥', '{"min_group_members": 10}'::jsonb)
) AS v(name, description, icon, criteria)
WHERE NOT EXISTS (SELECT 1 FROM public.achievements WHERE achievements.name = v.name);

-- Insert default streak templates (only if they don't exist)
INSERT INTO public.streak_templates (name, description, category, suggested_duration, tags, is_popular)
SELECT * FROM (VALUES
('Daily Exercise', 'Exercise for at least 30 minutes every day', 'Health', 30, ARRAY['fitness', 'health', 'exercise'], true),
('No Social Media', 'Avoid social media platforms for the day', 'Productivity', 30, ARRAY['productivity', 'digital-detox', 'focus'], true),
('Read Daily', 'Read for at least 30 minutes every day', 'Learning', 365, ARRAY['reading', 'learning', 'education'], true),
('Meditation', 'Meditate for at least 10 minutes daily', 'Wellness', 21, ARRAY['meditation', 'mindfulness', 'wellness'], true),
('No Soda', 'Avoid drinking soda or sugary drinks', 'Health', 60, ARRAY['health', 'nutrition', 'sugar-free'], true),
('Learn Spanish', 'Practice Spanish for at least 15 minutes daily', 'Learning', 90, ARRAY['language', 'spanish', 'learning'], false),
('Daily Gratitude', 'Write down 3 things you are grateful for', 'Wellness', 30, ARRAY['gratitude', 'mindfulness', 'positivity'], false),
('No Phone Before Bed', 'Avoid using phone 1 hour before bedtime', 'Wellness', 30, ARRAY['sleep', 'wellness', 'digital-detox'], false)
) AS v(name, description, category, suggested_duration, tags, is_popular)
WHERE NOT EXISTS (SELECT 1 FROM public.streak_templates WHERE streak_templates.name = v.name);