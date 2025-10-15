// Script to migrate exported data from old database to new database
const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// New database connection (current working database)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrateData() {
  console.log('🔄 Starting data migration to new database...')
  
  try {
    // Read exported data files (you'll need to create these from the SQL queries)
    const dataFiles = {
      profiles: 'exported-profiles.json',
      streaks: 'exported-streaks.json', 
      user_streaks: 'exported-user-streaks.json',
      checkins: 'exported-checkins.json',
      comments: 'exported-comments.json',
      likes: 'exported-likes.json'
    }
    
    // Check if data files exist
    for (const [table, filename] of Object.entries(dataFiles)) {
      if (!fs.existsSync(filename)) {
        console.log(`⚠️  Data file ${filename} not found. Skipping ${table}.`)
        continue
      }
      
      console.log(`📋 Migrating ${table}...`)
      const data = JSON.parse(fs.readFileSync(filename, 'utf8'))
      
      if (data.length === 0) {
        console.log(`✅ No data to migrate for ${table}`)
        continue
      }
      
      // Insert data into new database
      const { error } = await supabase
        .from(table)
        .insert(data)
      
      if (error) {
        console.error(`❌ Error migrating ${table}:`, error.message)
      } else {
        console.log(`✅ Successfully migrated ${data.length} records to ${table}`)
      }
    }
    
    console.log('🎉 Data migration completed!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
  }
}

// Helper function to convert CSV/JSON export to proper format
function convertExportToJSON(exportData, tableName) {
  // This function will help convert the exported data to the correct format
  // You may need to adjust based on your export format
  console.log(`Converting ${tableName} export data...`)
  
  // Example conversion logic (adjust based on your actual export format)
  if (Array.isArray(exportData)) {
    return exportData
  }
  
  // If it's a string (CSV or SQL), you'll need to parse it
  // This is a placeholder - implement based on your export format
  return []
}

// Instructions for the user
console.log(`
📋 INSTRUCTIONS FOR DATA MIGRATION:

1. Go to: https://supabase.com/dashboard/project/gzhccauxdtboxrurwogk/sql
2. Run each query from manual-export-sql-queries.sql
3. Export results as JSON files with these names:
   - exported-profiles.json
   - exported-streaks.json
   - exported-user-streaks.json
   - exported-checkins.json
   - exported-comments.json
   - exported-likes.json

4. Place the JSON files in this directory
5. Run: node migrate-exported-data.js

⚠️  IMPORTANT: Make sure the JSON files contain arrays of objects, not raw SQL results.
`)

// Run migration if data files exist
migrateData()
