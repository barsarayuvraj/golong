-- Simple User ID Fix Script
-- This disables foreign key constraints, updates all user IDs, then re-enables them

-- Step 1: Disable foreign key constraint checking
SET session_replication_role = replica;

-- Step 2: Update all user references using a simple approach
-- We'll update each table that references user IDs

-- Update profiles table (this is the main one)
UPDATE public.profiles SET id = '571154bd-3dc4-4cb4-a766-dc24cf58e778' WHERE id = '34352a8f-bb72-4b0a-b185-2570c905fe06';
UPDATE public.profiles SET id = 'bee648d6-e496-4ce5-b8e8-91499f1b8d35' WHERE id = 'ce723af2-82ce-40b1-9edf-4d8bcc2ecc1f';
UPDATE public.profiles SET id = '8e93f5dd-cf13-40f2-80e5-66e914b16554' WHERE id = '6979cfd3-a8e7-4d24-b8cd-859cfa8f66ef';
UPDATE public.profiles SET id = '7d33076e-0197-41c4-9ac0-f8ca39f2d04b' WHERE id = '54af39be-5f35-467e-9c95-5117c260ef85';
UPDATE public.profiles SET id = 'c9865fbb-4874-47cd-ae99-21273f311651' WHERE id = 'f53dcb11-a01e-43fe-a338-3089bc719584';
UPDATE public.profiles SET id = 'ea3fb241-3970-4cde-be02-380d78105811' WHERE id = 'ac38b482-0cd0-4519-bc4b-25d5db90a811';
UPDATE public.profiles SET id = '48398da5-9c40-47ad-b6ec-3c7aa3d74497' WHERE id = '08ec383a-17f7-4de8-a992-80d193145bfe';
UPDATE public.profiles SET id = 'c700441c-5f57-4c3e-addd-ec9315517acd' WHERE id = '4da34292-299b-4242-81d0-8bed137d916f';
UPDATE public.profiles SET id = '3af6c30b-4147-4d21-8c62-106cf1cd6b2a' WHERE id = '631bd1ab-136b-4111-b79b-f599f9a6bc2c';
UPDATE public.profiles SET id = 'ea20e6d8-f8e0-4e25-baf9-449789b4d371' WHERE id = 'fc2b5468-537a-4369-b02c-a60b2ce14739';
UPDATE public.profiles SET id = '840d0180-f629-4593-af42-3cc79003014b' WHERE id = '54b491f5-af34-4a79-9756-259291ab346c';
UPDATE public.profiles SET id = 'a3a841c6-4676-4204-8340-7529c0b13f68' WHERE id = '47979d0a-7dac-4258-af94-617e96a4b62c';
UPDATE public.profiles SET id = '17281be8-7f8f-47e1-badd-d75ff9c95a28' WHERE id = 'd7153299-cdbb-41eb-9242-6697e74d5e61';
UPDATE public.profiles SET id = 'fa94865e-8ded-49d8-9647-6786aa214ac6' WHERE user_id = '1d52a6b4-e939-4675-ab61-768fce3ddfb1';
UPDATE public.profiles SET id = '4631338f-eba7-44f6-9fe6-5fe06e6375f8' WHERE id = '4a1f43bf-9749-46bb-bf71-960f3e541cbf';

