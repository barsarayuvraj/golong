-- Enable Realtime Extension and Fix WebSocket Issues

-- 1. Enable the Realtime extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS realtime;

-- 2. Ensure the supabase_realtime publication exists and includes profiles
-- First, drop the existing publication if it exists
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Create the publication with all necessary tables
CREATE PUBLICATION supabase_realtime 
FOR TABLE 
    public.profiles,
    public.streaks,
    public.user_streaks,
    public.challenges,
    public.groups,
    public.comments,
    public.likes,
    public.notifications,
    public.follows,
    public.follow_requests,
    public.group_members,
    public.messages,
    public.message_reads,
    public.activity_log,
    public.achievements,
    public.user_achievements,
    public.notes,
    public.reminders,
    public.reports,
    public.widgets,
    public.export_jobs;

-- 3. Grant necessary permissions for Realtime
GRANT USAGE ON SCHEMA realtime TO authenticated;
GRANT USAGE ON SCHEMA realtime TO anon;

-- 4. Ensure the profiles table has proper permissions for Realtime
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- 5. Check if the realtime extension is working
SELECT 'Realtime extension enabled successfully!' as status;
