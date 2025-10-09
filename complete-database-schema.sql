-- Complete Database Schema for GoLong App
-- This file contains all tables needed for the full application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Streaks table
CREATE TABLE public.streaks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true
);

-- User streaks (when a user joins a streak)
CREATE TABLE public.user_streaks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  streak_id UUID REFERENCES public.streaks(id) ON DELETE CASCADE NOT NULL,
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  last_checkin_date DATE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, streak_id)
);

-- Daily check-ins
CREATE TABLE public.checkins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_streak_id UUID REFERENCES public.user_streaks(id) ON DELETE CASCADE NOT NULL,
  checkin_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_streak_id, checkin_date)
);

-- Reports table for moderation
CREATE TABLE public.reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  streak_id UUID REFERENCES public.streaks(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed'))
);

-- Comments table for social features
CREATE TABLE public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  streak_id UUID REFERENCES public.streaks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Likes table for social features
CREATE TABLE public.likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  streak_id UUID REFERENCES public.streaks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(streak_id, user_id)
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('streak_reminder', 'milestone', 'comment', 'like', 'follow', 'challenge', 'group_invite')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User notification preferences
CREATE TABLE public.notification_preferences (
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

-- Achievements table
CREATE TABLE public.achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  criteria JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements
CREATE TABLE public.user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Streak templates
CREATE TABLE public.streak_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  suggested_duration INTEGER,
  tags TEXT[] DEFAULT '{}',
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reminders table for streak reminders
CREATE TABLE public.reminders (
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

-- Challenges table for streak challenges
CREATE TABLE public.challenges (
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

-- Challenge participants
CREATE TABLE public.challenge_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(challenge_id, user_id)
);

-- Groups table for group streaks
CREATE TABLE public.groups (
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

-- Group members
CREATE TABLE public.group_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Widgets table for customizable dashboard widgets
CREATE TABLE public.widgets (
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

-- Analytics data table for storing computed analytics
CREATE TABLE public.analytics_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  date DATE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, metric_name, date)
);

-- Export jobs table for data export functionality
CREATE TABLE public.export_jobs (
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

-- Indexes for performance
CREATE INDEX idx_streaks_public ON public.streaks(is_public) WHERE is_public = true;
CREATE INDEX idx_streaks_created_by ON public.streaks(created_by);
CREATE INDEX idx_user_streaks_user_id ON public.user_streaks(user_id);
CREATE INDEX idx_user_streaks_streak_id ON public.user_streaks(streak_id);
CREATE INDEX idx_checkins_user_streak_id ON public.checkins(user_streak_id);
CREATE INDEX idx_checkins_date ON public.checkins(checkin_date);
CREATE INDEX idx_comments_streak_id ON public.comments(streak_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_likes_streak_id ON public.likes(streak_id);
CREATE INDEX idx_likes_user_id ON public.likes(user_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_streak_templates_category ON public.streak_templates(category);
CREATE INDEX idx_streak_templates_popular ON public.streak_templates(is_popular) WHERE is_popular = true;
CREATE INDEX idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX idx_reminders_streak_id ON public.reminders(streak_id);
CREATE INDEX idx_challenges_created_by ON public.challenges(created_by);
CREATE INDEX idx_challenges_active ON public.challenges(is_active) WHERE is_active = true;
CREATE INDEX idx_challenge_participants_challenge_id ON public.challenge_participants(challenge_id);
CREATE INDEX idx_challenge_participants_user_id ON public.challenge_participants(user_id);
CREATE INDEX idx_groups_created_by ON public.groups(created_by);
CREATE INDEX idx_groups_private ON public.groups(is_private);
CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX idx_widgets_user_id ON public.widgets(user_id);
CREATE INDEX idx_widgets_type ON public.widgets(type);
CREATE INDEX idx_analytics_data_user_id ON public.analytics_data(user_id);
CREATE INDEX idx_analytics_data_date ON public.analytics_data(date);
CREATE INDEX idx_export_jobs_user_id ON public.export_jobs(user_id);
CREATE INDEX idx_export_jobs_status ON public.export_jobs(status);

-- Row Level Security (RLS) policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Streaks policies
CREATE POLICY "Public streaks are viewable by everyone" ON public.streaks
  FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create streaks" ON public.streaks
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own streaks" ON public.streaks
  FOR UPDATE USING (auth.uid() = created_by);

-- User streaks policies
CREATE POLICY "Users can view all user streaks" ON public.user_streaks
  FOR SELECT USING (true);

CREATE POLICY "Users can join streaks" ON public.user_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks" ON public.user_streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- Checkins policies
CREATE POLICY "Users can view all checkins" ON public.checkins
  FOR SELECT USING (true);

CREATE POLICY "Users can create checkins for their streaks" ON public.checkins
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_streaks 
      WHERE id = user_streak_id AND user_id = auth.uid()
    )
  );

-- Reports policies
CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Comments policies
CREATE POLICY "Anyone can view comments on public streaks" ON public.comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.streaks 
      WHERE id = streak_id AND is_public = true
    )
  );

CREATE POLICY "Users can create comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Anyone can view likes on public streaks" ON public.likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.streaks 
      WHERE id = streak_id AND is_public = true
    )
  );