-- Update streaks table
UPDATE public.streaks SET created_by = '571154bd-3dc4-4cb4-a766-dc24cf58e778' WHERE created_by = '34352a8f-bb72-4b0a-b185-2570c905fe06';
UPDATE public.streaks SET created_by = 'bee648d6-e496-4ce5-b8e8-91499f1b8d35' WHERE created_by = 'ce723af2-82ce-40b1-9edf-4d8bcc2ecc1f';
UPDATE public.streaks SET created_by = '8e93f5dd-cf13-40f2-80e5-66e914b16554' WHERE created_by = '6979cfd3-a8e7-4d24-b8cd-859cfa8f66ef';
UPDATE public.streaks SET created_by = '7d33076e-0197-41c4-9ac0-f8ca39f2d04b' WHERE created_by = '54af39be-5f35-467e-9c95-5117c260ef85';
UPDATE public.streaks SET created_by = 'c9865fbb-4874-47cd-ae99-21273f311651' WHERE created_by = 'f53dcb11-a01e-43fe-a338-3089bc719584';
UPDATE public.streaks SET created_by = 'ea3fb241-3970-4cde-be02-380d78105811' WHERE created_by = 'ac38b482-0cd0-4519-bc4b-25d5db90a811';
UPDATE public.streaks SET created_by = '48398da5-9c40-47ad-b6ec-3c7aa3d74497' WHERE created_by = '08ec383a-17f7-4de8-a992-80d193145bfe';
UPDATE public.streaks SET created_by = 'c700441c-5f57-4c3e-addd-ec9315517acd' WHERE created_by = '4da34292-299b-4242-81d0-8bed137d916f';
UPDATE public.streaks SET created_by = '3af6c30b-4147-4d21-8c62-106cf1cd6b2a' WHERE created_by = '631bd1ab-136b-4111-b79b-f599f9a6bc2c';
UPDATE public.streaks SET created_by = 'ea20e6d8-f8e0-4e25-baf9-449789b4d371' WHERE created_by = 'fc2b5468-537a-4369-b02c-a60b2ce14739';
UPDATE public.streaks SET created_by = '840d0180-f629-4593-af42-3cc79003014b' WHERE created_by = '54b491f5-af34-4a79-9756-259291ab346c';
UPDATE public.streaks SET created_by = 'a3a841c6-4676-4204-8340-7529c0b13f68' WHERE created_by = '47979d0a-7dac-4258-af94-617e96a4b62c';
UPDATE public.streaks SET created_by = '17281be8-7f8f-47e1-badd-d75ff9c95a28' WHERE created_by = 'd7153299-cdbb-41eb-9242-6697e74d5e61';
UPDATE public.streaks SET created_by = 'fa94865e-8ded-49d8-9647-6786aa214ac6' WHERE created_by = '1d52a6b4-e939-4675-ab61-768fce3ddfb1';
UPDATE public.streaks SET created_by = '4631338f-eba7-44f6-9fe6-5fe06e6375f8' WHERE created_by = '4a1f43bf-9749-46bb-bf71-960f3e541cbf';

-- Update user_streaks table
UPDATE public.user_streaks SET user_id = '571154bd-3dc4-4cb4-a766-dc24cf58e778' WHERE user_id = '34352a8f-bb72-4b0a-b185-2570c905fe06';
UPDATE public.user_streaks SET user_id = 'bee648d6-e496-4ce5-b8e8-91499f1b8d35' WHERE user_id = 'ce723af2-82ce-40b1-9edf-4d8bcc2ecc1f';
UPDATE public.user_streaks SET user_id = '8e93f5dd-cf13-40f2-80e5-66e914b16554' WHERE user_id = '6979cfd3-a8e7-4d24-b8cd-859cfa8f66ef';
UPDATE public.user_streaks SET user_id = '7d33076e-0197-41c4-9ac0-f8ca39f2d04b' WHERE user_id = '54af39be-5f35-467e-9c95-5117c260ef85';
UPDATE public.user_streaks SET user_id = 'c9865fbb-4874-47cd-ae99-21273f311651' WHERE user_id = 'f53dcb11-a01e-43fe-a338-3089bc719584';
UPDATE public.user_streaks SET user_id = 'ea3fb241-3970-4cde-be02-380d78105811' WHERE user_id = 'ac38b482-0cd0-4519-bc4b-25d5db90a811';
UPDATE public.user_streaks SET user_id = '48398da5-9c40-47ad-b6ec-3c7aa3d74497' WHERE user_id = '08ec383a-17f7-4de8-a992-80d193145bfe';
UPDATE public.user_streaks SET user_id = 'c700441c-5f57-4c3e-addd-ec9315517acd' WHERE user_id = '4da34292-299b-4242-81d0-8bed137d916f';
UPDATE public.user_streaks SET user_id = '3af6c30b-4147-4d21-8c62-106cf1cd6b2a' WHERE user_id = '631bd1ab-136b-4111-b79b-f599f9a6bc2c';
UPDATE public.user_streaks SET user_id = 'ea20e6d8-f8e0-4e25-baf9-449789b4d371' WHERE user_id = 'fc2b5468-537a-4369-b02c-a60b2ce14739';
UPDATE public.user_streaks SET user_id = '840d0180-f629-4593-af42-3cc79003014b' WHERE user_id = '54b491f5-af34-4a79-9756-259291ab346c';
UPDATE public.user_streaks SET user_id = 'a3a841c6-4676-4204-8340-7529c0b13f68' WHERE user_id = '47979d0a-7dac-4258-af94-617e96a4b62c';
UPDATE public.user_streaks SET user_id = '17281be8-7f8f-47e1-badd-d75ff9c95a28' WHERE user_id = 'd7153299-cdbb-41eb-9242-6697e74d5e61';
UPDATE public.user_streaks SET user_id = 'fa94865e-8ded-49d8-9647-6786aa214ac6' WHERE user_id = '1d52a6b4-e939-4675-ab61-768fce3ddfb1';
UPDATE public.user_streaks SET user_id = '4631338f-eba7-44f6-9fe6-5fe06e6375f8' WHERE user_id = '4a1f43bf-9749-46bb-bf71-960f3e541cbf';

