#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Target database configuration
const TARGET_SUPABASE_URL = 'https://pepgldetpvaiwawmmxox.supabase.co';
const TARGET_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcGdsZGV0cHZhaXdhd21teG94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM3Mzk1NSwiZXhwIjoyMDc1OTQ5OTU1fQ.qg308rqUcyaTsa0KQsEejffhhv4bhxmBQWmZP4iyWss';

// Initialize client
const targetClient = createClient(TARGET_SUPABASE_URL, TARGET_SERVICE_ROLE_KEY);

async function executeTableCreation() {
  console.log('🔨 Creating Essential Tables in Target Database');
  console.log('=' .repeat(60));
  
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('/Users/yuvrajbarsara/golong/create-essential-tables.sql', 'utf8');
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    console.log('=' .repeat(60));
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}`);
      
      try {
        const { error } = await targetClient
          .rpc('exec_sql', { 
            sql_query: statement 
          });
        
        if (error) {
          console.log(`❌ Error: ${error.message}`);
          errorCount++;
        } else {
          console.log(`✅ Success`);
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Exception: ${err.message}`);
        errorCount++;
      }
      
      // Small delay between statements
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n📊 Execution Summary');
    console.log('=' .repeat(60));
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 All tables created successfully!');
    } else {
      console.log('\n⚠️  Some statements failed, but tables may have been created');
    }
    
  } catch (error) {
    console.error('❌ Failed to execute table creation:', error.message);
  }
}

// Run the script
executeTableCreation().catch(console.error);

