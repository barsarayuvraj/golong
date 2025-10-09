-- Database schema for GoLong app

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
  type TEXT NOT NULL CHECK (type IN ('streak_reminder', 'milestone', 'comment', 'like', 'follow')),
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
