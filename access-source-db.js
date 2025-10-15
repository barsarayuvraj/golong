#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Source database configuration
const SOURCE_SUPABASE_URL = 'https://gzhccauxdtboxurrwogk.supabase.co';
const SOURCE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6aGNjYXV4ZHRib3hydXJ3b2drIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1NDg5MiwiZXhwIjoyMDc1NTMwODkyfQ.mJLR6mNEMW2k2JryXdbKIO5qwTiDvK-is5j6oPMPUBk';

// Target database configuration (GoLong App v2)
const TARGET_SUPABASE_URL = 'https://pepgldetpvaiwawmmxox.supabase.co';
const TARGET_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcGdsZGV0cHZhaXdhd21teG94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM3Mzk1NSwiZXhwIjoyMDc1OTQ5OTU1fQ.qg308rqUcyaTsa0KQsEejffhhv4bhxmBQWmZP4iyWss';

// Initialize clients
const sourceClient = createClient(SOURCE_SUPABASE_URL, SOURCE_SERVICE_ROLE_KEY);
const targetClient = createClient(TARGET_SUPABASE_URL, TARGET_SERVICE_ROLE_KEY);

async function getSourceDatabaseInfo() {
  console.log('🔍 Analyzing Source Database (barsarayuvraj\'s Project)...\n');
  
  try {
    // First, let's try to get basic info without exec_sql function
    console.log('Testing connection to source database...');
    
    // Try to access a common table that might exist
    const commonTables = ['profiles', 'users', 'auth.users', 'streaks', 'user_streaks', 'checkins'];
    
    for (const tableName of commonTables) {
      try {
        const { data, error } = await sourceClient
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log(`✅ Table '${tableName}' exists and is accessible`);
          
          // Get count
          const { count } = await sourceClient
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          console.log(`   Records: ${count}`);
          
          if (count > 0) {
            // Get sample data
            const { data: sampleData } = await sourceClient
              .from(tableName)
              .select('*')
              .limit(3);
            
            console.log(`   Sample data:`, JSON.stringify(sampleData, null, 2));
          }
          console.log('');
        }
      } catch (tableError) {
        // Table doesn't exist or not accessible, continue
      }
    }
    
    // Try to check if exec_sql function exists
    try {
      const { data: testQuery, error: testError } = await sourceClient
        .rpc('exec_sql', { 
          sql_query: "SELECT 1 as test;" 
        });
      
      if (!testError) {
        console.log('✅ exec_sql function is available');
        
        // Get all tables using exec_sql
        const { data: tables, error: tablesError } = await sourceClient
          .rpc('exec_sql', { 
            sql_query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" 
          });
        
        if (!tablesError) {
          console.log('\n📋 All tables found:');
          tables.forEach(table => {
            console.log(`  - ${table.table_name}`);
          });
        }
      }
    } catch (execError) {
      console.log('❌ exec_sql function is not available in source database');
      console.log('   This means we need to create it or use direct table access');
    }
    
  } catch (error) {
    console.error('Error analyzing source database:', error);
  }
}

async function getTargetDatabaseInfo() {
  console.log('\n🎯 Analyzing Target Database (GoLong App v2)...\n');
  
  try {
    // Get all tables
    const { data: tables, error: tablesError } = await targetClient
      .rpc('exec_sql', { 
        sql_query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" 
      });
    
    if (tablesError) {
      console.error('Error getting tables:', tablesError);
      return;
    }
    
    console.log('📋 Tables found:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    console.log('');
    
  } catch (error) {
    console.error('Error analyzing target database:', error);
  }
}

// Main execution
async function main() {
  await getSourceDatabaseInfo();
  await getTargetDatabaseInfo();
}

main().catch(console.error);
