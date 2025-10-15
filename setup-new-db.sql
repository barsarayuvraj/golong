-- Essential tables for GoLong app
-- Run this in your new Supabase project SQL Editor

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

-- Create indexes for performance
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

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view public streaks" ON public.streaks FOR SELECT USING (is_public = true);
CREATE POLICY "Users can create streaks" ON public.streaks FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own streaks" ON public.streaks FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can view own user_streaks" ON public.user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create user_streaks" ON public.user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user_streaks" ON public.user_streaks FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own checkins" ON public.checkins FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_streaks WHERE id = checkins.user_streak_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create checkins" ON public.checkins FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_streaks WHERE id = checkins.user_streak_id AND user_id = auth.uid())
);

CREATE POLICY "Anyone can view comments on public streaks" ON public.comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.streaks WHERE id = streak_id AND is_public = true)
);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view likes on public streaks" ON public.likes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.streaks WHERE id = streak_id AND is_public = true)
);
CREATE POLICY "Users can like/unlike streaks" ON public.likes FOR ALL USING (auth.uid() = user_id);
