import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

const checkAchievementsSchema = z.object({
  user_id: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = checkAchievementsSchema.parse(body)

    // Verify the user is checking their own achievements
    if (user.id !== validatedData.user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get all achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')
      .order('points', { ascending: false })

    if (achievementsError) {
      console.error('Error fetching achievements:', achievementsError)
      return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 })
    }

    // Get user's current achievements
    const { data: userAchievements, error: userAchievementsError } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', user.id)

    if (userAchievementsError) {
      console.error('Error fetching user achievements:', userAchievementsError)
      return NextResponse.json({ error: 'Failed to fetch user achievements' }, { status: 500 })
    }

    const earnedAchievementIds = new Set(userAchievements?.map(ua => ua.achievement_id) || [])

    // Get user's streak data for achievement calculations
    const { data: userStreaks, error: userStreaksError } = await supabase
      .from('user_streaks')
      .select(`
        current_streak_days,
        longest_streak_days,
        streak:streaks (
          category,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (userStreaksError) {
      console.error('Error fetching user streaks:', userStreaksError)
      return NextResponse.json({ error: 'Failed to fetch user streaks' }, { status: 500 })
    }

    // Get user's check-in data
    const { data: checkins, error: checkinsError } = await supabase
      .from('checkins')
      .select(`
        checkin_date,
        user_streak:user_streaks!inner (
          streak:streaks (
            category
          )
        )
      `)
      .eq('user_streak.user_id', user.id)

    if (checkinsError) {
      console.error('Error fetching checkins:', checkinsError)
      return NextResponse.json({ error: 'Failed to fetch checkins' }, { status: 500 })
    }

    // Calculate user stats
    const totalStreaks = userStreaks?.length || 0
    const totalCheckins = checkins?.length || 0
    const longestStreak = Math.max(...(userStreaks?.map(us => us.longest_streak_days) || [0]))
    const currentStreak = Math.max(...(userStreaks?.map(us => us.current_streak_days) || [0]))
    
    // Calculate streaks by category
    const streaksByCategory = userStreaks?.reduce((acc, us) => {
      const category = us.streak?.category || 'Other'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Calculate check-ins by category
    const checkinsByCategory = checkins?.reduce((acc, checkin) => {
      const category = checkin.user_streak?.streak?.category || 'Other'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Check for new achievements
    const newAchievements = []
    
    for (const achievement of achievements || []) {
      if (earnedAchievementIds.has(achievement.id)) continue

      let shouldEarn = false
      const criteria = achievement.criteria

      switch (achievement.name) {
        case 'First Streak':
          shouldEarn = totalStreaks >= 1
          break
        case 'Streak Starter':
          shouldEarn = totalStreaks >= 3
          break
        case 'Streak Master':
          shouldEarn = totalStreaks >= 10
          break
        case 'Streak Legend':
          shouldEarn = totalStreaks >= 25
          break
        case 'First Check-in':
          shouldEarn = totalCheckins >= 1
          break
        case 'Consistent':
          shouldEarn = totalCheckins >= 7
          break
        case 'Dedicated':
          shouldEarn = totalCheckins >= 30
          break
        case 'Unstoppable':
          shouldEarn = totalCheckins >= 100
          break
        case 'Week Warrior':
          shouldEarn = longestStreak >= 7
          break
        case 'Month Master':
          shouldEarn = longestStreak >= 30
          break
        case 'Century Club':
          shouldEarn = longestStreak >= 100
          break
        case 'Year Champion':
          shouldEarn = longestStreak >= 365
          break
        case 'Health Enthusiast':
          shouldEarn = streaksByCategory['Health & Fitness'] >= 3
          break
        case 'Learning Lover':
          shouldEarn = streaksByCategory['Learning & Education'] >= 3
          break
        case 'Productivity Pro':
          shouldEarn = streaksByCategory['Productivity'] >= 3
          break
        case 'Social Butterfly':
          shouldEarn = streaksByCategory['Social & Relationships'] >= 3
          break
        case 'Creative Soul':
          shouldEarn = streaksByCategory['Creativity & Hobbies'] >= 3
          break
        case 'Wellness Warrior':
          shouldEarn = streaksByCategory['Mindfulness & Wellness'] >= 3
          break
        case 'Category Collector':
          shouldEarn = Object.keys(streaksByCategory).length >= 5
          break
        case 'Diverse Achiever':
          shouldEarn = Object.keys(streaksByCategory).length >= 8
          break
        case 'Check-in Champion':
          shouldEarn = totalCheckins >= 500
          break
        case 'Streak Streak':
          shouldEarn = currentStreak >= 7
          break
        case 'Monthly Marvel':
          shouldEarn = currentStreak >= 30
          break
        case 'Perfect Week':
          shouldEarn = totalCheckins >= 7 && longestStreak >= 7
          break
        case 'Perfect Month':
          shouldEarn = totalCheckins >= 30 && longestStreak >= 30
          break
        case 'All-Star':
          shouldEarn = totalStreaks >= 10 && totalCheckins >= 100 && longestStreak >= 30
          break
        case 'Legendary':
          shouldEarn = totalStreaks >= 25 && totalCheckins >= 500 && longestStreak >= 100
          break
      }

      if (shouldEarn) {
        // Award the achievement
        const { data: newAchievement, error: awardError } = await supabase
          .from('user_achievements')
          .insert({
            user_id: user.id,
            achievement_id: achievement.id,
          })
          .select(`
            id,
            earned_at,
            achievement:achievements (*)
          `)
          .single()

        if (awardError) {
          console.error('Error awarding achievement:', awardError)
        } else {
          newAchievements.push(newAchievement)
          
          // Create notification for the achievement
          await supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              type: 'milestone',
              title: 'Achievement Unlocked!',
              message: `You've earned the "${achievement.name}" achievement!`,
              data: {
                achievement_id: achievement.id,
                achievement_name: achievement.name,
                points: achievement.points
              }
            })
        }
      }
    }

    return NextResponse.json({ 
      newAchievements,
      totalEarned: newAchievements.length,
      message: `Checked ${achievements?.length || 0} achievements, earned ${newAchievements.length} new ones`
    })

  } catch (error) {
    console.error('Error in check achievements API:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid data', 
        details: error.issues 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id') || user.id

    // Get user's achievements with progress
    const { data: userAchievements, error: userAchievementsError } = await supabase
      .from('user_achievements')
      .select(`
        id,
        earned_at,
        achievement:achievements (*)
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })

    if (userAchievementsError) {
      console.error('Error fetching user achievements:', userAchievementsError)
      return NextResponse.json({ error: 'Failed to fetch user achievements' }, { status: 500 })
    }

    // Get all achievements for progress calculation
    const { data: allAchievements, error: allAchievementsError } = await supabase
      .from('achievements')
      .select('*')
      .order('points', { ascending: false })

    if (allAchievementsError) {
      console.error('Error fetching all achievements:', allAchievementsError)
      return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 })
    }

    // Get user stats for progress calculation
    const { data: userStreaks, error: userStreaksError } = await supabase
      .from('user_streaks')
      .select(`
        current_streak_days,
        longest_streak_days,
        streak:streaks (
          category,
          created_at
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)

    if (userStreaksError) {
      console.error('Error fetching user streaks:', userStreaksError)
      return NextResponse.json({ error: 'Failed to fetch user streaks' }, { status: 500 })
    }

    const { data: checkins, error: checkinsError } = await supabase
      .from('checkins')
      .select(`
        checkin_date,
        user_streak:user_streaks!inner (
          streak:streaks (
            category
          )
        )
      `)
      .eq('user_streak.user_id', userId)

    if (checkinsError) {
      console.error('Error fetching checkins:', checkinsError)
      return NextResponse.json({ error: 'Failed to fetch checkins' }, { status: 500 })
    }

    // Calculate progress for all achievements
    const totalStreaks = userStreaks?.length || 0
    const totalCheckins = checkins?.length || 0
    const longestStreak = Math.max(...(userStreaks?.map(us => us.longest_streak_days) || [0]))
    const currentStreak = Math.max(...(userStreaks?.map(us => us.current_streak_days) || [0]))
    
    const streaksByCategory = userStreaks?.reduce((acc, us) => {
      const category = us.streak?.category || 'Other'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const earnedAchievementIds = new Set(userAchievements?.map(ua => ua.achievement_id) || [])

    const achievementProgress = allAchievements?.map(achievement => {
      const isEarned = earnedAchievementIds.has(achievement.id)
      const earnedAt = userAchievements?.find(ua => ua.achievement_id === achievement.id)?.earned_at

      let progress = 0
      let maxProgress = 1

      switch (achievement.name) {
        case 'First Streak':
          progress = Math.min(totalStreaks, 1)
          maxProgress = 1
          break
        case 'Streak Starter':
          progress = Math.min(totalStreaks, 3)
          maxProgress = 3
          break
        case 'Streak Master':
          progress = Math.min(totalStreaks, 10)
          maxProgress = 10
          break
        case 'Streak Legend':
          progress = Math.min(totalStreaks, 25)
          maxProgress = 25
          break
        case 'First Check-in':
          progress = Math.min(totalCheckins, 1)
          maxProgress = 1
          break
        case 'Consistent':
          progress = Math.min(totalCheckins, 7)
          maxProgress = 7
          break
        case 'Dedicated':
          progress = Math.min(totalCheckins, 30)
          maxProgress = 30
          break
        case 'Unstoppable':
          progress = Math.min(totalCheckins, 100)
          maxProgress = 100
          break
        case 'Week Warrior':
          progress = Math.min(longestStreak, 7)
          maxProgress = 7
          break
        case 'Month Master':
          progress = Math.min(longestStreak, 30)
          maxProgress = 30
          break
        case 'Century Club':
          progress = Math.min(longestStreak, 100)
          maxProgress = 100
          break
        case 'Year Champion':
          progress = Math.min(longestStreak, 365)
          maxProgress = 365
          break
        case 'Health Enthusiast':
          progress = Math.min(streaksByCategory['Health & Fitness'] || 0, 3)
          maxProgress = 3
          break
        case 'Learning Lover':
          progress = Math.min(streaksByCategory['Learning & Education'] || 0, 3)
          maxProgress = 3
          break
        case 'Productivity Pro':
          progress = Math.min(streaksByCategory['Productivity'] || 0, 3)
          maxProgress = 3
          break
        case 'Social Butterfly':
          progress = Math.min(streaksByCategory['Social & Relationships'] || 0, 3)
          maxProgress = 3
          break
        case 'Creative Soul':
          progress = Math.min(streaksByCategory['Creativity & Hobbies'] || 0, 3)
          maxProgress = 3
          break
        case 'Wellness Warrior':
          progress = Math.min(streaksByCategory['Mindfulness & Wellness'] || 0, 3)
          maxProgress = 3
          break
        case 'Category Collector':
          progress = Math.min(Object.keys(streaksByCategory).length, 5)
          maxProgress = 5
          break
        case 'Diverse Achiever':
          progress = Math.min(Object.keys(streaksByCategory).length, 8)
          maxProgress = 8
          break
        case 'Check-in Champion':
          progress = Math.min(totalCheckins, 500)
          maxProgress = 500
          break
        case 'Streak Streak':
          progress = Math.min(currentStreak, 7)
          maxProgress = 7
          break
        case 'Monthly Marvel':
          progress = Math.min(currentStreak, 30)
          maxProgress = 30
          break
        case 'Perfect Week':
          progress = Math.min(Math.min(totalCheckins, 7) + Math.min(longestStreak, 7), 14)
          maxProgress = 14
          break
        case 'Perfect Month':
          progress = Math.min(Math.min(totalCheckins, 30) + Math.min(longestStreak, 30), 60)
          maxProgress = 60
          break
        case 'All-Star':
          progress = Math.min(totalStreaks + totalCheckins + longestStreak, 140)
          maxProgress = 140
          break
        case 'Legendary':
          progress = Math.min(totalStreaks + totalCheckins + longestStreak, 625)
          maxProgress = 625
          break
        default:
          progress = isEarned ? 1 : 0
          maxProgress = 1
      }

      return {
        achievement,
        progress,
        maxProgress,
        isEarned,
        earnedAt,
        progressPercentage: maxProgress > 0 ? Math.round((progress / maxProgress) * 100) : 0
      }
    }) || []

    return NextResponse.json({ 
      achievements: achievementProgress,
      earnedAchievements: userAchievements || [],
      totalPoints: userAchievements?.reduce((sum, ua) => sum + (ua.achievement?.points || 0), 0) || 0,
      totalEarned: userAchievements?.length || 0,
      totalAvailable: allAchievements?.length || 0
    })

  } catch (error) {
    console.error('Error in get achievements API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
