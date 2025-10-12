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

    // Get the streak details to check if it's public or private
    const { data: streak, error: streakError } = await supabase
      .from('streaks')
      .select('created_by, is_public')
      .eq('id', streakId)
      .single()

    if (streakError) {
      return NextResponse.json({ 
        error: 'Streak not found',
        details: streakError.message 
      }, { status: 404 })
    }

    // For private streaks, creators cannot leave - they must delete
    if (!streak.is_public && streak.created_by === user.id) {
      return NextResponse.json({ 
        error: 'You cannot leave your own private streak. You can delete it instead.' 
      }, { status: 400 })
    }

    // For public streaks, even creators can leave (they'll be handled by auto-cleanup)

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

    // For public streaks, check if this was the last active member
    if (streak.is_public) {
      // Check if there are any other active members
      const { data: activeMembers, error: membersError } = await supabase
        .from('user_streaks')
        .select('id')
        .eq('streak_id', streakId)
        .eq('is_active', true)

      if (!membersError && (!activeMembers || activeMembers.length === 0)) {
        // This was the last active member, update last_member_left_at
        const { error: updateStreakError } = await supabase
          .from('streaks')
          .update({ 
            last_member_left_at: new Date().toISOString()
          })
          .eq('id', streakId)

        if (updateStreakError) {
          // Log error but don't fail the request
          console.error('Failed to update last_member_left_at:', updateStreakError)
        }
      }
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
