-- Remove the duplicate profile that doesn't match any auth user
-- Keep the profile with ID '98b3f6dd-2d0f-412a-89e9-c78b0f8e5f30' (user5)
-- Remove the profile with ID '1d52a6b4-e939-4675-ab61-768fce3ddfb1' (user1)

-- Disable foreign key constraint checking temporarily
SET session_replication_role = replica;

-- First, check if there are any references to the duplicate profile
-- If there are, we need to update them to point to the correct profile

-- Update any remaining references to point to the correct profile
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

-- Now remove the duplicate profile
DELETE FROM public.profiles 
WHERE id = '1d52a6b4-e939-4675-ab61-768fce3ddfb1';

-- Re-enable foreign key constraint checking
SET session_replication_role = DEFAULT;
