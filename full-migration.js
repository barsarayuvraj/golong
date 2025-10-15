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

// Migration order based on dependencies (tables without foreign keys first)
const MIGRATION_ORDER = [
  // Core tables (no dependencies)
  'profiles',
  'streaks',
  'achievements',
  'streak_templates',
  'challenges',
  'groups',
  'blocked_users',
  'notification_preferences',
  'message_preferences',
  
  // Dependent tables (reference core tables)
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
  'analytics_data',
  'export_jobs',
  'widgets',
  
  // Messaging tables (complex dependencies)
  'conversations',
  'messages',
  'message_reads'
];

// Tables to skip (system tables or empty tables)
const SKIP_TABLES = ['analytics_data', 'message_preferences', 'notification_preferences'];

async function getTableData(tableName) {
  console.log(`📊 Fetching data from ${tableName}...`);
  
  try {
    const { data, error } = await sourceClient
      .rpc('exec_sql', { 
        sql_query: `SELECT * FROM ${tableName} ORDER BY created_at ASC;` 
      });
    
    if (error) {
      console.log(`❌ Error fetching ${tableName}:`, error.message);
      return [];
    }
    
    // Handle the case where data might be wrapped in an array
    let records = data;
    if (Array.isArray(data) && data.length > 0 && data[0].hasOwnProperty('error')) {
      console.log(`❌ SQL error for ${tableName}:`, data[0].message);
      return [];
    }
    
    if (!Array.isArray(records)) {
      records = [];
    }
    
    console.log(`✅ Fetched ${records.length} records from ${tableName}`);
    return records;
  } catch (err) {
    console.log(`❌ Exception fetching ${tableName}:`, err.message);
    return [];
  }
}

async function insertTableData(tableName, data) {
  if (data.length === 0) {
    console.log(`⏭️  Skipping ${tableName} - no data to migrate`);
    return { success: true, inserted: 0 };
  }
  
  console.log(`💾 Inserting ${data.length} records into ${tableName}...`);
  
  try {
    // Insert data in batches to avoid timeout
    const batchSize = 100;
    let totalInserted = 0;
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      const { data: insertedData, error } = await targetClient
        .from(tableName)
        .insert(batch)
        .select('id');
      
      if (error) {
        console.log(`❌ Error inserting batch into ${tableName}:`, error.message);
        return { success: false, error: error.message };
      }
      
      totalInserted += insertedData.length;
      console.log(`  ✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(data.length/batchSize)} (${totalInserted}/${data.length} records)`);
    }
    
    console.log(`✅ Successfully inserted ${totalInserted} records into ${tableName}`);
    return { success: true, inserted: totalInserted };
  } catch (err) {
    console.log(`❌ Exception inserting into ${tableName}:`, err.message);
    return { success: false, error: err.message };
  }
}

async function migrateTable(tableName) {
  console.log(`\n🔄 Migrating table: ${tableName}`);
  console.log('=' .repeat(50));
  
  // Skip tables that are in the skip list
  if (SKIP_TABLES.includes(tableName)) {
    console.log(`⏭️  Skipping ${tableName} - marked for skip`);
    return { success: true, skipped: true };
  }
  
  try {
    // Get data from source
    const sourceData = await getTableData(tableName);
    
    if (sourceData.length === 0) {
      console.log(`⏭️  No data to migrate for ${tableName}`);
      return { success: true, inserted: 0 };
    }
    
    // Insert data into target
    const result = await insertTableData(tableName, sourceData);
    
    return result;
  } catch (error) {
    console.log(`❌ Migration failed for ${tableName}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function verifyMigration(tableName) {
  try {
    // Get counts from both databases
    const { data: sourceCount } = await sourceClient
      .rpc('exec_sql', { 
        sql_query: `SELECT COUNT(*) as count FROM ${tableName};` 
      });
    
    const { data: targetCount } = await targetClient
      .rpc('exec_sql', { 
        sql_query: `SELECT COUNT(*) as count FROM ${tableName};` 
      });
    
    const sourceCountNum = sourceCount[0]?.count || 0;
    const targetCountNum = targetCount[0]?.count || 0;
    
    if (sourceCountNum === targetCountNum) {
      console.log(`✅ ${tableName}: ${sourceCountNum} records verified`);
      return true;
    } else {
      console.log(`❌ ${tableName}: Mismatch - Source: ${sourceCountNum}, Target: ${targetCountNum}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Verification failed for ${tableName}:`, error.message);
    return false;
  }
}

async function fullMigration() {
  console.log('🚀 Starting Full Migration Process');
  console.log('=' .repeat(60));
  console.log(`📋 Tables to migrate: ${MIGRATION_ORDER.length}`);
  console.log(`⏭️  Tables to skip: ${SKIP_TABLES.join(', ')}`);
  console.log('=' .repeat(60));
  
  const results = [];
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  
  // Migrate each table in dependency order
  for (const tableName of MIGRATION_ORDER) {
    const result = await migrateTable(tableName);
    results.push({ table: tableName, ...result });
    
    if (result.skipped) {
      totalSkipped++;
    } else if (result.success) {
      totalInserted += result.inserted || 0;
    } else {
      totalFailed++;
    }
    
    // Small delay between tables
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Verification phase
  console.log('\n🔍 Starting Verification Phase');
  console.log('=' .repeat(60));
  
  let verifiedTables = 0;
  for (const tableName of MIGRATION_ORDER) {
    if (!SKIP_TABLES.includes(tableName)) {
      const verified = await verifyMigration(tableName);
      if (verified) verifiedTables++;
    }
  }
  
  // Summary
  console.log('\n📊 Migration Summary');
  console.log('=' .repeat(60));
  console.log(`✅ Tables migrated successfully: ${results.filter(r => r.success && !r.skipped).length}`);
  console.log(`⏭️  Tables skipped: ${totalSkipped}`);
  console.log(`❌ Tables failed: ${totalFailed}`);
  console.log(`📈 Total records inserted: ${totalInserted}`);
  console.log(`🔍 Tables verified: ${verifiedTables}`);
  
  // Failed tables
  const failedTables = results.filter(r => !r.success && !r.skipped);
  if (failedTables.length > 0) {
    console.log('\n❌ Failed Tables:');
    failedTables.forEach(f => {
      console.log(`  - ${f.table}: ${f.error}`);
    });
  }
  
  console.log('\n🎉 Migration completed!');
}

// Run the migration
fullMigration().catch(console.error);

