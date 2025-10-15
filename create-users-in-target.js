#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Database configurations
const SOURCE_SUPABASE_URL = 'https://gzhccauxdtboxrurwogk.supabase.co';
const SOURCE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6aGNjYXV4ZHRib3hydXJ3b2drIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1NDg5MiwiZXhwIjoyMDc1NTMwODkyfQ.mJLR6mNEMW2k2JryXdbKIO5qwTiDvK-is5j6oPMPUBk';

const TARGET_SUPABASE_URL = 'https://pepgldetpvaiwawmmxox.supabase.co';
const TARGET_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcGdsZGV0cHZhaXdhd21teG94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM3Mzk1NSwiZXhwIjoyMDc1OTQ5OTU1fQ.qg308rqUcyaTsa0KQsEejffhhv4bhxmBQWmZP4iyWss';

// Initialize clients
const sourceClient = createClient(SOURCE_SUPABASE_URL, SOURCE_SERVICE_ROLE_KEY);
const targetClient = createClient(TARGET_SUPABASE_URL, TARGET_SERVICE_ROLE_KEY);

async function createUsersInTarget() {
  console.log('👥 Creating Users in Target Database');
  console.log('=' .repeat(60));
  
  try {
    // Get all profiles from source
    console.log('📋 Fetching user profiles from source database...');
    const { data: profiles, error: profilesError } = await sourceClient
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.log('❌ Error fetching profiles:', profilesError.message);
      return;
    }
    
    console.log(`✅ Found ${profiles.length} user profiles`);
    
    // Get auth users from source
    console.log('\n📋 Fetching auth users from source database...');
    const { data: authUsers, error: authError } = await sourceClient.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Error fetching auth users:', authError.message);
      console.log('   This might be due to permissions - you may need to do this manually');
      return;
    }
    
    console.log(`✅ Found ${authUsers.users.length} auth users`);
    
    // Create a mapping of user ID to auth data
    const authUserMap = {};
    authUsers.users.forEach(user => {
      authUserMap[user.id] = user;
    });
    
    // Create user creation data
    const userCreationData = [];
    const creationScript = [];
    
    for (const profile of profiles) {
      const authUser = authUserMap[profile.id];
      
      if (authUser && authUser.email) {
        userCreationData.push({
          profile_id: profile.id,
          email: authUser.email,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          is_private: profile.is_private,
          created_at: profile.created_at,
          updated_at: profile.updated_at
        });
        
        // Add to creation script
        creationScript.push({
          email: authUser.email,
          profile_id: profile.id,
          temporary_password: `TempPass${profile.id.slice(-6)}!`,
          user_metadata: {
            username: profile.username,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            is_private: profile.is_private
          }
        });
      } else {
        console.log(`⚠️  No auth data found for user: ${profile.username} (${profile.id})`);
      }
    }
    
    console.log(`\n📊 Found ${userCreationData.length} users with email addresses`);
    
    // Save user creation data
    const userCreationFile = 'user-creation-data.json';
    fs.writeFileSync(userCreationFile, JSON.stringify(userCreationData, null, 2));
    
    // Create API script for user creation
    const apiScript = `// User Creation API Script
// Run this script to create users in your target database

import { createClient } from '@supabase/supabase-js';

const TARGET_SUPABASE_URL = 'https://pepgldetpvaiwawmmxox.supabase.co';
const TARGET_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcGdsZGV0cHZhaXdhd21teG94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM3Mzk1NSwiZXhwIjoyMDc1OTQ5OTU1fQ.qg308rqUcyaTsa0KQsEejffhhv4bhxmBQWmZP4iyWss';

const targetClient = createClient(TARGET_SUPABASE_URL, TARGET_SERVICE_ROLE_KEY);

const userCreationData = ${JSON.stringify(creationScript, null, 2)};

async function createUsers() {
  console.log('Creating users in target database...');
  
  for (const userData of userCreationData) {
    try {
      console.log(\`Creating user: \${userData.email}\`);
      
      const { data, error } = await targetClient.auth.admin.createUser({
        email: userData.email,
        password: userData.temporary_password,
        email_confirm: true,
        user_metadata: userData.user_metadata
      });
      
      if (error) {
        console.log(\`❌ Error creating user \${userData.email}:\`, error.message);
      } else {
        console.log(\`✅ Created user: \${userData.email} (ID: \${data.user.id})\`);
        
        // Verify the user ID matches the profile ID
        if (data.user.id !== userData.profile_id) {
          console.log(\`⚠️  WARNING: User ID mismatch! Expected: \${userData.profile_id}, Got: \${data.user.id}\`);
        }
      }
      
      // Small delay between creations
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (err) {
      console.log(\`❌ Exception creating user \${userData.email}:\`, err.message);
    }
  }
  
  console.log('User creation completed!');
}

createUsers().catch(console.error);
`;
    
    const apiScriptFile = 'create-users-api.js';
    fs.writeFileSync(apiScriptFile, apiScript);
    
    // Create manual instructions
    const manualInstructions = `# Manual User Creation Instructions

## Option 1: Use the API Script (Recommended)

1. Run the generated API script:
   \`\`\`bash
   node create-users-api.js
   \`\`\`

2. This will create all users with temporary passwords

3. Send password reset emails to users

## Option 2: Manual Creation via Supabase Dashboard

1. Go to your target database: https://pepgldetpvaiwawmmxox.supabase.co
2. Navigate to Authentication > Users
3. Click "Add User" for each user
4. Use the email addresses from user-creation-data.json
5. Set temporary passwords (users will reset them)
6. IMPORTANT: The user IDs must match the profile IDs for data consistency

## Option 3: Bulk Import via CSV

1. Create a CSV file with columns: email, password, email_confirm
2. Use Supabase's bulk user import feature
3. Ensure user IDs match profile IDs

## Important Notes:

- User IDs must match the profile IDs in your migrated data
- Users will need to reset their passwords after creation
- All user relationships (streaks, checkins, etc.) are already migrated
- The profiles table contains all user data except authentication

## Files Generated:

- user-creation-data.json: Complete user data with emails
- create-users-api.js: Automated user creation script
- user-export.json: Original profile data export
`;
    
    const instructionsFile = 'USER_MIGRATION_INSTRUCTIONS.md';
    fs.writeFileSync(instructionsFile, manualInstructions);
    
    console.log('\n📁 Files Created:');
    console.log(`   - ${userCreationFile}: User data with email addresses`);
    console.log(`   - ${apiScriptFile}: Automated user creation script`);
    console.log(`   - ${instructionsFile}: Manual instructions`);
    
    console.log('\n📋 Next Steps:');
    console.log('   1. Run: node create-users-api.js');
    console.log('   2. Send password reset emails to users');
    console.log('   3. Users can then login with their email addresses');
    
    // Show sample user data
    if (userCreationData.length > 0) {
      console.log('\n👤 Sample User Creation Data:');
      console.log(JSON.stringify(userCreationData[0], null, 2));
    }
    
  } catch (error) {
    console.log('❌ Error during user creation setup:', error.message);
  }
}

// Run the setup
createUsersInTarget().catch(console.error);