-- Update challenges table
UPDATE public.challenges SET created_by = '571154bd-3dc4-4cb4-a766-dc24cf58e778' WHERE created_by = '34352a8f-bb72-4b0a-b185-2570c905fe06';
UPDATE public.challenges SET created_by = 'bee648d6-e496-4ce5-b8e8-91499f1b8d35' WHERE created_by = 'ce723af2-82ce-40b1-9edf-4d8bcc2ecc1f';
UPDATE public.challenges SET created_by = '8e93f5dd-cf13-40f2-80e5-66e914b16554' WHERE created_by = '6979cfd3-a8e7-4d24-b8cd-859cfa8f66ef';
UPDATE public.challenges SET created_by = '7d33076e-0197-41c4-9ac0-f8ca39f2d04b' WHERE created_by = '54af39be-5f35-467e-9c95-5117c260ef85';
UPDATE public.challenges SET created_by = 'c9865fbb-4874-47cd-ae99-21273f311651' WHERE created_by = 'f53dcb11-a01e-43fe-a338-3089bc719584';
UPDATE public.challenges SET created_by = 'ea3fb241-3970-4cde-be02-380d78105811' WHERE created_by = 'ac38b482-0cd0-4519-bc4b-25d5db90a811';
UPDATE public.challenges SET created_by = '48398da5-9c40-47ad-b6ec-3c7aa3d74497' WHERE created_by = '08ec383a-17f7-4de8-a992-80d193145bfe';
UPDATE public.challenges SET created_by = 'c700441c-5f57-4c3e-addd-ec9315517acd' WHERE created_by = '4da34292-299b-4242-81d0-8bed137d916f';
UPDATE public.challenges SET created_by = '3af6c30b-4147-4d21-8c62-106cf1cd6b2a' WHERE created_by = '631bd1ab-136b-4111-b79b-f599f9a6bc2c';
UPDATE public.challenges SET created_by = 'ea20e6d8-f8e0-4e25-baf9-449789b4d371' WHERE created_by = 'fc2b5468-537a-4369-b02c-a60b2ce14739';
UPDATE public.challenges SET created_by = '840d0180-f629-4593-af42-3cc79003014b' WHERE created_by = '54b491f5-af34-4a79-9756-259291ab346c';
UPDATE public.challenges SET created_by = 'a3a841c6-4676-4204-8340-7529c0b13f68' WHERE created_by = '47979d0a-7dac-4258-af94-617e96a4b62c';
UPDATE public.challenges SET created_by = '17281be8-7f8f-47e1-badd-d75ff9c95a28' WHERE created_by = 'd7153299-cdbb-41eb-9242-6697e74d5e61';
UPDATE public.challenges SET created_by = 'fa94865e-8ded-49d8-9647-6786aa214ac6' WHERE created_by = '1d52a6b4-e939-4675-ab61-768fce3ddfb1';
UPDATE public.challenges SET created_by = '4631338f-eba7-44f6-9fe6-5fe06e6375f8' WHERE created_by = '4a1f43bf-9749-46bb-bf71-960f3e541cbf';

