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

async function fixUserIDMapping() {
  console.log('🔧 Fixing User ID Mapping');
  console.log('=' .repeat(60));
  
  try {
    // Get auth users from target database
    console.log('📋 Fetching auth users from target database...');
    const { data: targetAuthUsers, error: targetAuthError } = await targetClient.auth.admin.listUsers();
    
    if (targetAuthError) {
      console.log('❌ Error fetching target auth users:', targetAuthError.message);
      return;
    }
    
    console.log(`✅ Found ${targetAuthUsers.users.length} auth users in target`);
    
    // Get auth users from source database
    console.log('\n📋 Fetching auth users from source database...');
    const { data: sourceAuthUsers, error: sourceAuthError } = await sourceClient.auth.admin.listUsers();
    
    if (sourceAuthError) {
      console.log('❌ Error fetching source auth users:', sourceAuthError.message);
      return;
    }
    
    console.log(`✅ Found ${sourceAuthUsers.users.length} auth users in source`);
    
    // Create email to new user ID mapping
    const emailToNewIdMap = {};
    targetAuthUsers.users.forEach(user => {
      if (user.email) {
        emailToNewIdMap[user.email] = user.id;
      }
    });
    
    // Create email to old user ID mapping
    const emailToOldIdMap = {};
    sourceAuthUsers.users.forEach(user => {
      if (user.email) {
        emailToOldIdMap[user.email] = user.id;
      }
    });
    
    // Create ID mapping
    const idMapping = [];
    for (const email in emailToNewIdMap) {
      const newId = emailToNewIdMap[email];
      const oldId = emailToOldIdMap[email];
      
      if (oldId) {
        idMapping.push({
          old_id: oldId,
          new_id: newId,
          email: email
        });
      }
    }
    
    console.log(`\n📊 Created ID mapping for ${idMapping.length} users`);
    
    // Save the mapping
    const mappingFile = 'user-id-mapping.json';
    fs.writeFileSync(mappingFile, JSON.stringify(idMapping, null, 2));
    
    console.log(`✅ User ID mapping saved to: ${mappingFile}`);
    
    // Create SQL script to update all tables
    console.log('\n📝 Creating SQL update script...');
    
    let sqlScript = `-- Update User IDs in Target Database
-- This script updates all user references to match the new auth user IDs

`;
    
    // Add UPDATE statements for each table that references user IDs
    const tablesWithUserRefs = [
      'profiles',
      'streaks',
      'user_streaks', 
      'comments',
      'likes',
      'user_achievements',
      'challenge_participants',
      'group_members',
      'follows',
      'follow_requests',
      'notifications',
      'notes',
      'reminders',
      'reports',
      'activity_log',
      'export_jobs',
      'analytics_data',
      'blocked_users',
      'conversations',
      'messages',
      'message_reads',
      'message_preferences',
      'notification_preferences',
      'widgets'
    ];
    
    // Generate UPDATE statements for each mapping
    idMapping.forEach(mapping => {
      sqlScript += `-- Update user ${mapping.email} (${mapping.old_id} -> ${mapping.new_id})\n`;
      
      // Update profiles table
      sqlScript += `UPDATE public.profiles SET id = '${mapping.new_id}' WHERE id = '${mapping.old_id}';\n`;
      
      // Update all other tables
      tablesWithUserRefs.forEach(table => {
        // Get column names that reference users
        const userColumns = [];
        
        if (table === 'streaks') userColumns.push('created_by');
        if (table === 'user_streaks') userColumns.push('user_id');
        if (table === 'comments') userColumns.push('user_id');
        if (table === 'likes') userColumns.push('user_id');
        if (table === 'user_achievements') userColumns.push('user_id');
        if (table === 'challenge_participants') userColumns.push('user_id');
        if (table === 'group_members') userColumns.push('user_id');
        if (table === 'follows') userColumns.push('follower_id', 'following_id');
        if (table === 'follow_requests') userColumns.push('requester_id', 'target_id');
        if (table === 'notifications') userColumns.push('user_id');
        if (table === 'notes') userColumns.push('user_id');
        if (table === 'reminders') userColumns.push('user_id');
        if (table === 'reports') userColumns.push('reporter_id', 'reported_user_id');
        if (table === 'activity_log') userColumns.push('user_id');
        if (table === 'export_jobs') userColumns.push('user_id');
        if (table === 'analytics_data') userColumns.push('user_id');
        if (table === 'blocked_users') userColumns.push('blocker_id', 'blocked_id');
        if (table === 'conversations') userColumns.push('participant1_id', 'participant2_id');
        if (table === 'messages') userColumns.push('sender_id');
        if (table === 'message_reads') userColumns.push('user_id');
        if (table === 'message_preferences') userColumns.push('user_id');
        if (table === 'notification_preferences') userColumns.push('user_id');
        if (table === 'widgets') userColumns.push('user_id');
        
        userColumns.forEach(column => {
          sqlScript += `UPDATE public.${table} SET ${column} = '${mapping.new_id}' WHERE ${column} = '${mapping.old_id}';\n`;
        });
      });
      
      sqlScript += '\n';
    });
    
    // Save SQL script
    const sqlFile = 'update-user-ids.sql';
    fs.writeFileSync(sqlFile, sqlScript);
    
    console.log(`✅ SQL update script saved to: ${sqlFile}`);
    
    // Show summary
    console.log('\n📊 User ID Mapping Summary');
    console.log('=' .repeat(60));
    console.log(`📁 Files created:`);
    console.log(`   - ${mappingFile}: Complete user ID mapping`);
    console.log(`   - ${sqlFile}: SQL script to update all user references`);
    
    console.log('\n📋 Next Steps:');
    console.log('   1. Review the user ID mapping');
    console.log('   2. Execute the SQL script in your target database');
    console.log('   3. Verify that all user relationships work correctly');
    
    console.log('\n⚠️  Important Notes:');
    console.log('   - This will update ALL user references in your database');
    console.log('   - Make sure to backup your database before running the SQL');
    console.log('   - After running the SQL, users can login with their email addresses');
    
    // Show sample mapping
    if (idMapping.length > 0) {
      console.log('\n👤 Sample User ID Mapping:');
      console.log(JSON.stringify(idMapping[0], null, 2));
    }
    
  } catch (error) {
    console.log('❌ Error during user ID mapping:', error.message);
  }
}

// Run the mapping
fixUserIDMapping().catch(console.error);
