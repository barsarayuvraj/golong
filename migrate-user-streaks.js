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

async function migrateUserStreaks() {
  console.log('🔄 Migrating user_streaks...');
  console.log('-'.repeat(40));
  
  try {
    // Get data from source
    console.log('📊 Fetching data from source user_streaks...');
    const { data: sourceData, error: sourceError } = await sourceClient
      .from('user_streaks')
      .select('*');
    
    if (sourceError) {
      console.log('❌ Error fetching user_streaks:', sourceError.message);
      return;
    }
    
    if (!sourceData || sourceData.length === 0) {
      console.log('⏭️  No data in source user_streaks');
      return;
    }
    
    console.log(`✅ Fetched ${sourceData.length} records from source`);
    
    // Show sample data
    console.log('📋 Sample data:', JSON.stringify(sourceData[0], null, 2));
    
    // Insert into target in batches
    const batchSize = 50;
    let totalInserted = 0;
    
    for (let i = 0; i < sourceData.length; i += batchSize) {
      const batch = sourceData.slice(i, i + batchSize);
      
      console.log(`💾 Inserting batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(sourceData.length/batchSize)} (${batch.length} records)...`);
      
      const { data: insertedData, error: insertError } = await targetClient
        .from('user_streaks')
        .insert(batch)
        .select('id');
      
      if (insertError) {
        console.log('❌ Error inserting batch into user_streaks:', insertError.message);
        return;
      }
      
      totalInserted += insertedData.length;
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1} (${insertedData.length} records)`);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`✅ Successfully inserted ${totalInserted} records into user_streaks`);
    
  } catch (error) {
    console.log('❌ Exception migrating user_streaks:', error.message);
  }
}

// Run the migration
migrateUserStreaks().catch(console.error);