-- Update groups table
UPDATE public.groups SET created_by = '571154bd-3dc4-4cb4-a766-dc24cf58e778' WHERE created_by = '34352a8f-bb72-4b0a-b185-2570c905fe06';
UPDATE public.groups SET created_by = 'bee648d6-e496-4ce5-b8e8-91499f1b8d35' WHERE created_by = 'ce723af2-82ce-40b1-9edf-4d8bcc2ecc1f';
UPDATE public.groups SET created_by = '8e93f5dd-cf13-40f2-80e5-66e914b16554' WHERE created_by = '6979cfd3-a8e7-4d24-b8cd-859cfa8f66ef';
UPDATE public.groups SET created_by = '7d33076e-0197-41c4-9ac0-f8ca39f2d04b' WHERE created_by = '54af39be-5f35-467e-9c95-5117c260ef85';
UPDATE public.groups SET created_by = 'c9865fbb-4874-47cd-ae99-21273f311651' WHERE created_by = 'f53dcb11-a01e-43fe-a338-3089bc719584';
UPDATE public.groups SET created_by = 'ea3fb241-3970-4cde-be02-380d78105811' WHERE created_by = 'ac38b482-0cd0-4519-bc4b-25d5db90a811';
UPDATE public.groups SET created_by = '48398da5-9c40-47ad-b6ec-3c7aa3d74497' WHERE created_by = '08ec383a-17f7-4de8-a992-80d193145bfe';
UPDATE public.groups SET created_by = 'c700441c-5f57-4c3e-addd-ec9315517acd' WHERE created_by = '4da34292-299b-4242-81d0-8bed137d916f';
UPDATE public.groups SET created_by = '3af6c30b-4147-4d21-8c62-106cf1cd6b2a' WHERE created_by = '631bd1ab-136b-4111-b79b-f599f9a6bc2c';
UPDATE public.groups SET created_by = 'ea20e6d8-f8e0-4e25-baf9-449789b4d371' WHERE created_by = 'fc2b5468-537a-4369-b02c-a60b2ce14739';
UPDATE public.groups SET created_by = '840d0180-f629-4593-af42-3cc79003014b' WHERE created_by = '54b491f5-af34-4a79-9756-259291ab346c';
UPDATE public.groups SET created_by = 'a3a841c6-4676-4204-8340-7529c0b13f68' WHERE created_by = '47979d0a-7dac-4258-af94-617e96a4b62c';
UPDATE public.groups SET created_by = '17281be8-7f8f-47e1-badd-d75ff9c95a28' WHERE created_by = 'd7153299-cdbb-41eb-9242-6697e74d5e61';
UPDATE public.groups SET created_by = 'fa94865e-8ded-49d8-9647-6786aa214ac6' WHERE created_by = '1d52a6b4-e939-4675-ab61-768fce3ddfb1';
UPDATE public.groups SET created_by = '4631338f-eba7-44f6-9fe6-5fe06e6375f8' WHERE created_by = '4a1f43bf-9749-46bb-bf71-960f3e541cbf';

-- Update comments table
UPDATE public.comments SET user_id = '571154bd-3dc4-4cb4-a766-dc24cf58e778' WHERE user_id = '34352a8f-bb72-4b0a-b185-2570c905fe06';
UPDATE public.comments SET user_id = 'bee648d6-e496-4ce5-b8e8-91499f1b8d35' WHERE user_id = 'ce723af2-82ce-40b1-9edf-4d8bcc2ecc1f';
UPDATE public.comments SET user_id = '8e93f5dd-cf13-40f2-80e5-66e914b16554' WHERE user_id = '6979cfd3-a8e7-4d24-b8cd-859cfa8f66ef';
UPDATE public.comments SET user_id = '7d33076e-0197-41c4-9ac0-f8ca39f2d04b' WHERE user_id = '54af39be-5f35-467e-9c95-5117c260ef85';
UPDATE public.comments SET user_id = 'c9865fbb-4874-47cd-ae99-21273f311651' WHERE user_id = 'f53dcb11-a01e-43fe-a338-3089bc719584';
UPDATE public.comments SET user_id = 'ea3fb241-3970-4cde-be02-380d78105811' WHERE user_id = 'ac38b482-0cd0-4519-bc4b-25d5db90a811';
UPDATE public.comments SET user_id = '48398da5-9c40-47ad-b6ec-3c7aa3d74497' WHERE user_id = '08ec383a-17f7-4de8-a992-80d193145bfe';
UPDATE public.comments SET user_id = 'c700441c-5f57-4c3e-addd-ec9315517acd' WHERE user_id = '4da34292-299b-4242-81d0-8bed137d916f';
UPDATE public.comments SET user_id = '3af6c30b-4147-4d21-8c62-106cf1cd6b2a' WHERE user_id = '631bd1ab-136b-4111-b79b-f599f9a6bc2c';
UPDATE public.comments SET user_id = 'ea20e6d8-f8e0-4e25-baf9-449789b4d371' WHERE user_id = 'fc2b5468-537a-4369-b02c-a60b2ce14739';
UPDATE public.comments SET user_id = '840d0180-f629-4593-af42-3cc79003014b' WHERE user_id = '54b491f5-af34-4a79-9756-259291ab346c';
UPDATE public.comments SET user_id = 'a3a841c6-4676-4204-8340-7529c0b13f68' WHERE user_id = '47979d0a-7dac-4258-af94-617e96a4b62c';
UPDATE public.comments SET user_id = '17281be8-7f8f-47e1-badd-d75ff9c95a28' WHERE user_id = 'd7153299-cdbb-41eb-9242-6697e74d5e61';
UPDATE public.comments SET user_id = 'fa94865e-8ded-49d8-9647-6786aa214ac6' WHERE user_id = '1d52a6b4-e939-4675-ab61-768fce3ddfb1';
UPDATE public.comments SET user_id = '4631338f-eba7-44f6-9fe6-5fe06e6375f8' WHERE user_id = '4a1f43bf-9749-46bb-bf71-960f3e541cbf';

