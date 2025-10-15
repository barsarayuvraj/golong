// Simple database connection test to check if old database is accessible
const { Client } = require('pg')

const configs = [
  // Direct connection to old database
  {
    name: 'Old Database (Direct)',
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.gzhccauxdtboxrurwogk',
    password: 'Bangalore*123',
    ssl: { rejectUnauthorized: false }
  },
  // Alternative connection method
  {
    name: 'Old Database (Alternative)',
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.gzhccauxdtboxrurwogk',
    password: 'Bangalore*123',
    ssl: { rejectUnauthorized: false }
  },
  // New database (to verify our connection works)
  {
    name: 'New Database (Test)',
    host: 'db.pepgldetpvaiwawmmxox.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres.pepgldetpvaiwawmmxox',
    password: 'Bangalore*123', // Using same password for test
    ssl: { rejectUnauthorized: false }
  }
]

async function testConnection(config) {
  console.log(`\n🔄 Testing connection to: ${config.name}`)
  console.log(`📍 Host: ${config.host}:${config.port}`)
  
  const client = new Client(config)
  
  try {
    await client.connect()
    console.log('✅ Connection successful!')
    
    // Try a simple query
    const result = await client.query('SELECT NOW() as current_time, current_database() as db_name')
    console.log('📊 Query result:', result.rows[0])
    
    // If this is the old database, try to get table info
    if (config.name.includes('Old')) {
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `)
      console.log('📋 Available tables:', tablesResult.rows.map(r => r.table_name))
      
      // Try to get row counts
      for (const table of tablesResult.rows) {
        try {
          const countResult = await client.query(`SELECT COUNT(*) FROM public.${table.table_name}`)
          console.log(`  - ${table.table_name}: ${countResult.rows[0].count} rows`)
        } catch (err) {
          console.log(`  - ${table.table_name}: Error getting count`)
        }
      }
    }
    
    await client.end()
    return true
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message)
    await client.end().catch(() => {})
    return false
  }
}

async function runTests() {
  console.log('🧪 Testing database connections...\n')
  
  let oldDbAccessible = false
  
  for (const config of configs) {
    const success = await testConnection(config)
    if (config.name.includes('Old') && success) {
      oldDbAccessible = true
    }
  }
  
  console.log('\n📊 Test Summary:')
  if (oldDbAccessible) {
    console.log('✅ Old database is accessible! We can proceed with data export.')
  } else {
    console.log('❌ Old database is not accessible.')
    console.log('💡 Options:')
    console.log('  1. Contact Supabase support for data recovery')
    console.log('  2. Try accessing the dashboard manually')
    console.log('  3. Wait for restrictions to be lifted')
  }
}

runTests()
