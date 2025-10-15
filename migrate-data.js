// Data Migration Script for GoLong
// This script can help import data from exported JSON files

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Function to import streaks from JSON file
async function importStreaks(filePath) {
  try {
    const fs = require('fs')
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    
    console.log('📊 Importing data from:', filePath)
    console.log('Found streaks:', data.streaks?.length || 0)
    
    for (const userStreak of data.streaks || []) {
      const streak = userStreak.streak || userStreak.streaks
      
      if (!streak) continue
      
      console.log(`Creating streak: ${streak.title}`)
      
      // Create the streak
      const { data: newStreak, error: streakError } = await supabase
        .from('streaks')
        .insert({
          title: streak.title,
          description: streak.description,
          category: streak.category,
          is_public: true,
          tags: []
        })
        .select()
        .single()
      
      if (streakError) {
        console.error('Error creating streak:', streakError)
        continue
      }
      
      // Create user_streak entry
      const { data: newUserStreak, error: userStreakError } = await supabase
        .from('user_streaks')
        .insert({
          user_id: userStreak.user_id, // You'll need to update this to your new user ID
          streak_id: newStreak.id,
          current_streak_days: userStreak.current_streak_days || 0,
          longest_streak_days: userStreak.longest_streak_days || 0,
          is_active: userStreak.is_active !== false
        })
        .select()
        .single()
      
      if (userStreakError) {
        console.error('Error creating user streak:', userStreakError)
        continue
      }
      
      console.log(`✅ Created streak: ${streak.title}`)
      
      // Import check-ins if available
      const checkins = data.checkins?.filter(c => 
        c.user_streak_id === userStreak.id || 
        c.user_streaks?.id === userStreak.id
      ) || []
      
      for (const checkin of checkins) {
        const { error: checkinError } = await supabase
          .from('checkins')
          .insert({
            user_streak_id: newUserStreak.id,
            checkin_date: checkin.checkin_date
          })
        
        if (checkinError) {
          console.error('Error creating checkin:', checkinError)
        } else {
          console.log(`  ✅ Added checkin: ${checkin.checkin_date}`)
        }
      }
    }
    
    console.log('🎉 Import completed!')
    
  } catch (error) {
    console.error('❌ Import failed:', error)
  }
}

// Usage instructions
console.log(`
📋 Data Migration Script for GoLong

Usage:
1. Export your data from the old database (if accessible)
2. Save the exported JSON file
3. Update the user_id in the exported data to your new user ID
4. Run: node migrate-data.js <path-to-exported-file.json>

Example:
node migrate-data.js ./my-exported-data.json

Note: You'll need to update user_id values in the exported data
to match your new user ID in the new database.
`)

// Check if file path provided
const filePath = process.argv[2]
if (filePath) {
  importStreaks(filePath)
} else {
  console.log('Please provide a file path to import.')
}

