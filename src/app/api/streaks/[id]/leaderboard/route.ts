import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Get the current user (optional for authentication)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    const { id: streakId } = await params

    // Get all active participants for this streak with their profile info
    const { data: participants, error: participantsError } = await supabase
      .from('user_streaks')
      .select(`
        id,
        current_streak_days,
        longest_streak_days,
        last_checkin_date,
        joined_at,
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('streak_id', streakId)
      .eq('is_active', true)
      .order('current_streak_days', { ascending: false })
      .limit(3) // Only get top 3

    if (participantsError) {
      console.error('Error fetching participants:', participantsError)
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
    }

    // Format the leaderboard data
    const leaderboard = participants?.map((participant, index) => ({
      user_id: participant.profiles.id,
      username: participant.profiles.username,
      display_name: participant.profiles.display_name,
      avatar_url: participant.profiles.avatar_url,
      current_streak_days: participant.current_streak_days,
      longest_streak_days: participant.longest_streak_days,
      last_checkin_date: participant.last_checkin_date,
      joined_at: participant.joined_at,
      rank: index + 1
    })) || []

    // Fill remaining slots with placeholder if we have fewer than 3 participants
    while (leaderboard.length < 3) {
      leaderboard.push({
        user_id: `placeholder_${leaderboard.length}`,
        username: '',
        display_name: '',
        avatar_url: '',
        current_streak_days: 0,
        longest_streak_days: 0,
        last_checkin_date: '',
        joined_at: '',
        rank: leaderboard.length + 1
      })
    }

    return NextResponse.json({ leaderboard })

  } catch (error) {
    console.error('Error in leaderboard API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
