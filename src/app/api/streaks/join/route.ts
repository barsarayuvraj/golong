import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { streak_id } = await request.json()

    if (!streak_id) {
      return NextResponse.json({ error: 'Streak ID is required' }, { status: 400 })
    }

    // Check if streak exists and is public
    const { data: streak, error: streakError } = await supabase
      .from('streaks')
      .select('id, title, is_public, created_by')
      .eq('id', streak_id)
      .single()

    if (streakError || !streak) {
      return NextResponse.json({ error: 'Streak not found' }, { status: 404 })
    }

    if (!streak.is_public) {
      return NextResponse.json({ error: 'Cannot join private streaks' }, { status: 403 })
    }

    // Check if user is trying to join their own streak
    if (streak.created_by === user.id) {
      return NextResponse.json({ error: 'Cannot join your own streak' }, { status: 400 })
    }

    // Check if user has already joined this streak
    const { data: existingJoin, error: existingError } = await supabase
      .from('user_streaks')
      .select('id')
      .eq('user_id', user.id)
      .eq('streak_id', streak_id)
      .eq('is_active', true)
      .single()

    if (existingJoin) {
      return NextResponse.json({ error: 'Already joined this streak' }, { status: 400 })
    }

    // Join the streak
    const { error: joinError } = await supabase
      .from('user_streaks')
      .insert({
        user_id: user.id,
        streak_id: streak_id,
        joined_at: new Date().toISOString(),
        current_streak_days: 0,
        longest_streak_days: 0,
        is_active: true
      })

    if (joinError) {
      console.error('Error joining streak:', joinError)
      return NextResponse.json({ error: 'Failed to join streak' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Successfully joined streak',
      streak_title: streak.title 
    })
  } catch (error) {
    console.error('Error in join streak API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
