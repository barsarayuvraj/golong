// Check RLS policies for user_streaks table
const { Client } = require('pg')
require('dotenv').config({ path: '.env.local' })

async function checkUserStreaksPolicies() {
  const client = new Client({
    host: 'db.pepgldetpvaiwawmmxox.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres.pepgldetpvaiwawmmxox',
    password: 'Bangalore*123', // Using the same password
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('✅ Connected to new database')

    // Check user_streaks RLS policies
    const result = await client.query(`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
      FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'user_streaks' 
      ORDER BY tablename, policyname;
    `)

    console.log('\n📋 RLS Policies for user_streaks table:')
    console.log('Rows found:', result.rows.length)
    
    if (result.rows.length === 0) {
      console.log('❌ NO RLS POLICIES FOUND - This is likely the cause of the 500 error!')
      console.log('💡 We need to create INSERT policy for user_streaks table')
    } else {
      result.rows.forEach((row, index) => {
        console.log(`\nPolicy ${index + 1}:`)
        console.log(`  Name: ${row.policyname}`)
        console.log(`  Command: ${row.cmd}`)
        console.log(`  Roles: ${row.roles}`)
        console.log(`  Qual: ${row.qual}`)
        console.log(`  With Check: ${row.with_check}`)
      })
    }

    // Also check if RLS is enabled
    const rlsResult = await client.query(`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'user_streaks';
    `)

    console.log('\n🔒 RLS Status for user_streaks:')
    console.log('RLS Enabled:', rlsResult.rows[0]?.rowsecurity || 'Unknown')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

checkUserStreaksPolicies()
