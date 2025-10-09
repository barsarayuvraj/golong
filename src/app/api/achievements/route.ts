import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Validation schemas
const achievementSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  icon: z.string().optional(),
  criteria: z.object({
    min_days: z.number().optional(),
    min_streaks: z.number().optional(),
    min_comments: z.number().optional(),
    min_likes: z.number().optional(),
    min_group_members: z.number().optional(),
  }),
})

// GET /api/achievements - Get all achievements or user's achievements
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const user_achievements = searchParams.get('user_achievements') === 'true'
    const user_id = searchParams.get('user_id')

    if (user_achievements) {
      // Get user's earned achievements
      const targetUserId = user_id || user.id
      
      const { data: achievements, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements(*)
        `)
        .eq('user_id', targetUserId)
        .order('earned_at', { ascending: false })

      if (error) {
        console.error('Error fetching user achievements:', error)
        return NextResponse.json({ error: 'Failed to fetch user achievements' }, { status: 500 })
      }

      return NextResponse.json({ achievements })
    } else {
      // Get all available achievements
      const { data: achievements, error } = await supabase
        .from('achievements')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching achievements:', error)
        return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 })
      }

      // If user is authenticated, also get their earned achievements
      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', user.id)

      if (userAchievementsError) {
        console.error('Error fetching user achievements:', userAchievementsError)
      }

      const earnedAchievementIds = new Set(userAchievements?.map(ua => ua.achievement_id) || [])

      const achievementsWithStatus = achievements.map(achievement => ({
        ...achievement,
        earned: earnedAchievementIds.has(achievement.id),
        earned_at: userAchievements?.find(ua => ua.achievement_id === achievement.id)?.earned_at || null
      }))

      return NextResponse.json({ achievements: achievementsWithStatus })
    }
  } catch (error) {
    console.error('Achievements GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/achievements - Create a new achievement (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = achievementSchema.parse(body)

    const { data: achievement, error } = await supabase
      .from('achievements')
      .insert(validatedData)
      .select()
      .single()

    if (error) {
      console.error('Error creating achievement:', error)
      return NextResponse.json({ error: 'Failed to create achievement' }, { status: 500 })
    }

    return NextResponse.json({ achievement }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Achievements POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/achievements - Update an achievement (admin only)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const achievementId = searchParams.get('id')

    if (!achievementId) {
      return NextResponse.json({ error: 'Achievement ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = achievementSchema.partial().parse(body)

    const { data: achievement, error } = await supabase
      .from('achievements')
      .update(validatedData)
      .eq('id', achievementId)
      .select()
      .single()

    if (error) {
      console.error('Error updating achievement:', error)
      return NextResponse.json({ error: 'Failed to update achievement' }, { status: 500 })
    }

    return NextResponse.json({ achievement })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Achievements PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/achievements - Delete an achievement (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const achievementId = searchParams.get('id')

    if (!achievementId) {
      return NextResponse.json({ error: 'Achievement ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('achievements')
      .delete()
      .eq('id', achievementId)

    if (error) {
      console.error('Error deleting achievement:', error)
      return NextResponse.json({ error: 'Failed to delete achievement' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Achievement deleted successfully' })
  } catch (error) {
    console.error('Achievements DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/achievements/check - Check and award achievements for a user
export async function CHECK_ACHIEVEMENTS(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { user_id } = body
    const targetUserId = user_id || user.id

    // Get all achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')

    if (achievementsError) {
      console.error('Error fetching achievements:', achievementsError)
      return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 })
    }

    // Get user's current achievements
    const { data: userAchievements, error: userAchievementsError } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', targetUserId)

    if (userAchievementsError) {
      console.error('Error fetching user achievements:', userAchievementsError)
      return NextResponse.json({ error: 'Failed to fetch user achievements' }, { status: 500 })
    }

    const earnedAchievementIds = new Set(userAchievements?.map(ua => ua.achievement_id) || [])
    const newAchievements = []
    
    // Check each achievement
    for (const achievement of achievements) {
      if (earnedAchievementIds.has(achievement.id)) {
        continue // Already earned
      }

      const criteria = achievement.criteria
      let shouldAward = false

      // Check streak days criteria
      if (criteria.min_days) {
        const { data: maxStreak, error: streakError } = await supabase
          .from('user_streaks')
          .select('longest_streak_days')
          .eq('user_id', targetUserId)
          .order('longest_streak_days', { ascending: false })
          .limit(1)
          .single()

        if (!streakError && maxStreak && maxStreak.longest_streak_days >= criteria.min_days) {
          shouldAward = true
        }
      }

      // Check number of streaks joined
      if (criteria.min_streaks) {
        const { count: streakCount, error: countError } = await supabase
          .from('user_streaks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', targetUserId)

        if (!countError && streakCount && streakCount >= criteria.min_streaks) {
          shouldAward = true
        }
      }

      // Check number of comments
      if (criteria.min_comments) {
        const { count: commentCount, error: countError } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', targetUserId)

        if (!countError && commentCount && commentCount >= criteria.min_comments) {
          shouldAward = true
        }
      }

      // Check number of likes given
      if (criteria.min_likes) {
        const { count: likeCount, error: countError } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', targetUserId)

        if (!countError && likeCount && likeCount >= criteria.min_likes) {
          shouldAward = true
        }
      }

      // Check group membership
      if (criteria.min_group_members) {
        const { data: groups, error: groupsError } = await supabase
          .from('groups')
          .select(`
            id,
            group_members!inner(count)
          `)
          .eq('created_by', targetUserId)

        if (!groupsError && groups) {
          for (const group of groups) {
            const { count: memberCount, error: countError } = await supabase
              .from('group_members')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', group.id)

            if (!countError && memberCount && memberCount >= criteria.min_group_members) {
              shouldAward = true
          break
            }
          }
        }
      }

      if (shouldAward) {
        // Award the achievement
        const { data: newAchievement, error: awardError } = await supabase
          .from('user_achievements')
          .insert({
            user_id: targetUserId,
            achievement_id: achievement.id,
          })
          .select(`
            *,
            achievements(*)
          `)
          .single()

        if (!awardError && newAchievement) {
          newAchievements.push(newAchievement)
          
          // Create notification
          await supabase
            .from('notifications')
            .insert({
              user_id: targetUserId,
              type: 'milestone',
              title: 'Achievement Unlocked!',
              message: `You earned the "${achievement.name}" achievement!`,
              data: { achievement_id: achievement.id }
            })
        }
      }
    }

    return NextResponse.json({ 
      new_achievements: newAchievements,
      count: newAchievements.length
    })
  } catch (error) {
    console.error('Check achievements error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}