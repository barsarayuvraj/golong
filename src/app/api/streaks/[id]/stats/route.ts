import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    const { id: streakId } = await params

    // Get the streak creation date
    const { data: streak, error: streakError } = await supabase
      .from('streaks')
      .select('created_at')
      .eq('id', streakId)
      .single()

    if (streakError) {
      console.error('Error fetching streak:', streakError)
      return NextResponse.json({ error: 'Failed to fetch streak' }, { status: 500 })
    }

    // Get all active participants for this streak
    const { data: participants, error: participantsError } = await supabase
      .from('user_streaks')
      .select('current_streak_days, longest_streak_days')
      .eq('streak_id', streakId)
      .eq('is_active', true)

    if (participantsError) {
      console.error('Error fetching participants:', participantsError)
      return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 })
    }

    // Calculate stats
    const totalParticipants = participants?.length || 0
    
    let averageStreak = 0
    let longestStreak = 0
    
    if (participants && participants.length > 0) {
      const totalCurrentStreak = participants.reduce((sum, p) => sum + p.current_streak_days, 0)
      averageStreak = Math.round(totalCurrentStreak / participants.length)
      
      longestStreak = Math.max(...participants.map(p => p.longest_streak_days))
    }

    const stats = {
      total_participants: totalParticipants,
      average_streak: averageStreak,
      longest_streak: longestStreak,
      created_at: streak.created_at
    }

    return NextResponse.json({ stats })

  } catch (error) {
    console.error('Error in streak stats API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
