-- Complete User ID Fix Script - Update all remaining user references
-- This script updates all the missing user ID mappings

-- Disable foreign key constraint checking temporarily
SET session_replication_role = replica;

-- Update the remaining user references that were missing from the previous script

-- Update profiles table for missing users
UPDATE public.profiles SET id = 'af05ef53-ea7b-484e-897b-fcd770b18681' WHERE id = 'c2644465-34d7-4281-bec3-45b19a39f9f7';
UPDATE public.profiles SET id = '98b3f6dd-2d0f-412a-89e9-c78b0f8e5f30' WHERE id = 'f77b6422-5f46-4cca-8c74-a7174d975eaa';
UPDATE public.profiles SET id = '73df6f2a-eef0-4b62-81bb-a4d78e5c121b' WHERE id = 'e48e5347-c481-4bad-98d3-6efe7b1310dd';

-- Update streaks table for missing users
UPDATE public.streaks SET created_by = 'af05ef53-ea7b-484e-897b-fcd770b18681' WHERE created_by = 'c2644465-34d7-4281-bec3-45b19a39f9f7';
UPDATE public.streaks SET created_by = '98b3f6dd-2d0f-412a-89e9-c78b0f8e5f30' WHERE created_by = 'f77b6422-5f46-4cca-8c74-a7174d975eaa';
UPDATE public.streaks SET created_by = '73df6f2a-eef0-4b62-81bb-a4d78e5c121b' WHERE created_by = 'e48e5347-c481-4bad-98d3-6efe7b1310dd';

-- Update user_streaks table for missing users
UPDATE public.user_streaks SET user_id = 'af05ef53-ea7b-484e-897b-fcd770b18681' WHERE user_id = 'c2644465-34d7-4281-bec3-45b19a39f9f7';
UPDATE public.user_streaks SET user_id = '98b3f6dd-2d0f-412a-89e9-c78b0f8e5f30' WHERE user_id = 'f77b6422-5f46-4cca-8c74-a7174d975eaa';
UPDATE public.user_streaks SET user_id = '73df6f2a-eef0-4b62-81bb-a4d78e5c121b' WHERE user_id = 'e48e5347-c481-4bad-98d3-6efe7b1310dd';

-- Update challenges table for missing users
UPDATE public.challenges SET created_by = 'af05ef53-ea7b-484e-897b-fcd770b18681' WHERE created_by = 'c2644465-34d7-4281-bec3-45b19a39f9f7';
UPDATE public.challenges SET created_by = '98b3f6dd-2d0f-412a-89e9-c78b0f8e5f30' WHERE created_by = 'f77b6422-5f46-4cca-8c74-a7174d975eaa';
UPDATE public.challenges SET created_by = '73df6f2a-eef0-4b62-81bb-a4d78e5c121b' WHERE created_by = 'e48e5347-c481-4bad-98d3-6efe7b1310dd';

-- Update groups table for missing users
UPDATE public.groups SET created_by = 'af05ef53-ea7b-484e-897b-fcd770b18681' WHERE created_by = 'c2644465-34d7-4281-bec3-45b19a39f9f7';
UPDATE public.groups SET created_by = '98b3f6dd-2d0f-412a-89e9-c78b0f8e5f30' WHERE created_by = 'f77b6422-5f46-4cca-8c74-a7174d975eaa';
UPDATE public.groups SET created_by = '73df6f2a-eef0-4b62-81bb-a4d78e5c121b' WHERE created_by = 'e48e5347-c481-4bad-98d3-6efe7b1310dd';

-- Update comments table for missing users
UPDATE public.comments SET user_id = 'af05ef53-ea7b-484e-897b-fcd770b18681' WHERE user_id = 'c2644465-34d7-4281-bec3-45b19a39f9f7';
UPDATE public.comments SET user_id = '98b3f6dd-2d0f-412a-89e9-c78b0f8e5f30' WHERE user_id = 'f77b6422-5f46-4cca-8c74-a7174d975eaa';
UPDATE public.comments SET user_id = '73df6f2a-eef0-4b62-81bb-a4d78e5c121b' WHERE user_id = 'e48e5347-c481-4bad-98d3-6efe7b1310dd';

