-- Safe migration script - only creates tables that don't exist
-- Run this in your Supabase SQL Editor

-- Check and create streaks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.streaks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check and create user_streaks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_streaks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  streak_id UUID REFERENCES public.streaks(id) ON DELETE CASCADE NOT NULL,
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  last_checkin_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, streak_id)
);

-- Check and create checkins table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.checkins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_streak_id UUID REFERENCES public.user_streaks(id) ON DELETE CASCADE NOT NULL,
  checkin_date DATE NOT NULL,
  notes TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  streak_id UUID REFERENCES public.streaks(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_streak_id, checkin_date)
);

-- Check and create comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  streak_id UUID REFERENCES public.streaks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check and create likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  streak_id UUID REFERENCES public.streaks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(streak_id, user_id)
);

-- Check and create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check and create achievements table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT,
  points INTEGER DEFAULT 0,
  category TEXT,
  criteria JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check and create user_achievements table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS on all tables
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
-- Streaks policies
CREATE POLICY "Public streaks are viewable by everyone" ON public.streaks
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own streaks" ON public.streaks
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create streaks" ON public.streaks
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own streaks" ON public.streaks
  FOR UPDATE USING (auth.uid() = created_by);

-- User streaks policies
CREATE POLICY "Users can view their own user streaks" ON public.user_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own user streaks" ON public.user_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own user streaks" ON public.user_streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- Checkins policies
CREATE POLICY "Users can view their own checkins" ON public.checkins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own checkins" ON public.checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checkins" ON public.checkins
  FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Anyone can view comments on public streaks" ON public.comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.streaks 
      WHERE streaks.id = comments.streak_id 
      AND streaks.is_public = true
    )
  );

CREATE POLICY "Users can create comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Anyone can view likes on public streaks" ON public.likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.streaks 
      WHERE streaks.id = likes.streak_id 
      AND streaks.is_public = true
    )
  );

CREATE POLICY "Users can create likes" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON public.likes
  FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Anyone can view achievements" ON public.achievements
  FOR SELECT USING (true);

-- User achievements policies
CREATE POLICY "Users can view their own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON public.user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_streak_id ON public.user_streaks(streak_id);
CREATE INDEX IF NOT EXISTS idx_checkins_user_id ON public.checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_streak_id ON public.checkins(streak_id);
CREATE INDEX IF NOT EXISTS idx_checkins_date ON public.checkins(checkin_date);
CREATE INDEX IF NOT EXISTS idx_comments_streak_id ON public.comments(streak_id);
CREATE INDEX IF NOT EXISTS idx_likes_streak_id ON public.likes(streak_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);

-- Insert some basic achievements
INSERT INTO public.achievements (name, description, icon, points, category) VALUES
('First Streak', 'Create your first streak', '🎯', 10, 'streak'),
('Streak Starter', 'Create 5 streaks', '🚀', 25, 'streak'),
('Streak Master', 'Create 10 streaks', '👑', 50, 'streak'),
('First Check-in', 'Complete your first check-in', '✅', 5, 'checkin'),
('Consistent', 'Check in 7 days in a row', '🔥', 30, 'checkin'),
('Dedicated', 'Check in 30 days in a row', '💪', 100, 'checkin'),
('Week Warrior', 'Maintain a streak for 7 days', '⚔️', 20, 'length'),
('Month Master', 'Maintain a streak for 30 days', '🏆', 75, 'length'),
('Century Club', 'Maintain a streak for 100 days', '💯', 200, 'length'),
('Year Champion', 'Maintain a streak for 365 days', '👑', 500, 'length')
ON CONFLICT (name) DO NOTHING;
