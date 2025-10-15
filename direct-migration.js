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

// Start with core tables first
const CORE_TABLES = [
  'profiles',
  'streaks', 
  'achievements',
  'streak_templates',
  'challenges',
  'groups'
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
    
    // Insert into target
    console.log(`💾 Inserting ${sourceData.length} records into target ${tableName}...`);
    const { data: insertedData, error: insertError } = await targetClient
      .from(tableName)
      .insert(sourceData)
      .select('id');
    
    if (insertError) {
      console.log(`❌ Error inserting into ${tableName}:`, insertError.message);
      return { success: false, error: insertError.message };
    }
    
    console.log(`✅ Successfully inserted ${insertedData.length} records into ${tableName}`);
    return { success: true, inserted: insertedData.length };
    
  } catch (error) {
    console.log(`❌ Exception migrating ${tableName}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function directMigration() {
  console.log('🚀 Starting Direct Migration Process');
  console.log('=' .repeat(60));
  console.log(`📋 Migrating core tables: ${CORE_TABLES.join(', ')}`);
  console.log('=' .repeat(60));
  
  const results = [];
  let totalInserted = 0;
  
  for (const tableName of CORE_TABLES) {
    const result = await migrateTableDirect(tableName);
    results.push({ table: tableName, ...result });
    
    if (result.success) {
      totalInserted += result.inserted || 0;
    }
    
    // Small delay between tables
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n📊 Migration Summary');
  console.log('=' .repeat(60));
  console.log(`✅ Tables migrated successfully: ${results.filter(r => r.success).length}`);
  console.log(`❌ Tables failed: ${results.filter(r => !r.success).length}`);
  console.log(`📈 Total records inserted: ${totalInserted}`);
  
  // Show failed tables
  const failedTables = results.filter(r => !r.success);
  if (failedTables.length > 0) {
    console.log('\n❌ Failed Tables:');
    failedTables.forEach(f => {
      console.log(`  - ${f.table}: ${f.error}`);
    });
  }
  
  console.log('\n🎉 Core migration completed!');
  
  // If core tables work, we can proceed with the rest
  if (failedTables.length === 0) {
    console.log('\n✅ Core tables migrated successfully! Ready for full migration.');
  }
}

// Run the migration
directMigration().catch(console.error);
