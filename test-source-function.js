#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Source database configuration
const SOURCE_SUPABASE_URL = 'https://gzhccauxdtboxrurwogk.supabase.co';
const SOURCE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6aGNjYXV4ZHRib3hydXJ3b2drIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1NDg5MiwiZXhwIjoyMDc1NTMwODkyfQ.mJLR6mNEMW2k2JryXdbKIO5qwTiDvK-is5j6oPMPUBk';

// Initialize client
const sourceClient = createClient(SOURCE_SUPABASE_URL, SOURCE_SERVICE_ROLE_KEY);

async function testExecSqlFunction() {
  console.log('🧪 Testing exec_sql function in source database...\n');
  
  try {
    // Test 1: Basic function test
    console.log('Test 1: Basic function test');
    const { data: testData, error: testError } = await sourceClient
      .rpc('exec_sql', { 
        sql_query: "SELECT 1 as test_column, 'Hello World' as message;" 
      });
    
    if (testError) {
      console.log('❌ Function test failed:', testError.message);
      return;
    } else {
      console.log('✅ Function test successful!');
      console.log('Result:', JSON.stringify(testData, null, 2));
    }
    
    // Test 2: Get all tables
    console.log('\nTest 2: Getting all tables...');
    const { data: tables, error: tablesError } = await sourceClient
      .rpc('exec_sql', { 
        sql_query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" 
      });
    
    if (tablesError) {
      console.log('❌ Could not get tables:', tablesError.message);
    } else {
      console.log('✅ Tables found:');
      if (tables && tables.length > 0) {
        tables.forEach(table => {
          console.log(`  - ${table.table_name}`);
        });
      } else {
        console.log('  (No tables found - database is empty)');
      }
    }
    
    // Test 3: Get RLS policies if tables exist
    if (tables && tables.length > 0) {
      console.log('\nTest 3: Getting RLS policies...');
      const { data: policies, error: policiesError } = await sourceClient
        .rpc('exec_sql', { 
          sql_query: "SELECT schemaname, tablename, policyname, cmd, roles, qual FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;" 
        });
      
      if (policiesError) {
        console.log('❌ Could not get policies:', policiesError.message);
      } else {
        console.log('✅ RLS Policies found:');
        if (policies && policies.length > 0) {
          policies.forEach(policy => {
            console.log(`  ${policy.tablename}.${policy.policyname} (${policy.cmd})`);
          });
        } else {
          console.log('  (No RLS policies found)');
        }
      }
      
      // Test 4: Get sample data from each table
      console.log('\nTest 4: Getting sample data from tables...');
      for (const table of tables) {
        const tableName = table.table_name;
        console.log(`\n📊 Analyzing table: ${tableName}`);
        
        try {
          // Get count
          const { data: countData, error: countError } = await sourceClient
            .rpc('exec_sql', { 
              sql_query: `SELECT COUNT(*) as count FROM ${tableName};` 
            });
          
          if (!countError && countData && countData.length > 0) {
            const count = countData[0].count;
            console.log(`   Records: ${count}`);
            
            if (count > 0) {
              // Get sample records
              const { data: sampleData, error: sampleError } = await sourceClient
                .rpc('exec_sql', { 
                  sql_query: `SELECT * FROM ${tableName} LIMIT 3;` 
                });
              
              if (!sampleError && sampleData && sampleData.length > 0) {
                console.log(`   Sample data:`, JSON.stringify(sampleData, null, 2));
              }
            }
          }
        } catch (tableError) {
          console.log(`   ❌ Error accessing table: ${tableError.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testExecSqlFunction().catch(console.error);
