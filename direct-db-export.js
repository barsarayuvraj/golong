// Direct PostgreSQL connection to export data from old Supabase database
const { Client } = require('pg')
const fs = require('fs')

// Old Supabase database connection details
// You'll need to provide the database password when prompted
const dbConfig = {
  host: 'aws-1-ap-south-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.gzhccauxdtboxrurwogk',
  password: '', // Will be prompted
  ssl: {
    rejectUnauthorized: false
  }
}

async function exportDatabase() {
  console.log('🔄 Attempting direct PostgreSQL connection to old database...')
  console.log('📋 This will export all your data including RLS policies')
  
  // Get password from user
  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  const password = await new Promise((resolve) => {
    rl.question('Enter your database password: ', (answer) => {
      rl.close()
      resolve(answer)
    })
  })
  
  dbConfig.password = password
  
  const client = new Client(dbConfig)
  
  try {
    console.log('📡 Connecting to database...')
    await client.connect()
    console.log('✅ Connected successfully!')
    
    const exportData = {
      timestamp: new Date().toISOString(),
      source: 'direct_postgres_connection',
      data: {},
      schema: {},
      policies: {}
    }
    
    // 1. Export table schemas
    console.log('📋 Exporting table schemas...')
    const schemaQuery = `
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `
    
    const { rows: schemaRows } = await client.query(schemaQuery)
    exportData.schema.tables = schemaRows
    console.log(`✅ Exported schema for ${schemaRows.length} columns`)
    
    // 2. Export RLS policies
    console.log('📋 Exporting RLS policies...')
    const policiesQuery = `
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies 
      WHERE schemaname = 'public';
    `
    
    const { rows: policyRows } = await client.query(policiesQuery)
    exportData.policies = policyRows
    console.log(`✅ Exported ${policyRows.length} RLS policies`)
    
    // 3. Export table data
    const tables = ['profiles', 'streaks', 'user_streaks', 'checkins', 'comments', 'likes']
    
    for (const table of tables) {
      try {
        console.log(`📋 Exporting ${table}...`)
        const { rows } = await client.query(`SELECT * FROM public.${table};`)
        exportData.data[table] = rows
        console.log(`✅ Exported ${rows.length} rows from ${table}`)
      } catch (error) {
        console.log(`⚠️  Could not export ${table}: ${error.message}`)
        exportData.data[table] = []
      }
    }
    
    // 4. Export indexes
    console.log('📋 Exporting indexes...')
    const indexesQuery = `
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public';
    `
    
    const { rows: indexRows } = await client.query(indexesQuery)
    exportData.schema.indexes = indexRows
    console.log(`✅ Exported ${indexRows.length} indexes`)
    
    // 5. Export functions and triggers
    console.log('📋 Exporting functions...')
    const functionsQuery = `
      SELECT 
        routine_name,
        routine_definition
      FROM information_schema.routines 
      WHERE routine_schema = 'public';
    `
    
    const { rows: functionRows } = await client.query(functionsQuery)
    exportData.schema.functions = functionRows
    console.log(`✅ Exported ${functionRows.length} functions`)
    
    // Save export to file
    const filename = `complete-database-export-${new Date().toISOString().split('T')[0]}.json`
    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2))
    
    console.log(`🎉 Complete export saved to: ${filename}`)
    console.log('\n📊 Export Summary:')
    console.log(`- Tables: ${Object.keys(exportData.data).length}`)
    console.log(`- RLS Policies: ${exportData.policies.length}`)
    console.log(`- Indexes: ${exportData.schema.indexes.length}`)
    console.log(`- Functions: ${exportData.schema.functions.length}`)
    
    Object.entries(exportData.data).forEach(([table, rows]) => {
      console.log(`  - ${table}: ${rows.length} rows`)
    })
    
  } catch (error) {
    console.error('❌ Export failed:', error.message)
    if (error.message.includes('timeout')) {
      console.log('💡 The database might still be restricted. Try contacting Supabase support.')
    }
  } finally {
    await client.end()
    console.log('🔌 Database connection closed')
  }
}

// Run the export
exportDatabase()

