#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Source database configuration
const SOURCE_SUPABASE_URL = 'https://gzhccauxdtboxurrwogk.supabase.co';
const SOURCE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6aGNjYXV4ZHRib3hydXJ3b2drIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1NDg5MiwiZXhwIjoyMDc1NTMwODkyfQ.mJLR6mNEMW2k2JryXdbKIO5qwTiDvK-is5j6oPMPUBk';

// Initialize client
const sourceClient = createClient(SOURCE_SUPABASE_URL, SOURCE_SERVICE_ROLE_KEY);

// The exec_sql function SQL
const execSqlFunction = `
-- Create exec_sql function for MCP server
-- This function allows safe execution of SELECT queries only

CREATE OR REPLACE FUNCTION public.exec_sql(sql_query TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    rec RECORD;
    rows_array JSON[] := '{}';
BEGIN
    -- Basic security check - only allow SELECT statements
    IF NOT (upper(trim(sql_query)) LIKE 'SELECT%') THEN
        RAISE EXCEPTION 'Only SELECT queries are allowed';
    END IF;
    
    -- Additional security checks for dangerous keywords
    IF upper(sql_query) ~ '(DROP|DELETE|TRUNCATE|ALTER|CREATE|INSERT|UPDATE|GRANT|REVOKE|EXECUTE)' THEN
        RAISE EXCEPTION 'Dangerous SQL keywords detected. Only SELECT queries are allowed.';
    END IF;
    
    -- Execute the query and convert result to JSON
    FOR rec_record IN EXECUTE sql_query LOOP
        rows_array := array_append(rows_array, row_to_json(rec_record));
    END LOOP;
    
    -- Return the result as JSON
    result := array_to_json(rows_array);
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error information as JSON
        RETURN json_build_object(
            'error', true,
            'message', SQLERRM,
            'code', SQLSTATE
        );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO service_role;
`;

async function main() {
  console.log('🔧 Creating exec_sql function in source database...\n');
  console.log('⚠️  Note: This requires manual execution in Supabase SQL Editor\n');
  
  console.log('📋 Please copy and paste the following SQL into your Supabase SQL Editor:');
  console.log('   (Go to: Project Settings → Database → SQL Editor)');
  console.log('');
  console.log('=' .repeat(80));
  console.log(execSqlFunction);
  console.log('=' .repeat(80));
  console.log('');
  
  console.log('🔄 After executing the SQL, let\'s test the function...');
  console.log('');
  
  // Test the function after a delay
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('🧪 Testing the exec_sql function...');
  
  try {
    const { data: testData, error: testError } = await sourceClient
      .rpc('exec_sql', { 
        sql_query: "SELECT 1 as test_column, 'Hello World' as message;" 
      });
    
    if (testError) {
      console.log('❌ Function test failed:', testError.message);
      console.log('   Make sure you have executed the SQL in the Supabase SQL Editor');
    } else {
      console.log('✅ Function test successful!');
      console.log('Test result:', JSON.stringify(testData, null, 2));
      
      // Now try to get database information
      console.log('\n📊 Getting database information...');
      
      try {
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
      } catch (tablesErr) {
        console.log('❌ Error getting tables:', tablesErr.message);
      }
    }
  } catch (testErr) {
    console.log('❌ Function test error:', testErr.message);
    console.log('   Make sure you have executed the SQL in the Supabase SQL Editor');
  }
}

main().catch(console.error);