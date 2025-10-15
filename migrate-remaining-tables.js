#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Database configurations
const SOURCE_SUPABASE_URL = 'https://gzhccauxdtboxrurwogk.supabase.co';
const SOURCE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6aGNjYXV4ZHRib3hydXJ3b2drIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1NDg5MiwiZXhwIjoyMDc1NTMwODkyfQ.mJLR6mNEMW2k2JryXdbKIO5qwTiDvK-is5j6oPMPUBk';

const TARGET_SUPABASE_URL = 'https://pepgldetpvaiwawmmxox.supabase.co';
const TARGET_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcGdsZGV0cHZhaXdhd21teG94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM3Mzk1NSwiZXhwIjoyMDc1OTQ5OTU1fQ.qg308rqUcyaTsa0KQsEejffhhv4bhxmBQWmZP4iyWss';

// Initialize clients
const sourceClient = createClient(SOURCE_SUPABASE_URL, SOURCE_SERVICE_ROLE_KEY);
const targetClient = createClient(TARGET_SUPABASE_URL, TARGET_SERVICE_ROLE_KEY);

// Remaining tables to migrate (excluding already migrated ones)
const REMAINING_TABLES = [
  'user_streaks',
  'checkins',
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
  'blocked_users',
  'conversations',
  'messages',
  'message_reads',
  'widgets'
];

async function migrateTableDirect(tableName) {
  console.log(`\n🔄 Migrating ${tableName}...`);
  console.log('-'.repeat(40));
  
  try {
    // Get data from source using direct client access
    console.log(`📊 Fetching data from source ${tableName}...`);
    const { data: sourceData, error: sourceError } = await sourceClient
      .from(tableName)
      .select('*');
    
    if (sourceError) {
      console.log(`❌ Error fetching ${tableName}:`, sourceError.message);
      return { success: false, error: sourceError.message };
    }
    
    if (!sourceData || sourceData.length === 0) {
      console.log(`⏭️  No data in source ${tableName}`);
      return { success: true, inserted: 0 };
    }
    
    console.log(`✅ Fetched ${sourceData.length} records from source`);
    
    // Show sample data
    console.log(`📋 Sample data:`, JSON.stringify(sourceData[0], null, 2));
    
    // Insert into target in batches to avoid timeout
    const batchSize = 50;
    let totalInserted = 0;
    
    for (let i = 0; i < sourceData.length; i += batchSize) {
      const batch = sourceData.slice(i, i + batchSize);
      
      console.log(`💾 Inserting batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(sourceData.length/batchSize)} (${batch.length} records)...`);
      
      const { data: insertedData, error: insertError } = await targetClient
        .from(tableName)
        .insert(batch)
        .select('id');
      
      if (insertError) {
        console.log(`❌ Error inserting batch into ${tableName}:`, insertError.message);
        return { success: false, error: insertError.message };
      }
      
      totalInserted += insertedData.length;
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1} (${insertedData.length} records)`);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`✅ Successfully inserted ${totalInserted} records into ${tableName}`);
    return { success: true, inserted: totalInserted };
    
  } catch (error) {
    console.log(`❌ Exception migrating ${tableName}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function migrateRemainingTables() {
  console.log('🚀 Starting Remaining Tables Migration');
  console.log('=' .repeat(60));
  console.log(`📋 Migrating remaining tables: ${REMAINING_TABLES.join(', ')}`);
  console.log('=' .repeat(60));
  
  const results = [];
  let totalInserted = 0;
  let successCount = 0;
  let failCount = 0;
  
  for (const tableName of REMAINING_TABLES) {
    const result = await migrateTableDirect(tableName);
    results.push({ table: tableName, ...result });
    
    if (result.success) {
      totalInserted += result.inserted || 0;
      successCount++;
    } else {
      failCount++;
    }
    
    // Small delay between tables
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n📊 Migration Summary');
  console.log('=' .repeat(60));
  console.log(`✅ Tables migrated successfully: ${successCount}`);
  console.log(`❌ Tables failed: ${failCount}`);
  console.log(`📈 Total records inserted: ${totalInserted}`);
  
  // Show failed tables
  const failedTables = results.filter(r => !r.success);
  if (failedTables.length > 0) {
    console.log('\n❌ Failed Tables:');
    failedTables.forEach(f => {
      console.log(`  - ${f.table}: ${f.error}`);
    });
  }
  
  // Show successful tables with counts
  const successfulTables = results.filter(r => r.success && r.inserted > 0);
  if (successfulTables.length > 0) {
    console.log('\n✅ Successfully Migrated Tables:');
    successfulTables.forEach(s => {
      console.log(`  - ${s.table}: ${s.inserted} records`);
    });
  }
  
  console.log('\n🎉 Remaining tables migration completed!');
}

// Run the migration
migrateRemainingTables().catch(console.error);
