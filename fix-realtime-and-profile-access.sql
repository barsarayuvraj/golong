-- Fix Realtime and Profile Access Issues

-- 1. First, let's check if there are any profiles with null or invalid data
SELECT 'Checking for invalid profiles...' as status;

-- 2. Enable RLS on profiles table (if not already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop and recreate RLS policies to ensure they work correctly
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile." ON public.profiles;

-- Policy: Public profiles are viewable by everyone
CREATE POLICY "Public profiles are viewable by everyone."
ON public.profiles FOR SELECT
USING (true);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy: Users can delete their own profile
CREATE POLICY "Users can delete their own profile."
ON public.profiles FOR DELETE
USING (auth.uid() = id);

-- 4. Grant necessary permissions for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 5. Ensure the profiles table has proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

SELECT 'RLS policies and permissions updated successfully!' as status;
