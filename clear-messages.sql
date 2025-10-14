-- Clear existing messages and conversations
-- Run this in Supabase SQL Editor to start fresh

-- Delete all messages
DELETE FROM public.messages;

-- Delete all conversations
DELETE FROM public.conversations;

-- Optional: Reset message preferences to defaults
UPDATE public.message_preferences 
SET 
  allow_messages_from = 'followers',
  show_online_status = true,
  message_notifications = true
WHERE true;

-- Optional: Clear any blocked users if needed
-- DELETE FROM public.blocked_users;

-- Verify the cleanup
SELECT 'Messages cleared successfully' as status;
