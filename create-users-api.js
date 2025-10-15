// User Creation API Script
// Run this script to create users in your target database

import { createClient } from '@supabase/supabase-js';

const TARGET_SUPABASE_URL = 'https://pepgldetpvaiwawmmxox.supabase.co';
const TARGET_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcGdsZGV0cHZhaXdhd21teG94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM3Mzk1NSwiZXhwIjoyMDc1OTQ5OTU1fQ.qg308rqUcyaTsa0KQsEejffhhv4bhxmBQWmZP4iyWss';

const targetClient = createClient(TARGET_SUPABASE_URL, TARGET_SERVICE_ROLE_KEY);

const userCreationData = [
  {
    "email": "barsarayuvraj@gmail.com",
    "profile_id": "34352a8f-bb72-4b0a-b185-2570c905fe06",
    "temporary_password": "TempPass05fe06!",
    "user_metadata": {
      "username": "user_34352a8f",
      "display_name": "User",
      "avatar_url": null,
      "bio": null,
      "is_private": false
    }
  },
  {
    "email": "yuvrajbar@gmail.com",
    "profile_id": "ce723af2-82ce-40b1-9edf-4d8bcc2ecc1f",
    "temporary_password": "TempPass2ecc1f!",
    "user_metadata": {
      "username": "testuser5",
      "display_name": "testuser5",
      "avatar_url": null,
      "bio": null,
      "is_private": false
    }
  },
  {
    "email": "yuvrajbarsara@gmail.com",
    "profile_id": "6979cfd3-a8e7-4d24-b8cd-859cfa8f66ef",
    "temporary_password": "TempPass8f66ef!",
    "user_metadata": {
      "username": "testuser7",
      "display_name": "testuser7",
      "avatar_url": null,
      "bio": null,
      "is_private": false
    }
  },
  {
    "email": "barsarayuvraj27@gmail.com",
    "profile_id": "54af39be-5f35-467e-9c95-5117c260ef85",
    "temporary_password": "TempPass60ef85!",
    "user_metadata": {
      "username": "testuser9",
      "display_name": "testuser9",
      "avatar_url": null,
      "bio": null,
      "is_private": false
    }
  },
  {
    "email": "barsarayuvraj20@gmail.com",
    "profile_id": "f53dcb11-a01e-43fe-a338-3089bc719584",
    "temporary_password": "TempPass719584!",
    "user_metadata": {
      "username": "testuser10",
      "display_name": "testuser10",
      "avatar_url": null,
      "bio": null,
      "is_private": false
    }
  },
  {
    "email": "yuvrajbarsra250@gmail.com",
    "profile_id": "ac38b482-0cd0-4519-bc4b-25d5db90a811",
    "temporary_password": "TempPass90a811!",
    "user_metadata": {
      "username": "testuser11",
      "display_name": "testuser11",
      "avatar_url": null,
      "bio": null,
      "is_private": false
    }
  },
  {
    "email": "testuser123@gmail.com",
    "profile_id": "08ec383a-17f7-4de8-a992-80d193145bfe",
    "temporary_password": "TempPass145bfe!",
    "user_metadata": {
      "username": "testuser123",
      "display_name": "testuser123",
      "avatar_url": null,
      "bio": null,
      "is_private": false
    }
  },
  {
    "email": "testuser20@gmail.com",
    "profile_id": "4da34292-299b-4242-81d0-8bed137d916f",
    "temporary_password": "TempPass7d916f!",
    "user_metadata": {
      "username": "testuser20",
      "display_name": "testuser20",
      "avatar_url": null,
      "bio": null,
      "is_private": false
    }
  },
  {
    "email": "anil.964108994@gmail.com",
    "profile_id": "631bd1ab-136b-4111-b79b-f599f9a6bc2c",
    "temporary_password": "TempPassa6bc2c!",
    "user_metadata": {
      "username": "user_631bd1ab",
      "display_name": "User",
      "avatar_url": null,
      "bio": null,
      "is_private": false
    }
  },
  {
    "email": "anil.testuser4@gmail.com",
    "profile_id": "fc2b5468-537a-4369-b02c-a60b2ce14739",
    "temporary_password": "TempPasse14739!",
    "user_metadata": {
      "username": "user4",
      "display_name": "user4",
      "avatar_url": null,
      "bio": null,
      "is_private": false
    }
  },
  {
    "email": "anil.testuser6@gmail.com",
    "profile_id": "c2644465-34d7-4281-bec3-45b19a39f9f7",
    "temporary_password": "TempPass39f9f7!",
    "user_metadata": {
      "username": "user6",
      "display_name": "user6",
      "avatar_url": null,
      "bio": null,
      "is_private": false
    }
  },
  {
    "email": "anil@gmail.com",
    "profile_id": "54b491f5-af34-4a79-9756-259291ab346c",
    "temporary_password": "TempPassab346c!",
    "user_metadata": {
      "username": "Anil",
      "display_name": "Anil",
      "avatar_url": null,
      "bio": null,
      "is_private": false
    }
  },
  {
    "email": "yuvraj123@gmail.com",
    "profile_id": "47979d0a-7dac-4258-af94-617e96a4b62c",
    "temporary_password": "TempPassa4b62c!",
    "user_metadata": {
      "username": "yuvraj",
      "display_name": "yuvraj",
      "avatar_url": "/avatars/default-4.svg",
      "bio": null,
      "is_private": false
    }
  },
  {
    "email": "anil.testuser2@gmail.com",
    "profile_id": "e48e5347-c481-4bad-98d3-6efe7b1310dd",
    "temporary_password": "TempPass1310dd!",
    "user_metadata": {
      "username": "user2",
      "display_name": "user2",
      "avatar_url": null,
      "bio": "",
      "is_private": true
    }
  },
  {
    "email": "anil.testuser3@gmail.com",
    "profile_id": "d7153299-cdbb-41eb-9242-6697e74d5e61",
    "temporary_password": "TempPass4d5e61!",
    "user_metadata": {
      "username": "user3",
      "display_name": "user3",
      "avatar_url": null,
      "bio": "",
      "is_private": true
    }
  },
  {
    "email": "anil.testuser@gmail.com",
    "profile_id": "1d52a6b4-e939-4675-ab61-768fce3ddfb1",
    "temporary_password": "TempPass3ddfb1!",
    "user_metadata": {
      "username": "user1",
      "display_name": "user1",
      "avatar_url": null,
      "bio": "",
      "is_private": true
    }
  },
  {
    "email": "anil.testuser5@gmail.com",
    "profile_id": "f77b6422-5f46-4cca-8c74-a7174d975eaa",
    "temporary_password": "TempPass975eaa!",
    "user_metadata": {
      "username": "user5",
      "display_name": "user5",
      "avatar_url": null,
      "bio": "",
      "is_private": true
    }
  },
  {
    "email": "barsarayuvraj92@gmail.com",
    "profile_id": "4a1f43bf-9749-46bb-bf71-960f3e541cbf",
    "temporary_password": "TempPass541cbf!",
    "user_metadata": {
      "username": "testuser2",
      "display_name": "testuser2",
      "avatar_url": "/avatars/default-1.svg",
      "bio": "",
      "is_private": true
    }
  }
];

async function createUsers() {
  console.log('Creating users in target database...');
  
  for (const userData of userCreationData) {
    try {
      console.log(`Creating user: ${userData.email}`);
      
      const { data, error } = await targetClient.auth.admin.createUser({
        email: userData.email,
        password: userData.temporary_password,
        email_confirm: true,
        user_metadata: userData.user_metadata
      });
      
      if (error) {
        console.log(`❌ Error creating user ${userData.email}:`, error.message);
      } else {
        console.log(`✅ Created user: ${userData.email} (ID: ${data.user.id})`);
        
        // Verify the user ID matches the profile ID
        if (data.user.id !== userData.profile_id) {
          console.log(`⚠️  WARNING: User ID mismatch! Expected: ${userData.profile_id}, Got: ${data.user.id}`);
        }
      }
      
      // Small delay between creations
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (err) {
      console.log(`❌ Exception creating user ${userData.email}:`, err.message);
    }
  }
  
  console.log('User creation completed!');
}

createUsers().catch(console.error);
