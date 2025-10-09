import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Validation schemas
const analyticsQuerySchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
  metric: z.enum(['streaks', 'checkins', 'achievements', 'social', 'overview']).default('overview'),
})

// GET /api/analytics - Get analytics data for user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = {
      start_date: searchParams.get('start_date'),
      end_date: searchParams.get('end_date'),
      period: searchParams.get('period') || 'month',
      metric: searchParams.get('metric') || 'overview',
    }

    // Parse with more lenient validation
    const validatedParams = {
      start_date: queryParams.start_date || undefined,
      end_date: queryParams.end_date || undefined,
      period: queryParams.period || 'month',
      metric: queryParams.metric || 'overview',
    }

    // Set default date range if not provided
    const endDate = validatedParams.end_date ? new Date(validatedParams.end_date) : new Date()
    const startDate = validatedParams.start_date 
      ? new Date(validatedParams.start_date)
      : new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000)) // 30 days ago

    const analytics = await getAnalyticsData(supabase, user.id, startDate, endDate, validatedParams.period, validatedParams.metric)

    return NextResponse.json({ analytics })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Analytics GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to get analytics data
async function getAnalyticsData(supabase: any, userId: string, startDate: Date, endDate: Date, period: string, metric: string) {
  const analytics: any = {
    period,
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    generated_at: new Date().toISOString(),
  }

  try {
    // Overview metrics
    if (metric === 'overview' || metric === 'streaks') {
      // Total streaks joined
      const { count: totalStreaks } = await supabase
        .from('user_streaks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Active streaks
      const { count: activeStreaks } = await supabase
        .from('user_streaks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true)

      // Longest streak
      const { data: longestStreak } = await supabase
        .from('user_streaks')
        .select('longest_streak_days, streaks(title)')
        .eq('user_id', userId)
        .order('longest_streak_days', { ascending: false })
        .limit(1)
        .single()

      // Current streaks
      const { data: currentStreaks } = await supabase
        .from('user_streaks')
        .select('current_streak_days, streaks(title)')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('current_streak_days', { ascending: false })

      analytics.streaks = {
        total: totalStreaks || 0,
        active: activeStreaks || 0,
        longest: longestStreak?.longest_streak_days || 0,
        longest_streak_name: longestStreak?.streaks?.title || null,
        current_streaks: currentStreaks?.map(cs => ({
          days: cs.current_streak_days,
          name: cs.streaks?.title
        })) || []
      }
    }

    if (metric === 'overview' || metric === 'checkins') {
      // Get user streak IDs first
      const { data: userStreakIds } = await supabase
        .from('user_streaks')
        .select('id')
        .eq('user_id', userId)

      const streakIds = userStreakIds?.map(us => us.id) || []

      // Total checkins
      const { count: totalCheckins } = await supabase
        .from('checkins')
        .select('*', { count: 'exact', head: true })
        .in('user_streak_id', streakIds)

      // Checkins in date range
      const { count: checkinsInRange } = await supabase
        .from('checkins')
        .select('*', { count: 'exact', head: true })
        .in('user_streak_id', streakIds)
        .gte('checkin_date', startDate.toISOString().split('T')[0])
        .lte('checkin_date', endDate.toISOString().split('T')[0])

      // Daily checkin data for chart
      const { data: dailyCheckins } = await supabase
        .from('checkins')
        .select('checkin_date')
        .in('user_streak_id', streakIds)
        .gte('checkin_date', startDate.toISOString().split('T')[0])
        .lte('checkin_date', endDate.toISOString().split('T')[0])
        .order('checkin_date', { ascending: true })

      // Group checkins by date
      const checkinsByDate: { [key: string]: number } = {}
      dailyCheckins?.forEach(checkin => {
        const date = checkin.checkin_date
        checkinsByDate[date] = (checkinsByDate[date] || 0) + 1
      })

      analytics.checkins = {
        total: totalCheckins || 0,
        in_period: checkinsInRange || 0,
        daily_data: Object.entries(checkinsByDate).map(([date, count]) => ({
          date,
          count
        }))
      }
    }

    if (metric === 'overview' || metric === 'achievements') {
      // Total achievements earned
      const { count: totalAchievements } = await supabase
        .from('user_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Recent achievements
      const { data: recentAchievements } = await supabase
        .from('user_achievements')
        .select(`
          earned_at,
          achievements(name, description, icon)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })
        .limit(5)

      analytics.achievements = {
        total: totalAchievements || 0,
        recent: recentAchievements?.map(ra => ({
          name: ra.achievements?.name,
          description: ra.achievements?.description,
          icon: ra.achievements?.icon,
          earned_at: ra.earned_at
        })) || []
      }
    }

    if (metric === 'overview' || metric === 'social') {
      // Comments made
      const { count: totalComments } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Likes given
      const { count: totalLikes } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Get user's streak IDs first
      const { data: userStreakIds } = await supabase
        .from('streaks')
        .select('id')
        .eq('created_by', userId)

      const userStreakIdsArray = userStreakIds?.map(s => s.id) || []

      // Likes received on user's streaks
      const { count: likesReceived } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .in('streak_id', userStreakIdsArray)

      // Groups joined
      const { count: groupsJoined } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      analytics.social = {
        comments_made: totalComments || 0,
        likes_given: totalLikes || 0,
        likes_received: likesReceived || 0,
        groups_joined: groupsJoined || 0
      }
    }

    // Calculate streak consistency
    if (metric === 'overview') {
      const { data: userStreaks } = await supabase
        .from('user_streaks')
        .select('current_streak_days, longest_streak_days')
        .eq('user_id', userId)
        .eq('is_active', true)

      const totalCurrentDays = userStreaks?.reduce((sum, streak) => sum + streak.current_streak_days, 0) || 0
      const totalLongestDays = userStreaks?.reduce((sum, streak) => sum + streak.longest_streak_days, 0) || 0
      
      analytics.consistency = {
        current_total_days: totalCurrentDays,
        longest_total_days: totalLongestDays,
        average_current_streak: userStreaks?.length ? totalCurrentDays / userStreaks.length : 0,
        average_longest_streak: userStreaks?.length ? totalLongestDays / userStreaks.length : 0
      }
    }

    return analytics
  } catch (error) {
    console.error('Error generating analytics:', error)
    throw error
  }
}

// POST /api/analytics/compute - Compute and store analytics data
export async function COMPUTE_ANALYTICS(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { date, metrics } = body

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    const targetDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Don't allow computing analytics for future dates
    if (targetDate > today) {
      return NextResponse.json({ error: 'Cannot compute analytics for future dates' }, { status: 400 })
    }

    const computedMetrics: any = {}

    // Compute streak metrics
    if (!metrics || metrics.includes('streaks')) {
      const { count: activeStreaks } = await supabase
        .from('user_streaks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', true)

      computedMetrics.active_streaks = activeStreaks || 0
    }

    // Compute checkin metrics
    if (!metrics || metrics.includes('checkins')) {
      // Get user streak IDs first
      const { data: userStreakIds } = await supabase
        .from('user_streaks')
        .select('id')
        .eq('user_id', user.id)

      const streakIds = userStreakIds?.map(us => us.id) || []

      const { count: dailyCheckins } = await supabase
        .from('checkins')
        .select('*', { count: 'exact', head: true })
        .in('user_streak_id', streakIds)
        .eq('checkin_date', targetDate.toISOString().split('T')[0])

      computedMetrics.daily_checkins = dailyCheckins || 0
    }

    // Store computed metrics
    const storedMetrics = []
    for (const [metricName, metricValue] of Object.entries(computedMetrics)) {
      const { data: storedMetric, error: storeError } = await supabase
        .from('analytics_data')
        .upsert({
          user_id: user.id,
          metric_name: metricName,
          metric_value: metricValue,
          date: targetDate.toISOString().split('T')[0],
        })
        .select()
        .single()

      if (!storeError) {
        storedMetrics.push(storedMetric)
      }
    }

    return NextResponse.json({ 
      computed_metrics: computedMetrics,
      stored_metrics: storedMetrics
    })
  } catch (error) {
    console.error('Compute analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}