CREATE POLICY "Users can like/unlike streaks" ON public.likes
  FOR ALL USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Notification preferences policies
CREATE POLICY "Users can view their own notification preferences" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Anyone can view achievements" ON public.achievements
  FOR SELECT USING (true);

-- User achievements policies
CREATE POLICY "Users can view their own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public achievements" ON public.user_achievements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = user_id
    )
  );

-- Streak templates policies
CREATE POLICY "Anyone can view streak templates" ON public.streak_templates
  FOR SELECT USING (true);

-- Reminders policies
CREATE POLICY "Users can view their own reminders" ON public.reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create reminders for their streaks" ON public.reminders
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.user_streaks 
      WHERE user_id = auth.uid() AND streak_id = reminders.streak_id
    )
  );

CREATE POLICY "Users can update their own reminders" ON public.reminders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders" ON public.reminders
  FOR DELETE USING (auth.uid() = user_id);

-- Challenges policies
CREATE POLICY "Anyone can view active challenges" ON public.challenges
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create challenges" ON public.challenges
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own challenges" ON public.challenges
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own challenges" ON public.challenges
  FOR DELETE USING (auth.uid() = created_by);

-- Challenge participants policies
CREATE POLICY "Anyone can view challenge participants" ON public.challenge_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can join challenges" ON public.challenge_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" ON public.challenge_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- Groups policies
CREATE POLICY "Anyone can view public groups" ON public.groups
  FOR SELECT USING (is_private = false);

CREATE POLICY "Group members can view private groups" ON public.groups
  FOR SELECT USING (
    is_private = false OR
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = groups.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups" ON public.groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group admins can update groups" ON public.groups
  FOR UPDATE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = groups.id AND user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Group members policies
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

CREATE POLICY "Users can join groups" ON public.group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Group admins can manage members" ON public.group_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm 
      WHERE gm.group_id = group_members.group_id 
        AND gm.user_id = auth.uid() 
        AND gm.role IN ('admin', 'moderator')
    )
  );

-- Widgets policies
CREATE POLICY "Users can view their own widgets" ON public.widgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create widgets" ON public.widgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own widgets" ON public.widgets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own widgets" ON public.widgets
  FOR DELETE USING (auth.uid() = user_id);

-- Analytics data policies
CREATE POLICY "Users can view their own analytics data" ON public.analytics_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics data" ON public.analytics_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Export jobs policies
CREATE POLICY "Users can view their own export jobs" ON public.export_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create export jobs" ON public.export_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own export jobs" ON public.export_jobs
  FOR UPDATE USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_streaks_updated_at BEFORE UPDATE ON public.streaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON public.reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON public.challenges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_widgets_updated_at BEFORE UPDATE ON public.widgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update streak counts when checkin is added