-- Update likes table for missing users
UPDATE public.likes SET user_id = 'af05ef53-ea7b-484e-897b-fcd770b18681' WHERE user_id = 'c2644465-34d7-4281-bec3-45b19a39f9f7';
UPDATE public.likes SET user_id = '98b3f6dd-2d0f-412a-89e9-c78b0f8e5f30' WHERE user_id = 'f77b6422-5f46-4cca-8c74-a7174d975eaa';
UPDATE public.likes SET user_id = '73df6f2a-eef0-4b62-81bb-a4d78e5c121b' WHERE user_id = 'e48e5347-c481-4bad-98d3-6efe7b1310dd';

-- Update other tables that reference users
-- Update notifications
UPDATE public.notifications SET user_id = '571154bd-3dc4-4cb4-a766-dc24cf58e778' WHERE user_id = '34352a8f-bb72-4b0a-b185-2570c905fe06';
UPDATE public.notifications SET user_id = 'bee648d6-e496-4ce5-b8e8-91499f1b8d35' WHERE user_id = 'ce723af2-82ce-40b1-9edf-4d8bcc2ecc1f';
UPDATE public.notifications SET user_id = '8e93f5dd-cf13-40f2-80e5-66e914b16554' WHERE user_id = '6979cfd3-a8e7-4d24-b8cd-859cfa8f66ef';
UPDATE public.notifications SET user_id = '7d33076e-0197-41c4-9ac0-f8ca39f2d04b' WHERE user_id = '54af39be-5f35-467e-9c95-5117c260ef85';
UPDATE public.notifications SET user_id = 'c9865fbb-4874-47cd-ae99-21273f311651' WHERE user_id = 'f53dcb11-a01e-43fe-a338-3089bc719584';
UPDATE public.notifications SET user_id = 'ea3fb241-3970-4cde-be02-380d78105811' WHERE user_id = 'ac38b482-0cd0-4519-bc4b-25d5db90a811';
UPDATE public.notifications SET user_id = '48398da5-9c40-47ad-b6ec-3c7aa3d74497' WHERE user_id = '08ec383a-17f7-4de8-a992-80d193145bfe';
UPDATE public.notifications SET user_id = 'c700441c-5f57-4c3e-addd-ec9315517acd' WHERE user_id = '4da34292-299b-4242-81d0-8bed137d916f';
UPDATE public.notifications SET user_id = '3af6c30b-4147-4d21-8c62-106cf1cd6b2a' WHERE user_id = '631bd1ab-136b-4111-b79b-f599f9a6bc2c';
UPDATE public.notifications SET user_id = 'ea20e6d8-f8e0-4e25-baf9-449789b4d371' WHERE user_id = 'fc2b5468-537a-4369-b02c-a60b2ce14739';
UPDATE public.notifications SET user_id = '840d0180-f629-4593-af42-3cc79003014b' WHERE user_id = '54b491f5-af34-4a79-9756-259291ab346c';
UPDATE public.notifications SET user_id = 'a3a841c6-4676-4204-8340-7529c0b13f68' WHERE user_id = '47979d0a-7dac-4258-af94-617e96a4b62c';
UPDATE public.notifications SET user_id = '17281be8-7f8f-47e1-badd-d75ff9c95a28' WHERE user_id = 'd7153299-cdbb-41eb-9242-6697e74d5e61';
UPDATE public.notifications SET user_id = 'fa94865e-8ded-49d8-9647-6786aa214ac6' WHERE user_id = '1d52a6b4-e939-4675-ab61-768fce3ddfb1';
UPDATE public.notifications SET user_id = '4631338f-eba7-44f6-9fe6-5fe06e6375f8' WHERE user_id = '4a1f43bf-9749-46bb-bf71-960f3e541cbf';
UPDATE public.notifications SET user_id = 'af05ef53-ea7b-484e-897b-fcd770b18681' WHERE user_id = 'c2644465-34d7-4281-bec3-45b19a39f9f7';
UPDATE public.notifications SET user_id = '98b3f6dd-2d0f-412a-89e9-c78b0f8e5f30' WHERE user_id = 'f77b6422-5f46-4cca-8c74-a7174d975eaa';
UPDATE public.notifications SET user_id = '73df6f2a-eef0-4b62-81bb-a4d78e5c121b' WHERE user_id = 'e48e5347-c481-4bad-98d3-6efe7b1310dd';

