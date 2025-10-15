-- Fix missing RLS policy for user_streaks table
-- This should resolve the 500 error when creating streaks

-- Enable RLS on user_streaks table (if not already enabled)
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Create INSERT policy for user_streaks table
-- This allows users to insert their own user_streak records
CREATE POLICY "Users can create user streaks" ON public.user_streaks
FOR INSERT 
TO public 
WITH CHECK (auth.uid() = user_id);

-- Create SELECT policy for user_streaks table
-- This allows users to view their own user_streak records
CREATE POLICY "Users can view own user streaks" ON public.user_streaks
FOR SELECT 
TO public 
USING (auth.uid() = user_id);

-- Create UPDATE policy for user_streaks table
-- This allows users to update their own user_streak records
CREATE POLICY "Users can update own user streaks" ON public.user_streaks
FOR UPDATE 
TO public 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'user_streaks' 
ORDER BY tablename, policyname;
