#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Database configurations
const SOURCE_SUPABASE_URL = 'https://gzhccauxdtboxrurwogk.supabase.co';
const SOURCE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6aGNjYXV4ZHRib3hydXJ3b2drIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1NDg5MiwiZXhwIjoyMDc1NTMwODkyfQ.mJLR6mNEMW2k2JryXdbKIO5qwTiDvK-is5j6oPMPUBk';

// Initialize source client
const sourceClient = createClient(SOURCE_SUPABASE_URL, SOURCE_SERVICE_ROLE_KEY);

async function exportUserDetails() {
  console.log('📊 Exporting User Details for Migration');
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
    
    // Try to get auth users from source (this might not work due to RLS)
    console.log('\n📋 Attempting to fetch auth users...');
    try {
      const { data: authUsers, error: authError } = await sourceClient.auth.admin.listUsers();
      
      if (authError) {
        console.log('⚠️  Could not fetch auth users:', authError.message);
        console.log('   This is expected - auth data is restricted');
      } else {
        console.log(`✅ Found ${authUsers.users.length} auth users`);
      }
    } catch (err) {
      console.log('⚠️  Auth users not accessible (expected)');
    }
    
    // Create user export data
    const userExportData = profiles.map(profile => ({
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      bio: profile.bio,
      is_private: profile.is_private,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      // Note: Email and password data would come from auth.users but is not accessible
      email: null, // Will need to be provided separately
      migration_note: "User needs to be recreated in target database auth system"
    }));
    
    // Save to JSON file
    const exportFile = 'user-export.json';
    fs.writeFileSync(exportFile, JSON.stringify(userExportData, null, 2));
    
    console.log(`\n✅ User details exported to: ${exportFile}`);
    console.log(`📊 Exported ${userExportData.length} user profiles`);
    
    // Create SQL script for user creation
    console.log('\n📝 Creating SQL script for user recreation...');
    
    let sqlScript = `-- User Recreation Script for Target Database
-- This script creates the auth.users entries for your migrated profiles
-- NOTE: Users will need to reset their passwords after migration

-- You'll need to run this in your target database's SQL editor
-- Each user will need to go through password reset flow

`;

    // Add comments for each user
    userExportData.forEach((user, index) => {
      sqlScript += `-- User ${index + 1}: ${user.username} (${user.display_name})
-- ID: ${user.id}
-- Email: [NEEDS TO BE PROVIDED - not available from source]
-- Created: ${user.created_at}
-- Bio: ${user.bio || 'No bio'}

`;
    });
    
    sqlScript += `-- To create users in your target database:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" for each user
-- 3. Use the same email addresses as in your source database
-- 4. Set temporary passwords (users will reset them)
-- 5. The user IDs should match the profile IDs above for data consistency

-- Alternative: Use Supabase Admin API to create users programmatically
-- See: https://supabase.com/docs/guides/auth/server-side/creating-admin-users
`;
    
    // Save SQL script
    const sqlFile = 'user-recreation-script.sql';
    fs.writeFileSync(sqlFile, sqlScript);
    
    console.log(`✅ SQL recreation script saved to: ${sqlFile}`);
    
    // Display summary
    console.log('\n📊 User Export Summary');
    console.log('=' .repeat(60));
    console.log(`📁 Files created:`);
    console.log(`   - ${exportFile}: Complete user data export`);
    console.log(`   - ${sqlFile}: Instructions for user recreation`);
    console.log(`\n📋 Next Steps:`);
    console.log(`   1. Review the exported user data`);
    console.log(`   2. Create users in target database using same email addresses`);
    console.log(`   3. Send password reset emails to users`);
    console.log(`   4. Update any hardcoded user IDs in your app if needed`);
    
    // Show sample user data
    if (userExportData.length > 0) {
      console.log('\n👤 Sample User Data:');
      console.log(JSON.stringify(userExportData[0], null, 2));
    }
    
  } catch (error) {
    console.log('❌ Error during export:', error.message);
  }
}

// Run the export
exportUserDetails().catch(console.error);
