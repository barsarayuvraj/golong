import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '12')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get the current user (optional - for checking participation status)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const currentUserId = user?.id

    // Get popular public streaks with participant count
    const { data: streaks, error: streaksError, count } = await supabase
      .from('streaks')
      .select(`
        id,
        title,
        description,
        category,
        created_at,
        is_public,
        profiles:created_by (
          id,
          username,
          display_name,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (streaksError) {
      console.error('Error fetching popular streaks:', streaksError)
      return NextResponse.json({ error: 'Failed to fetch popular streaks' }, { status: 500 })
    }

    // Get participant count for each streak
    const streakIds = streaks.map(s => s.id)
    const { data: participantCounts } = await supabase
      .from('user_streaks')
      .select('streak_id')
      .in('streak_id', streakIds)
      .eq('is_active', true)

    // Count participants per streak
    const participantMap = participantCounts?.reduce((acc, curr) => {
      acc[curr.streak_id] = (acc[curr.streak_id] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Get user's participation status for these streaks (if authenticated)
    let userParticipationMap: Record<string, boolean> = {}
    if (currentUserId) {
      const { data: userStreaks } = await supabase
        .from('user_streaks')
        .select('streak_id')
        .in('streak_id', streakIds)
        .eq('user_id', currentUserId)
        .eq('is_active', true)

      userParticipationMap = userStreaks?.reduce((acc, curr) => {
        acc[curr.streak_id] = true
        return acc
      }, {} as Record<string, boolean>) || {}
    }

    // Combine streak data with participant count and user participation
    const popularStreaks = streaks.map(streak => ({
      ...streak,
      participant_count: participantMap[streak.id] || 0,
      hasJoined: userParticipationMap[streak.id] || false
    }))

    // Sort by participant count (most popular first)
    popularStreaks.sort((a, b) => b.participant_count - a.participant_count)

    return NextResponse.json({ 
      streaks: popularStreaks,
      total: count || 0,
      hasMore: (offset + limit) < (count || 0)
    })

  } catch (error) {
    console.error('Error in get popular streaks API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
