-- Add missing pinned_at column to user_streaks table
ALTER TABLE public.user_streaks ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;
