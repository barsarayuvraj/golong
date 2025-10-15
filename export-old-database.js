// Script to export data from the old Supabase database
// This will help us recover data before it's lost

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Old Supabase project credentials
const OLD_SUPABASE_URL = 'https://gzhccauxdtboxrurwogk.supabase.co'
const OLD_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6aGNjYXV4ZHRib3hydXJ3b2drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE1ODU0NzQsImV4cCI6MjA0NzE2MTQ3NH0.9P8z8Q8z8Q8z8Q8z8Q8z8Q8z8Q8z8Q8z8Q8z8Q8z8'

// New Supabase project credentials
const NEW_SUPABASE_URL = 'https://pepgldetpvaiwawmmxox.supabase.co'
const NEW_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcGdsZGV0cHZhaXdhd21teG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNzM5NTUsImV4cCI6MjA3NTk0OTk1NX0.cOdq0tVwyIwDU1fjvE3iUG7qAl-UitXnHX_QXeWcZmI'

async function exportOldDatabase() {
  console.log('🔄 Attempting to connect to old Supabase database...')
  
  try {
    const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_ANON_KEY)
    
    // Test connection
    console.log('📡 Testing connection to old database...')
    const { data: testData, error: testError } = await oldSupabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (testError) {
      console.error('❌ Cannot connect to old database:', testError.message)
      console.log('This might be due to:')
      console.log('- Database restrictions still active')
      console.log('- Network connectivity issues')
      console.log('- Invalid credentials')
      return
    }
    
    console.log('✅ Successfully connected to old database!')
    console.log('📊 Starting data export...')
    
    // Export all data
    const exportData = {
      timestamp: new Date().toISOString(),
      source: 'old_supabase_project',
      data: {}
    }
    
    // 1. Export profiles
    console.log('📋 Exporting profiles...')
    const { data: profiles, error: profilesError } = await oldSupabase
      .from('profiles')
      .select('*')
    
    if (profilesError) {
      console.error('Error exporting profiles:', profilesError)
    } else {
      exportData.data.profiles = profiles || []
      console.log(`✅ Exported ${profiles?.length || 0} profiles`)
    }
    
    // 2. Export streaks
    console.log('📋 Exporting streaks...')
    const { data: streaks, error: streaksError } = await oldSupabase
      .from('streaks')
      .select('*')
    
    if (streaksError) {
      console.error('Error exporting streaks:', streaksError)
    } else {
      exportData.data.streaks = streaks || []
      console.log(`✅ Exported ${streaks?.length || 0} streaks`)
    }
    
    // 3. Export user_streaks
    console.log('📋 Exporting user_streaks...')
    const { data: userStreaks, error: userStreaksError } = await oldSupabase
      .from('user_streaks')
      .select('*')
    
    if (userStreaksError) {
      console.error('Error exporting user_streaks:', userStreaksError)
    } else {
      exportData.data.user_streaks = userStreaks || []
      console.log(`✅ Exported ${userStreaks?.length || 0} user_streaks`)
    }
    
    // 4. Export checkins
    console.log('📋 Exporting checkins...')
    const { data: checkins, error: checkinsError } = await oldSupabase
      .from('checkins')
      .select('*')
    
    if (checkinsError) {
      console.error('Error exporting checkins:', checkinsError)
    } else {
      exportData.data.checkins = checkins || []
      console.log(`✅ Exported ${checkins?.length || 0} checkins`)
    }
    
    // 5. Export comments
    console.log('📋 Exporting comments...')
    const { data: comments, error: commentsError } = await oldSupabase
      .from('comments')
      .select('*')
    
    if (commentsError) {
      console.error('Error exporting comments:', commentsError)
    } else {
      exportData.data.comments = comments || []
      console.log(`✅ Exported ${comments?.length || 0} comments`)
    }
    
    // 6. Export likes
    console.log('📋 Exporting likes...')
    const { data: likes, error: likesError } = await oldSupabase
      .from('likes')
      .select('*')
    
    if (likesError) {
      console.error('Error exporting likes:', likesError)
    } else {
      exportData.data.likes = likes || []
      console.log(`✅ Exported ${likes?.length || 0} likes`)
    }
    
    // 7. Export RLS policies (if accessible)
    console.log('📋 Attempting to export RLS policies...')
    try {
      const { data: policies, error: policiesError } = await oldSupabase
        .rpc('get_rls_policies')
      
      if (!policiesError && policies) {
        exportData.data.rls_policies = policies
        console.log(`✅ Exported RLS policies`)
      }
    } catch (error) {
      console.log('⚠️  Could not export RLS policies (this is normal)')
    }
    
    // Save export to file
    const filename = `old-database-export-${new Date().toISOString().split('T')[0]}.json`
    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2))
    
    console.log(`🎉 Export completed! Data saved to: ${filename}`)
    console.log('\n📊 Export Summary:')
    console.log(`- Profiles: ${exportData.data.profiles?.length || 0}`)
    console.log(`- Streaks: ${exportData.data.streaks?.length || 0}`)
    console.log(`- User Streaks: ${exportData.data.user_streaks?.length || 0}`)
    console.log(`- Checkins: ${exportData.data.checkins?.length || 0}`)
    console.log(`- Comments: ${exportData.data.comments?.length || 0}`)
    console.log(`- Likes: ${exportData.data.likes?.length || 0}`)
    
    return exportData
    
  } catch (error) {
    console.error('❌ Export failed:', error)
  }
}

// Run the export
exportOldDatabase()