CREATE OR REPLACE FUNCTION update_streak_count()
RETURNS TRIGGER AS $$
DECLARE
  user_streak_record RECORD;
  current_streak INTEGER := 0;
  longest_streak INTEGER := 0;
BEGIN
  -- Get the user_streak record
  SELECT * INTO user_streak_record 
  FROM public.user_streaks 
  WHERE id = NEW.user_streak_id;
  
  -- Calculate current streak
  SELECT COUNT(*) INTO current_streak
  FROM public.checkins c
  WHERE c.user_streak_id = NEW.user_streak_id
    AND c.checkin_date >= (
      SELECT COALESCE(MAX(checkin_date), '1900-01-01'::date)
      FROM public.checkins c2
      WHERE c2.user_streak_id = NEW.user_streak_id
        AND c2.checkin_date < NEW.checkin_date
    );
  
  -- Get longest streak
  SELECT COALESCE(MAX(longest_streak_days), 0) INTO longest_streak
  FROM public.user_streaks
  WHERE id = NEW.user_streak_id;
  
  -- Update user_streaks with new counts
  UPDATE public.user_streaks
  SET 
    current_streak_days = current_streak,
    longest_streak_days = GREATEST(longest_streak, current_streak),
    last_checkin_date = NEW.checkin_date
  WHERE id = NEW.user_streak_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_streak_count_trigger
  AFTER INSERT ON public.checkins
  FOR EACH ROW EXECUTE FUNCTION update_streak_count();

-- Function to create notification when someone likes a streak
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

CREATE TRIGGER create_like_notification_trigger
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION create_like_notification();

-- Function to create notification when someone comments on a streak
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

CREATE TRIGGER create_comment_notification_trigger
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION create_comment_notification();

-- Insert some default achievements
INSERT INTO public.achievements (name, description, icon, criteria) VALUES
('First Streak', 'Complete your first streak', '🔥', '{"min_days": 1}'),
('Week Warrior', 'Maintain a streak for 7 days', '⚡', '{"min_days": 7}'),
('Month Master', 'Maintain a streak for 30 days', '🏆', '{"min_days": 30}'),
('Century Club', 'Maintain a streak for 100 days', '💯', '{"min_days": 100}'),
('Social Butterfly', 'Join 10 public streaks', '🦋', '{"min_streaks": 10}'),
('Comment King', 'Leave 50 comments on streaks', '💬', '{"min_comments": 50}'),
('Like Machine', 'Like 100 streaks', '❤️', '{"min_likes": 100}'),
('Group Leader', 'Create a group with 10+ members', '👥', '{"min_group_members": 10}');

-- Insert some default streak templates
INSERT INTO public.streak_templates (name, description, category, suggested_duration, tags, is_popular) VALUES
('Daily Exercise', 'Exercise for at least 30 minutes every day', 'Health', 30, ARRAY['fitness', 'health', 'exercise'], true),
('No Social Media', 'Avoid social media platforms for the day', 'Productivity', 30, ARRAY['productivity', 'digital-detox', 'focus'], true),
('Read Daily', 'Read for at least 30 minutes every day', 'Learning', 365, ARRAY['reading', 'learning', 'education'], true),
('Meditation', 'Meditate for at least 10 minutes daily', 'Wellness', 21, ARRAY['meditation', 'mindfulness', 'wellness'], true),
('No Soda', 'Avoid drinking soda or sugary drinks', 'Health', 60, ARRAY['health', 'nutrition', 'sugar-free'], true),
('Learn Spanish', 'Practice Spanish for at least 15 minutes daily', 'Learning', 90, ARRAY['language', 'spanish', 'learning'], false),
('Daily Gratitude', 'Write down 3 things you are grateful for', 'Wellness', 30, ARRAY['gratitude', 'mindfulness', 'positivity'], false),
('No Phone Before Bed', 'Avoid using phone 1 hour before bedtime', 'Wellness', 30, ARRAY['sleep', 'wellness', 'digital-detox'], false);
