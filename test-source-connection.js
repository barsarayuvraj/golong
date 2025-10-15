#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Source database configuration
const SOURCE_SUPABASE_URL = 'https://gzhccauxdtboxurrwogk.supabase.co';
const SOURCE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6aGNjYXV4ZHRib3hydXJ3b2drIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1NDg5MiwiZXhwIjoyMDc1NTMwODkyfQ.mJLR6mNEMW2k2JryXdbKIO5qwTiDvK-is5j6oPMPUBk';

// Initialize client
const sourceClient = createClient(SOURCE_SUPABASE_URL, SOURCE_SERVICE_ROLE_KEY);

async function testConnection() {
  console.log('🔍 Testing connection to source database...\n');
  
  try {
    // Test basic connection
    console.log('Testing basic connection...');
    const { data, error } = await sourceClient.auth.getSession();
    
    if (error) {
      console.log('❌ Connection failed:', error.message);
      return;
    }
    
    console.log('✅ Basic connection successful');
    
    // Try to list all tables by attempting to access common ones
    console.log('\n🔍 Discovering tables...');
    const possibleTables = [
      'profiles', 'users', 'auth_users', 'streaks', 'user_streaks', 'checkins',
      'comments', 'likes', 'notifications', 'achievements', 'user_achievements',
      'reports', 'reminders', 'challenges', 'groups', 'analytics_data'
    ];
    
    const existingTables = [];
    
    for (const tableName of possibleTables) {
      try {
        const { data, error } = await sourceClient
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error) {
          existingTables.push(tableName);
          console.log(`✅ Found table: ${tableName}`);
          
          // Get count
          const { count } = await sourceClient
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          console.log(`   Records: ${count}`);
          
          // Get sample data if count is small
          if (count > 0 && count < 50) {
            const { data: sampleData } = await sourceClient
              .from(tableName)
              .select('*')
              .limit(2);
            
            console.log(`   Sample:`, JSON.stringify(sampleData, null, 2));
          }
          console.log('');
        }
      } catch (tableError) {
        // Table doesn't exist or not accessible
      }
    }
    
    if (existingTables.length === 0) {
      console.log('❌ No accessible tables found');
      console.log('   This could mean:');
      console.log('   - Database is empty');
      console.log('   - RLS policies are blocking access');
      console.log('   - Tables have different names');
    } else {
      console.log(`\n📊 Summary: Found ${existingTables.length} accessible tables`);
      console.log('Tables:', existingTables.join(', '));
    }
    
    // Try to check if exec_sql function exists
    console.log('\n🔍 Checking for exec_sql function...');
    try {
      const { data, error } = await sourceClient
        .rpc('exec_sql', { 
          sql_query: "SELECT 1 as test;" 
        });
      
      if (!error) {
        console.log('✅ exec_sql function is available');
      } else {
        console.log('❌ exec_sql function not available:', error.message);
      }
    } catch (execError) {
      console.log('❌ exec_sql function not available:', execError.message);
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

testConnection().catch(console.error);

