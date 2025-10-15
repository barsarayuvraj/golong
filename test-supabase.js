// Simple test to check Supabase connection
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function testSupabase() {
  try {
    console.log('Testing Supabase connection...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('Supabase URL:', supabaseUrl)
    console.log('Supabase Key:', supabaseKey ? 'Present' : 'Missing')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables')
      return
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log('Created Supabase client, testing connection...')
    
    // Try a simple query with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
    )
    
    const queryPromise = supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    const result = await Promise.race([queryPromise, timeoutPromise])
    
    console.log('✅ Connection successful!')
    console.log('Result:', result)
    
  } catch (error) {
    console.error('❌ Connection failed:')
    console.error('Error:', error.message)
    
    if (error.message.includes('522')) {
      console.error('This is a Supabase server timeout issue (Error 522)')
      console.error('Check your Supabase dashboard for server status')
    }
  }
}

testSupabase()
