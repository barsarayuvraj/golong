-- Disable Email Confirmation for All Users
-- This script marks all existing users as email confirmed

-- Update all users in auth.users to mark their email as confirmed
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- Also ensure the email_confirmed flag is set
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;
