-- Fix notifications table constraint to include follow_request type
-- This script updates the check constraint to allow follow_request notifications

-- Drop the existing constraint
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the updated constraint with follow_request type
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('streak_reminder', 'milestone', 'comment', 'like', 'follow', 'follow_request', 'challenge', 'group_invite'));
