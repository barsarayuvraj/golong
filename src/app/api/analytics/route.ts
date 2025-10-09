import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

const analyticsSchema = z.object({
  timeRange: z.enum(['week', 'month', 'year', 'all']).default('month'),
  userId: z.string().uuid().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') as 'week' | 'month' | 'year' | 'all' || 'month'
    const userId = searchParams.get('userId') || user.id

    // Validate the request
    const validatedData = analyticsSchema.parse({ timeRange, userId })

    // Calculate date range
    const now = new Date()
    let startDate: Date

    switch (validatedData.timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      case 'all':
      default:
        startDate = new Date('2020-01-01') // Far back date
        break
    }

    // Get user's streaks
    const { data: userStreaks, error: userStreaksError } = await supabase
      .from('user_streaks')
      .select(`
        id,
        current_streak_days,
        longest_streak_days,
        last_checkin_date,
        joined_at,
        streak:streaks (
          id,
          title,
          category,
          created_at,
          is_public
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)

    if (userStreaksError) {
      console.error('Error fetching user streaks:', userStreaksError)
      return NextResponse.json({ error: 'Failed to fetch user streaks' }, { status: 500 })
    }

    // Get check-ins for the time range
    const { data: checkins, error: checkinsError } = await supabase
      .from('checkins')
      .select(`
        checkin_date,
        created_at,
        user_streak:user_streaks!inner (
          streak:streaks (
            category,
            title
          )
        )
      `)
      .eq('user_streak.user_id', userId)
      .gte('checkin_date', startDate.toISOString().split('T')[0])

    if (checkinsError) {
      console.error('Error fetching checkins:', checkinsError)
      return NextResponse.json({ error: 'Failed to fetch checkins' }, { status: 500 })
    }

    // Get achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from('user_achievements')
      .select(`
        earned_at,
        achievement:achievements (
          name,
          points,
          rarity
        )
      `)
      .eq('user_id', userId)
      .gte('earned_at', startDate.toISOString())

    if (achievementsError) {
      console.error('Error fetching achievements:', achievementsError)
      return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 })
    }

    // Calculate basic stats
    const totalStreaks = userStreaks?.length || 0
    const activeStreaks = userStreaks?.filter(us => us.current_streak_days > 0).length || 0
    const totalCheckins = checkins?.length || 0
    const longestStreak = Math.max(...(userStreaks?.map(us => us.longest_streak_days) || [0]))
    const currentStreak = Math.max(...(userStreaks?.map(us => us.current_streak_days) || [0]))
    const totalAchievements = achievements?.length || 0
    const totalPoints = achievements?.reduce((sum, ach) => sum + (ach.achievement?.points || 0), 0) || 0

    // Calculate success rate
    const totalDays = Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
    const successRate = totalDays > 0 ? Math.round((totalCheckins / totalDays) * 100) : 0

    // Calculate streaks by category
    const streaksByCategory = userStreaks?.reduce((acc, us) => {
      const category = us.streak?.category || 'Other'
      if (!acc[category]) {
        acc[category] = {
          count: 0,
          totalDays: 0,
          longestStreak: 0,
          checkins: 0
        }
      }
      acc[category].count++
      acc[category].totalDays += us.current_streak_days
      acc[category].longestStreak = Math.max(acc[category].longestStreak, us.longest_streak_days)
      return acc
    }, {} as Record<string, { count: number; totalDays: number; longestStreak: number; checkins: number }>) || {}

    // Calculate check-ins by category
    checkins?.forEach(checkin => {
      const category = checkin.user_streak?.streak?.category || 'Other'
      if (streaksByCategory[category]) {
        streaksByCategory[category].checkins++
      }
    })

    // Generate monthly data for charts
    const monthlyData = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= now) {
      const monthKey = currentDate.toISOString().substring(0, 7) // YYYY-MM
      const monthCheckins = checkins?.filter(c => 
        c.checkin_date.startsWith(monthKey)
      ).length || 0
      
      const monthStreaks = userStreaks?.filter(us => 
        us.joined_at && us.joined_at.startsWith(monthKey)
      ).length || 0

      monthlyData.push({
        month: monthKey,
        checkins: monthCheckins,
        streaks: monthStreaks,
        date: new Date(currentDate)
      })

      currentDate.setMonth(currentDate.getMonth() + 1)
    }

    // Generate weekly data for charts
    const weeklyData = []
    const weekStart = new Date(startDate)
    
    while (weekStart <= now) {
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
      const weekCheckins = checkins?.filter(c => {
        const checkinDate = new Date(c.checkin_date)
        return checkinDate >= weekStart && checkinDate < weekEnd
      }).length || 0

      weeklyData.push({
        week: weekStart.toISOString().substring(0, 10),
        checkins: weekCheckins,
        date: new Date(weekStart)
      })

      weekStart.setDate(weekStart.getDate() + 7)
    }

    // Calculate daily check-in patterns
    const dailyPatterns = Array.from({ length: 7 }, (_, i) => {
      const dayCheckins = checkins?.filter(c => {
        const date = new Date(c.checkin_date)
        return date.getDay() === i
      }).length || 0
      
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      return {
        day: dayNames[i],
        checkins: dayCheckins,
        percentage: totalCheckins > 0 ? Math.round((dayCheckins / totalCheckins) * 100) : 0
      }
    })

    // Calculate top performing streaks
    const topStreaks = userStreaks
      ?.map(us => ({
        id: us.streak?.id,
        title: us.streak?.title,
        category: us.streak?.category,
        currentStreak: us.current_streak_days,
        longestStreak: us.longest_streak_days,
        checkins: checkins?.filter(c => c.user_streak?.streak?.id === us.streak?.id).length || 0
      }))
      .sort((a, b) => b.currentStreak - a.currentStreak)
      .slice(0, 5) || []

    // Calculate recent activity
    const recentActivity = []
    
    // Add recent check-ins
    checkins?.slice(0, 10).forEach(checkin => {
      recentActivity.push({
        type: 'checkin',
        date: checkin.checkin_date,
        title: `Checked in to ${checkin.user_streak?.streak?.title}`,
        category: checkin.user_streak?.streak?.category
      })
    })

    // Add recent achievements
    achievements?.slice(0, 5).forEach(achievement => {
      recentActivity.push({
        type: 'achievement',
        date: achievement.earned_at.split('T')[0],
        title: `Earned "${achievement.achievement?.name}" achievement`,
        points: achievement.achievement?.points
      })
    })

    // Sort by date
    recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Calculate insights
    const insights = []
    
    if (currentStreak >= 7) {
      insights.push({
        type: 'success',
        message: `Great job! You've maintained a ${currentStreak}-day streak!`
      })
    }
    
    if (totalCheckins >= 30) {
      insights.push({
        type: 'milestone',
        message: `You've completed ${totalCheckins} check-ins! Keep it up!`
      })
    }
    
    if (Object.keys(streaksByCategory).length >= 3) {
      insights.push({
        type: 'diversity',
        message: `You're active in ${Object.keys(streaksByCategory).length} different categories!`
      })
    }

    const analytics = {
      overview: {
        totalStreaks,
        activeStreaks,
        totalCheckins,
        longestStreak,
        currentStreak,
        totalAchievements,
        totalPoints,
        successRate,
        averageStreakLength: totalStreaks > 0 ? Math.round(userStreaks?.reduce((sum, us) => sum + us.longest_streak_days, 0) / totalStreaks) : 0
      },
      streaksByCategory: Object.entries(streaksByCategory).map(([category, data]) => ({
        category,
        count: data.count,
        totalDays: data.totalDays,
        longestStreak: data.longestStreak,
        checkins: data.checkins,
        averageDays: data.count > 0 ? Math.round(data.totalDays / data.count) : 0
      })),
      monthlyData,
      weeklyData,
      dailyPatterns,
      topStreaks,
      recentActivity: recentActivity.slice(0, 20),
      insights,
      timeRange: validatedData.timeRange,
      generatedAt: new Date().toISOString()
    }

    return NextResponse.json({ 
      analytics,
      message: 'Analytics data generated successfully'
    })

  } catch (error) {
    console.error('Error in analytics API:', error)
    
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
