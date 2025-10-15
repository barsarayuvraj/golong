-- Fix the remaining user ID mismatch for anil.testuser5@gmail.com
-- This user has auth ID: 98b3f6dd-2d0f-412a-89e9-c78b0f8e5f30
-- But profile still has old ID: 1d52a6b4-e939-4675-ab61-768fce3ddfb1

-- Disable foreign key constraint checking temporarily
SET session_replication_role = replica;

-- Update the profile ID to match the auth user ID
UPDATE public.profiles 
SET id = '98b3f6dd-2d0f-412a-89e9-c78b0f8e5f30' 
WHERE id = '1d52a6b4-e939-4675-ab61-768fce3ddfb1';

-- Update all references to this user in other tables
UPDATE public.user_streaks 
SET user_id = '98b3f6dd-2d0f-412a-89e9-c78b0f8e5f30' 
WHERE user_id = '1d52a6b4-e939-4675-ab61-768fce3ddfb1';

UPDATE public.streaks 
SET created_by = '98b3f6dd-2d0f-412a-89e9-c78b0f8e5f30' 
WHERE created_by = '1d52a6b4-e939-4675-ab61-768fce3ddfb1';

UPDATE public.challenges 
SET created_by = '98b3f6dd-2d0f-412a-89e9-c78b0f8e5f30' 
WHERE created_by = '1d52a6b4-e939-4675-ab61-768fce3ddfb1';

UPDATE public.groups 
SET created_by = '98b3f6dd-2d0f-412a-89e9-c78b0f8e5f30' 
WHERE created_by = '1d52a6b4-e939-4675-ab61-768fce3ddfb1';

UPDATE public.comments 
SET user_id = '98b3f6dd-2d0f-412a-89e9-c78b0f8e5f30' 
WHERE user_id = '1d52a6b4-e939-4675-ab61-768fce3ddfb1';

UPDATE public.likes 
SET user_id = '98b3f6dd-2d0f-412a-89e9-c78b0f8e5f30' 
WHERE user_id = '1d52a6b4-e939-4675-ab61-768fce3ddfb1';

UPDATE public.notifications 
SET user_id = '98b3f6dd-2d0f-412a-89e9-c78b0f8e5f30' 
WHERE user_id = '1d52a6b4-e939-4675-ab61-768fce3ddfb1';

UPDATE public.follows 
SET follower_id = '98b3f6dd-2d0f-412a-89e9-c78b0f8e5f30' 
WHERE follower_id = '1d52a6b4-e939-4675-ab61-768fce3ddfb1';

UPDATE public.follows 
SET following_id = '98b3f6dd-2d0f-412a-89e9-c78b0f8e5f30' 
WHERE following_id = '1d52a6b4-e939-4675-ab61-768fce3ddfb1';

UPDATE public.follow_requests 
SET requester_id = '98b3f6dd-2d0f-412a-89e9-c78b0f8e5f30' 
WHERE requester_id = '1d52a6b4-e939-4675-ab61-768fce3ddfb1';

UPDATE public.follow_requests 
SET target_id = '98b3f6dd-2d0f-412a-89e9-c78b0f8e5f30' 
WHERE target_id = '1d52a6b4-e939-4675-ab61-768fce3ddfb1';

-- Re-enable foreign key constraint checking
SET session_replication_role = DEFAULT;