-- Update follows table
UPDATE public.follows SET follower_id = '571154bd-3dc4-4cb4-a766-dc24cf58e778' WHERE follower_id = '34352a8f-bb72-4b0a-b185-2570c905fe06';
UPDATE public.follows SET following_id = '571154bd-3dc4-4cb4-a766-dc24cf58e778' WHERE following_id = '34352a8f-bb72-4b0a-b185-2570c905fe06';
UPDATE public.follows SET follower_id = 'bee648d6-e496-4ce5-b8e8-91499f1b8d35' WHERE follower_id = 'ce723af2-82ce-40b1-9edf-4d8bcc2ecc1f';
UPDATE public.follows SET following_id = 'bee648d6-e496-4ce5-b8e8-91499f1b8d35' WHERE following_id = 'ce723af2-82ce-40b1-9edf-4d8bcc2ecc1f';
UPDATE public.follows SET follower_id = '8e93f5dd-cf13-40f2-80e5-66e914b16554' WHERE follower_id = '6979cfd3-a8e7-4d24-b8cd-859cfa8f66ef';
UPDATE public.follows SET following_id = '8e93f5dd-cf13-40f2-80e5-66e914b16554' WHERE following_id = '6979cfd3-a8e7-4d24-b8cd-859cfa8f66ef';
UPDATE public.follows SET follower_id = '7d33076e-0197-41c4-9ac0-f8ca39f2d04b' WHERE follower_id = '54af39be-5f35-467e-9c95-5117c260ef85';
UPDATE public.follows SET following_id = '7d33076e-0197-41c4-9ac0-f8ca39f2d04b' WHERE following_id = '54af39be-5f35-467e-9c95-5117c260ef85';
UPDATE public.follows SET follower_id = 'c9865fbb-4874-47cd-ae99-21273f311651' WHERE follower_id = 'f53dcb11-a01e-43fe-a338-3089bc719584';
UPDATE public.follows SET following_id = 'c9865fbb-4874-47cd-ae99-21273f311651' WHERE following_id = 'f53dcb11-a01e-43fe-a338-3089bc719584';
UPDATE public.follows SET follower_id = 'ea3fb241-3970-4cde-be02-380d78105811' WHERE follower_id = 'ac38b482-0cd0-4519-bc4b-25d5db90a811';
UPDATE public.follows SET following_id = 'ea3fb241-3970-4cde-be02-380d78105811' WHERE following_id = 'ac38b482-0cd0-4519-bc4b-25d5db90a811';
UPDATE public.follows SET follower_id = '48398da5-9c40-47ad-b6ec-3c7aa3d74497' WHERE follower_id = '08ec383a-17f7-4de8-a992-80d193145bfe';
UPDATE public.follows SET following_id = '48398da5-9c40-47ad-b6ec-3c7aa3d74497' WHERE following_id = '08ec383a-17f7-4de8-a992-80d193145bfe';
UPDATE public.follows SET follower_id = 'c700441c-5f57-4c3e-addd-ec9315517acd' WHERE follower_id = '4da34292-299b-4242-81d0-8bed137d916f';
UPDATE public.follows SET following_id = 'c700441c-5f57-4c3e-addd-ec9315517acd' WHERE following_id = '4da34292-299b-4242-81d0-8bed137d916f';
UPDATE public.follows SET follower_id = '3af6c30b-4147-4d21-8c62-106cf1cd6b2a' WHERE follower_id = '631bd1ab-136b-4111-b79b-f599f9a6bc2c';
UPDATE public.follows SET following_id = '3af6c30b-4147-4d21-8c62-106cf1cd6b2a' WHERE following_id = '631bd1ab-136b-4111-b79b-f599f9a6bc2c';
UPDATE public.follows SET follower_id = 'ea20e6d8-f8e0-4e25-baf9-449789b4d371' WHERE follower_id = 'fc2b5468-537a-4369-b02c-a60b2ce14739';
UPDATE public.follows SET following_id = 'ea20e6d8-f8e0-4e25-baf9-449789b4d371' WHERE following_id = 'fc2b5468-537a-4369-b02c-a60b2ce14739';
UPDATE public.follows SET follower_id = '840d0180-f629-4593-af42-3cc79003014b' WHERE follower_id = '54b491f5-af34-4a79-9756-259291ab346c';
UPDATE public.follows SET following_id = '840d0180-f629-4593-af42-3cc79003014b' WHERE following_id = '54b491f5-af34-4a79-9756-259291ab346c';
UPDATE public.follows SET follower_id = 'a3a841c6-4676-4204-8340-7529c0b13f68' WHERE follower_id = '47979d0a-7dac-4258-af94-617e96a4b62c';
UPDATE public.follows SET following_id = 'a3a841c6-4676-4204-8340-7529c0b13f68' WHERE following_id = '47979d0a-7dac-4258-af94-617e96a4b62c';
UPDATE public.follows SET follower_id = '17281be8-7f8f-47e1-badd-d75ff9c95a28' WHERE follower_id = 'd7153299-cdbb-41eb-9242-6697e74d5e61';
UPDATE public.follows SET following_id = '17281be8-7f8f-47e1-badd-d75ff9c95a28' WHERE following_id = 'd7153299-cdbb-41eb-9242-6697e74d5e61';
UPDATE public.follows SET follower_id = 'fa94865e-8ded-49d8-9647-6786aa214ac6' WHERE follower_id = '1d52a6b4-e939-4675-ab61-768fce3ddfb1';
UPDATE public.follows SET following_id = 'fa94865e-8ded-49d8-9647-6786aa214ac6' WHERE following_id = '1d52a6b4-e939-4675-ab61-768fce3ddfb1';
UPDATE public.follows SET follower_id = '4631338f-eba7-44f6-9fe6-5fe06e6375f8' WHERE follower_id = '4a1f43bf-9749-46bb-bf71-960f3e541cbf';
UPDATE public.follows SET following_id = '4631338f-eba7-44f6-9fe6-5fe06e6375f8' WHERE following_id = '4a1f43bf-9749-46bb-bf71-960f3e541cbf';
UPDATE public.follows SET follower_id = 'af05ef53-ea7b-484e-897b-fcd770b18681' WHERE follower_id = 'c2644465-34d7-4281-bec3-45b19a39f9f7';
UPDATE public.follows SET following_id = 'af05ef53-ea7b-484e-897b-fcd770b18681' WHERE following_id = 'c2644465-34d7-4281-bec3-45b19a39f9f7';
UPDATE public.follows SET follower_id = '98b3f6dd-2d0f-412a-89e9-c78b0f8e5f30' WHERE follower_id = 'f77b6422-5f46-4cca-8c74-a7174d975eaa';
UPDATE public.follows SET following_id = '98b3f6dd-2d0f-412a-89e9-c78b0f8e5f30' WHERE following_id = 'f77b6422-5f46-4cca-8c74-a7174d975eaa';
UPDATE public.follows SET follower_id = '73df6f2a-eef0-4b62-81bb-a4d78e5c121b' WHERE follower_id = 'e48e5347-c481-4bad-98d3-6efe7b1310dd';
UPDATE public.follows SET following_id = '73df6f2a-eef0-4b62-81bb-a4d78e5c121b' WHERE following_id = 'e48e5347-c481-4bad-98d3-6efe7b1310dd';

-- Re-enable foreign key constraint checking
SET session_replication_role = DEFAULT;
