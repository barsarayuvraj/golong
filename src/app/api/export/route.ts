import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

const exportSchema = z.object({
  format: z.enum(['json', 'csv']).default('json'),
  includeCharts: z.boolean().default(true),
  includeAchievements: z.boolean().default(true),
  includeCheckins: z.boolean().default(true),
  dateRange: z.enum(['week', 'month', 'year', 'all']).default('all'),
  streaks: z.array(z.string().uuid()).default([]),
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
    const validatedData = exportSchema.parse(body)

    // Calculate date range
    const now = new Date()
    let startDate: Date

    switch (validatedData.dateRange) {
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
        startDate = new Date('2020-01-01')
        break
    }

    // Get user's streaks
    let streaksQuery = supabase
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
          description,
          category,
          created_at,
          is_public,
          tags
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (validatedData.streaks.length > 0) {
      streaksQuery = streaksQuery.in('streak_id', validatedData.streaks)
    }

    const { data: userStreaks, error: userStreaksError } = await streaksQuery

    if (userStreaksError) {
      console.error('Error fetching user streaks:', userStreaksError)
      return NextResponse.json({ error: 'Failed to fetch user streaks' }, { status: 500 })
    }

    // Get check-ins
    let checkinsQuery = supabase
      .from('checkins')
      .select(`
        checkin_date,
        created_at,
        user_streak:user_streaks!inner (
          streak:streaks (
            id,
            title,
            category
          )
        )
      `)
      .eq('user_streak.user_id', user.id)
      .gte('checkin_date', startDate.toISOString().split('T')[0])

    if (validatedData.streaks.length > 0) {
      checkinsQuery = checkinsQuery.in('user_streak.streak_id', validatedData.streaks)
    }

    const { data: checkins, error: checkinsError } = await checkinsQuery

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
          description,
          points,
          rarity
        )
      `)
      .eq('user_id', user.id)
      .gte('earned_at', startDate.toISOString())

    if (achievementsError) {
      console.error('Error fetching achievements:', achievementsError)
      return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, display_name, created_at')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
    }

    // Calculate summary statistics
    const totalStreaks = userStreaks?.length || 0
    const totalCheckins = checkins?.length || 0
    const longestStreak = Math.max(...(userStreaks?.map(us => us.longest_streak_days) || [0]))
    const currentStreak = Math.max(...(userStreaks?.map(us => us.current_streak_days) || [0]))
    const totalAchievements = achievements?.length || 0
    const totalPoints = achievements?.reduce((sum, ach) => sum + (ach.achievement?.points || 0), 0) || 0

    // Prepare export data
    const exportData = {
      exportInfo: {
        exportedAt: new Date().toISOString(),
        exportedBy: user.email,
        dateRange: validatedData.dateRange,
        startDate: startDate.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
        format: validatedData.format,
        version: '1.0'
      },
      userInfo: {
        username: profile?.username,
        displayName: profile?.display_name,
        memberSince: profile?.created_at,
        totalStreaks,
        totalCheckins,
        longestStreak,
        currentStreak,
        totalAchievements,
        totalPoints
      },
      streaks: userStreaks?.map(us => ({
        id: us.streak?.id,
        title: us.streak?.title,
        description: us.streak?.description,
        category: us.streak?.category,
        isPublic: us.streak?.is_public,
        tags: us.streak?.tags,
        currentStreakDays: us.current_streak_days,
        longestStreakDays: us.longest_streak_days,
        lastCheckinDate: us.last_checkin_date,
        joinedAt: us.joined_at,
        createdAt: us.streak?.created_at
      })) || [],
      checkins: validatedData.includeCheckins ? checkins?.map(c => ({
        date: c.checkin_date,
        createdAt: c.created_at,
        streakTitle: c.user_streak?.streak?.title,
        streakCategory: c.user_streak?.streak?.category
      })) || [] : [],
      achievements: validatedData.includeAchievements ? achievements?.map(a => ({
        name: a.achievement?.name,
        description: a.achievement?.description,
        points: a.achievement?.points,
        rarity: a.achievement?.rarity,
        earnedAt: a.earned_at
      })) || [] : []
    }

    // Generate charts data if requested
    if (validatedData.includeCharts) {
      // Monthly check-ins chart
      const monthlyCheckins = []
      const currentDate = new Date(startDate)
      
      while (currentDate <= now) {
        const monthKey = currentDate.toISOString().substring(0, 7)
        const monthCheckins = checkins?.filter(c => 
          c.checkin_date.startsWith(monthKey)
        ).length || 0
        
        monthlyCheckins.push({
          month: monthKey,
          checkins: monthCheckins
        })

        currentDate.setMonth(currentDate.getMonth() + 1)
      }

      // Streaks by category chart
      const streaksByCategory = userStreaks?.reduce((acc, us) => {
        const category = us.streak?.category || 'Other'
        acc[category] = (acc[category] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      exportData.charts = {
        monthlyCheckins,
        streaksByCategory: Object.entries(streaksByCategory).map(([category, count]) => ({
          category,
          count
        })),
        dailyPatterns: Array.from({ length: 7 }, (_, i) => {
          const dayCheckins = checkins?.filter(c => {
            const date = new Date(c.checkin_date)
            return date.getDay() === i
          }).length || 0
          
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
          return {
            day: dayNames[i],
            checkins: dayCheckins
          }
        })
      }
    }

    // Format response based on requested format
    if (validatedData.format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV(exportData)
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="golong-export-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else {
      // Return JSON format
      return NextResponse.json({ 
        data: exportData,
        message: 'Data exported successfully'
      })
    }

  } catch (error) {
    console.error('Error in export API:', error)
    
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

function convertToCSV(data: any): string {
  const lines: string[] = []
  
  // Add export info
  lines.push('Export Information')
  lines.push(`Exported At,${data.exportInfo.exportedAt}`)
  lines.push(`Date Range,${data.exportInfo.dateRange}`)
  lines.push(`Start Date,${data.exportInfo.startDate}`)
  lines.push(`End Date,${data.exportInfo.endDate}`)
  lines.push('')
  
  // Add user info
  lines.push('User Summary')
  lines.push(`Username,${data.userInfo.username}`)
  lines.push(`Display Name,${data.userInfo.displayName}`)
  lines.push(`Total Streaks,${data.userInfo.totalStreaks}`)
  lines.push(`Total Check-ins,${data.userInfo.totalCheckins}`)
  lines.push(`Longest Streak,${data.userInfo.longestStreak}`)
  lines.push(`Current Streak,${data.userInfo.currentStreak}`)
  lines.push(`Total Achievements,${data.userInfo.totalAchievements}`)
  lines.push(`Total Points,${data.userInfo.totalPoints}`)
  lines.push('')
  
  // Add streaks
  lines.push('Streaks')
  lines.push('Title,Category,Current Streak,Longest Streak,Last Check-in,Joined At')
  data.streaks.forEach((streak: any) => {
    lines.push(`"${streak.title}","${streak.category}",${streak.currentStreakDays},${streak.longestStreakDays},${streak.lastCheckinDate || ''},${streak.joinedAt}`)
  })
  lines.push('')
  
  // Add check-ins
  if (data.checkins.length > 0) {
    lines.push('Check-ins')
    lines.push('Date,Streak Title,Category')
    data.checkins.forEach((checkin: any) => {
      lines.push(`${checkin.date},"${checkin.streakTitle}","${checkin.streakCategory}"`)
    })
    lines.push('')
  }
  
  // Add achievements
  if (data.achievements.length > 0) {
    lines.push('Achievements')
    lines.push('Name,Points,Rarity,Earned At')
    data.achievements.forEach((achievement: any) => {
      lines.push(`"${achievement.name}",${achievement.points},"${achievement.rarity}",${achievement.earnedAt}`)
    })
  }
  
  return lines.join('\n')
}
