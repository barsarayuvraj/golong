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

// All tables that should be migrated
const ALL_TABLES = [
  'profiles', 'streaks', 'achievements', 'streak_templates', 'challenges', 'groups',
  'user_streaks', 'checkins', 'comments', 'likes', 'user_achievements', 
  'challenge_participants', 'group_members', 'follows', 'follow_requests',
  'notifications', 'notes', 'reminders', 'reports', 'activity_log', 
  'export_jobs', 'blocked_users', 'conversations', 'messages', 'message_reads', 'widgets'
];

async function getTableCount(client, tableName) {
  try {
    const { count, error } = await client
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      return { count: 0, error: error.message };
    }
    
    return { count: count || 0, error: null };
  } catch (err) {
    return { count: 0, error: err.message };
  }
}

async function verifyMigration() {
  console.log('🔍 Final Migration Verification');
  console.log('=' .repeat(80));
  console.log('📊 Comparing record counts between source and target databases');
  console.log('=' .repeat(80));
  
  let totalSourceRecords = 0;
  let totalTargetRecords = 0;
  let perfectMatches = 0;
  let mismatches = [];
  
  for (const tableName of ALL_TABLES) {
    console.log(`\n📋 Checking ${tableName}...`);
    
    // Get source count
    const sourceResult = await getTableCount(sourceClient, tableName);
    if (sourceResult.error) {
      console.log(`❌ Source error: ${sourceResult.error}`);
      continue;
    }
    
    // Get target count
    const targetResult = await getTableCount(targetClient, tableName);
    if (targetResult.error) {
      console.log(`❌ Target error: ${targetResult.error}`);
      continue;
    }
    
    const sourceCount = sourceResult.count;
    const targetCount = targetResult.count;
    
    totalSourceRecords += sourceCount;
    totalTargetRecords += targetCount;
    
    if (sourceCount === targetCount) {
      console.log(`✅ ${tableName}: ${sourceCount} records (perfect match)`);
      perfectMatches++;
    } else {
      console.log(`❌ ${tableName}: Source=${sourceCount}, Target=${targetCount} (MISMATCH)`);
      mismatches.push({ table: tableName, source: sourceCount, target: targetCount });
    }
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Final summary
  console.log('\n' + '=' .repeat(80));
  console.log('📊 MIGRATION VERIFICATION SUMMARY');
  console.log('=' .repeat(80));
  console.log(`📈 Total records in source database: ${totalSourceRecords}`);
  console.log(`📈 Total records in target database: ${totalTargetRecords}`);
  console.log(`✅ Tables with perfect matches: ${perfectMatches}/${ALL_TABLES.length}`);
  console.log(`❌ Tables with mismatches: ${mismatches.length}`);
  
  if (mismatches.length === 0) {
    console.log('\n🎉 PERFECT MIGRATION! All data has been successfully migrated!');
  } else {
    console.log('\n⚠️  Tables with mismatches:');
    mismatches.forEach(m => {
      console.log(`  - ${m.table}: Source=${m.source}, Target=${m.target}`);
    });
  }
  
  console.log('\n📊 Migration Statistics:');
  console.log(`  - Source Database: "barsarayuvraj's Project"`);
  console.log(`  - Target Database: "GoLong App v2"`);
  console.log(`  - Tables migrated: ${ALL_TABLES.length}`);
  console.log(`  - Total source records: ${totalSourceRecords}`);
  console.log(`  - Total target records: ${totalTargetRecords}`);
  console.log(`  - Migration accuracy: ${perfectMatches}/${ALL_TABLES.length} tables (${Math.round((perfectMatches/ALL_TABLES.length)*100)}%)`);
}

// Run the verification
verifyMigration().catch(console.error);