-- Update likes table
UPDATE public.likes SET user_id = '571154bd-3dc4-4cb4-a766-dc24cf58e778' WHERE user_id = '34352a8f-bb72-4b0a-b185-2570c905fe06';
UPDATE public.likes SET user_id = 'bee648d6-e496-4ce5-b8e8-91499f1b8d35' WHERE user_id = 'ce723af2-82ce-40b1-9edf-4d8bcc2ecc1f';
UPDATE public.likes SET user_id = '8e93f5dd-cf13-40f2-80e5-66e914b16554' WHERE user_id = '6979cfd3-a8e7-4d24-b8cd-859cfa8f66ef';
UPDATE public.likes SET user_id = '7d33076e-0197-41c4-9ac0-f8ca39f2d04b' WHERE user_id = '54af39be-5f35-467e-9c95-5117c260ef85';
UPDATE public.likes SET user_id = 'c9865fbb-4874-47cd-ae99-21273f311651' WHERE user_id = 'f53dcb11-a01e-43fe-a338-3089bc719584';
UPDATE public.likes SET user_id = 'ea3fb241-3970-4cde-be02-380d78105811' WHERE user_id = 'ac38b482-0cd0-4519-bc4b-25d5db90a811';
UPDATE public.likes SET user_id = '48398da5-9c40-47ad-b6ec-3c7aa3d74497' WHERE user_id = '08ec383a-17f7-4de8-a992-80d193145bfe';
UPDATE public.likes SET user_id = 'c700441c-5f57-4c3e-addd-ec9315517acd' WHERE user_id = '4da34292-299b-4242-81d0-8bed137d916f';
UPDATE public.likes SET user_id = '3af6c30b-4147-4d21-8c62-106cf1cd6b2a' WHERE user_id = '631bd1ab-136b-4111-b79b-f599f9a6bc2c';
UPDATE public.likes SET user_id = 'ea20e6d8-f8e0-4e25-baf9-449789b4d371' WHERE user_id = 'fc2b5468-537a-4369-b02c-a60b2ce14739';
UPDATE public.likes SET user_id = '840d0180-f629-4593-af42-3cc79003014b' WHERE user_id = '54b491f5-af34-4a79-9756-259291ab346c';
UPDATE public.likes SET user_id = 'a3a841c6-4676-4204-8340-7529c0b13f68' WHERE user_id = '47979d0a-7dac-4258-af94-617e96a4b62c';
UPDATE public.likes SET user_id = '17281be8-7f8f-47e1-badd-d75ff9c95a28' WHERE user_id = 'd7153299-cdbb-41eb-9242-6697e74d5e61';
UPDATE public.likes SET user_id = 'fa94865e-8ded-49d8-9647-6786aa214ac6' WHERE user_id = '1d52a6b4-e939-4675-ab61-768fce3ddfb1';
UPDATE public.likes SET user_id = '4631338f-eba7-44f6-9fe6-5fe06e6375f8' WHERE user_id = '4a1f43bf-9749-46bb-bf71-960f3e541cbf';

-- Step 3: Re-enable foreign key constraint checking
SET session_replication_role = DEFAULT;
