import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: streakId } = await params

    // Check if user is actually participating in this streak
    const { data: userStreak, error: userStreakError } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id)
      .eq('streak_id', streakId)
      .single()

    if (userStreakError) {
      if (userStreakError.code === 'PGRST116') {
        return NextResponse.json({ 
          error: 'You are not participating in this streak' 
        }, { status: 400 })
      }
      return NextResponse.json({ 
        error: 'Failed to fetch user streak',
        details: userStreakError.message 
      }, { status: 500 })
    }

    if (!userStreak) {
      return NextResponse.json({ 
        error: 'You are not participating in this streak' 
      }, { status: 400 })
    }

    // Check if user is the creator of the streak
    const { data: streak, error: streakError } = await supabase
      .from('streaks')
      .select('created_by')
      .eq('id', streakId)
      .single()

    if (streakError) {
      return NextResponse.json({ 
        error: 'Streak not found',
        details: streakError.message 
      }, { status: 404 })
    }

    if (streak.created_by === user.id) {
      return NextResponse.json({ 
        error: 'Streak creators cannot leave their own streaks. You can delete the streak instead.' 
      }, { status: 400 })
    }

    // Deactivate user streak instead of deleting (soft delete)
    const { error: updateError } = await supabase
      .from('user_streaks')
      .update({ 
        is_active: false
      })
      .eq('id', userStreak.id)

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to leave streak',
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Successfully left the streak' 
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}
