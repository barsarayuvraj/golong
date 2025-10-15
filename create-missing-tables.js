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

async function getTableSchema(tableName) {
  console.log(`📋 Getting schema for ${tableName}...`);
  
  try {
    const { data, error } = await sourceClient
      .rpc('exec_sql', { 
        sql_query: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length,
            numeric_precision,
            numeric_scale
          FROM information_schema.columns 
          WHERE table_name = '${tableName}' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        ` 
      });
    
    if (error) {
      console.log(`❌ Error getting schema for ${tableName}:`, error.message);
      return null;
    }
    
    return data;
  } catch (err) {
    console.log(`❌ Exception getting schema for ${tableName}:`, err.message);
    return null;
  }
}

async function getTableConstraints(tableName) {
  console.log(`🔗 Getting constraints for ${tableName}...`);
  
  try {
    const { data, error } = await sourceClient
      .rpc('exec_sql', { 
        sql_query: `
          SELECT 
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          LEFT JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
          WHERE tc.table_name = '${tableName}' 
          AND tc.table_schema = 'public'
          ORDER BY tc.constraint_type, tc.constraint_name;
        ` 
      });
    
    if (error) {
      console.log(`❌ Error getting constraints for ${tableName}:`, error.message);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.log(`❌ Exception getting constraints for ${tableName}:`, err.message);
    return [];
  }
}

function generateCreateTableSQL(tableName, columns, constraints) {
  let sql = `CREATE TABLE IF NOT EXISTS public.${tableName} (\n`;
  
  // Debug: Check if columns is an array
  if (!Array.isArray(columns)) {
    console.log(`❌ Columns is not an array for ${tableName}:`, typeof columns, columns);
    return null;
  }
  
  // Add columns
  const columnDefs = columns.map(col => {
    let def = `  ${col.column_name} `;
    
    // Handle data types
    switch (col.data_type) {
      case 'character varying':
        def += `VARCHAR(${col.character_maximum_length || 255})`;
        break;
      case 'text':
        def += 'TEXT';
        break;
      case 'uuid':
        def += 'UUID';
        break;
      case 'timestamp with time zone':
        def += 'TIMESTAMPTZ';
        break;
      case 'timestamp without time zone':
        def += 'TIMESTAMP';
        break;
      case 'date':
        def += 'DATE';
        break;
      case 'time without time zone':
        def += 'TIME';
        break;
      case 'boolean':
        def += 'BOOLEAN';
        break;
      case 'integer':
        def += 'INTEGER';
        break;
      case 'bigint':
        def += 'BIGINT';
        break;
      case 'numeric':
        if (col.numeric_precision && col.numeric_scale) {
          def += `NUMERIC(${col.numeric_precision},${col.numeric_scale})`;
        } else {
          def += 'NUMERIC';
        }
        break;
      case 'json':
      case 'jsonb':
        def += 'JSONB';
        break;
      case 'ARRAY':
        def += 'TEXT[]';
        break;
      default:
        def += col.data_type.toUpperCase();
    }
    
    // Handle nullable
    if (col.is_nullable === 'NO') {
      def += ' NOT NULL';
    }
    
    // Handle default values
    if (col.column_default) {
      def += ` DEFAULT ${col.column_default}`;
    }
    
    return def;
  });
  
  sql += columnDefs.join(',\n');
  
  // Add primary key constraints
  const primaryKeys = constraints.filter(c => c.constraint_type === 'PRIMARY KEY');
  if (primaryKeys.length > 0) {
    const pkColumns = primaryKeys.map(pk => pk.column_name).join(', ');
    sql += `,\n  PRIMARY KEY (${pkColumns})`;
  }
  
  sql += '\n);';
  
  return sql;
}

async function createTableInTarget(tableName, sql) {
  console.log(`🔨 Creating table ${tableName} in target database...`);
  
  try {
    const { error } = await targetClient
      .rpc('exec_sql', { 
        sql_query: sql 
      });
    
    if (error) {
      console.log(`❌ Error creating table ${tableName}:`, error.message);
      return false;
    }
    
    console.log(`✅ Successfully created table ${tableName}`);
    return true;
  } catch (err) {
    console.log(`❌ Exception creating table ${tableName}:`, err.message);
    return false;
  }
}

async function getExistingTables() {
  try {
    const { data, error } = await targetClient
      .rpc('exec_sql', { 
        sql_query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" 
      });
    
    if (error) {
      console.log(`❌ Error getting existing tables:`, error.message);
      return [];
    }
    
    return data.map(row => row.table_name);
  } catch (err) {
    console.log(`❌ Exception getting existing tables:`, err.message);
    return [];
  }
}

async function createMissingTables() {
  console.log('🔨 Creating Missing Tables in Target Database');
  console.log('=' .repeat(60));
  
  // Get all tables from source
  const { data: allTables, error } = await sourceClient
    .rpc('exec_sql', { 
      sql_query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" 
    });
  
  if (error) {
    console.log('❌ Error getting source tables:', error.message);
    return;
  }
  
  // Get existing tables from target
  const existingTables = await getExistingTables();
  console.log(`📋 Existing tables in target: ${existingTables.join(', ')}`);
  
  // Find missing tables
  const missingTables = allTables
    .map(row => row.table_name)
    .filter(tableName => !existingTables.includes(tableName));
  
  console.log(`📋 Missing tables to create: ${missingTables.join(', ')}`);
  console.log('=' .repeat(60));
  
  // Create missing tables
  for (const tableName of missingTables) {
    console.log(`\n🔄 Processing table: ${tableName}`);
    
    // Get table schema
    const columns = await getTableSchema(tableName);
    if (!columns) {
      console.log(`⏭️  Skipping ${tableName} - could not get schema`);
      continue;
    }
    
    // Get constraints
    const constraints = await getTableConstraints(tableName);
    
    // Generate CREATE TABLE SQL
    const createSQL = generateCreateTableSQL(tableName, columns, constraints);
    if (!createSQL) {
      console.log(`❌ Failed to generate SQL for ${tableName}`);
      continue;
    }
    
    console.log(`📝 Generated SQL for ${tableName}:`);
    console.log(createSQL);
    
    // Create table in target
    const success = await createTableInTarget(tableName, createSQL);
    
    if (!success) {
      console.log(`❌ Failed to create ${tableName}`);
    }
    
    // Small delay between tables
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 Table creation completed!');
}

// Run the script
createMissingTables().catch(console.error);
