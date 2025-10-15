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

// Test with just a few core tables first
const TEST_TABLES = ['achievements', 'streak_templates', 'profiles'];

async function getTableData(tableName) {
  console.log(`📊 Fetching data from ${tableName}...`);
  
  try {
    const { data, error } = await sourceClient
      .rpc('exec_sql', { 
        sql_query: `SELECT * FROM ${tableName} LIMIT 3;` // Limit to 3 for testing
      });
    
    if (error) {
      console.log(`❌ Error fetching ${tableName}:`, error.message);
      return [];
    }
    
    console.log(`✅ Fetched ${data.length} records from ${tableName}`);
    return data || [];
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
    const { data: insertedData, error } = await targetClient
      .from(tableName)
      .insert(data)
      .select('id');
    
    if (error) {
      console.log(`❌ Error inserting into ${tableName}:`, error.message);
      return { success: false, error: error.message };
    }
    
    console.log(`✅ Successfully inserted ${insertedData.length} records into ${tableName}`);
    return { success: true, inserted: insertedData.length };
  } catch (err) {
    console.log(`❌ Exception inserting into ${tableName}:`, err.message);
    return { success: false, error: err.message };
  }
}

async function testMigration() {
  console.log('🧪 Testing Migration Process');
  console.log('=' .repeat(50));
  console.log(`📋 Testing with tables: ${TEST_TABLES.join(', ')}`);
  console.log('=' .repeat(50));
  
  for (const tableName of TEST_TABLES) {
    console.log(`\n🔄 Testing migration for: ${tableName}`);
    console.log('-'.repeat(30));
    
    try {
      // Get sample data from source
      const sourceData = await getTableData(tableName);
      
      if (sourceData.length === 0) {
        console.log(`⏭️  No data to migrate for ${tableName}`);
        continue;
      }
      
      // Show sample data
      console.log(`📋 Sample data from ${tableName}:`);
      console.log(JSON.stringify(sourceData[0], null, 2));
      
      // Insert data into target
      const result = await insertTableData(tableName, sourceData);
      
      if (result.success) {
        console.log(`✅ Test migration successful for ${tableName}`);
      } else {
        console.log(`❌ Test migration failed for ${tableName}: ${result.error}`);
      }
      
    } catch (error) {
      console.log(`❌ Test failed for ${tableName}:`, error.message);
    }
    
    // Small delay between tables
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 Test migration completed!');
}

// Run the test
testMigration().catch(console.error);

