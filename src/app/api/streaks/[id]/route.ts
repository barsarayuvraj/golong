import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('GET /api/streaks/[id] - Starting request')
    
    const supabase = await createClient()
    console.log('Supabase client created successfully')
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth check - User:', user ? 'Found' : 'Not found', 'Error:', authError)
    
    if (authError || !user) {
      console.log('Authentication failed, returning 401')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: streakId } = await params
    console.log('Fetching streak with ID:', streakId)

    // Get the streak with creator info
    const { data: streak, error: streakError } = await supabase
      .from('streaks')
      .select(`
        *,
        profiles:created_by (
          id,
          username,
          display_name,
          avatar_url,
          bio
        )
      `)
      .eq('id', streakId)
      .single()

    if (streakError) {
      console.error('Error fetching streak:', streakError)
      return NextResponse.json({ 
        error: 'Streak not found',
        details: streakError.message,
        code: streakError.code
      }, { status: 404 })
    }

    console.log('Streak found:', streak?.title)

    // Get user's participation status
    const { data: userStreak, error: userStreakError } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id)
      .eq('streak_id', streakId)
      .single()

    if (userStreakError && userStreakError.code !== 'PGRST116') {
      console.error('Error fetching user streak:', userStreakError)
      // Don't fail the request for this, just log the error
    }

    console.log('Returning streak data successfully')
    return NextResponse.json({ 
      streak,
      user_streak: userStreak || null
    })

  } catch (error) {
    console.error('Error in get streak API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

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
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'join') {
      // Join streak
      const { data: userStreak, error: joinError } = await supabase
        .from('user_streaks')
        .insert({
          user_id: user.id,
          streak_id: streakId,
          current_streak_days: 0,
          longest_streak_days: 0,
          is_active: true,
        })
        .select()
        .single()

      if (joinError) {
        console.error('Error joining streak:', joinError)
        return NextResponse.json({ error: 'Failed to join streak' }, { status: 500 })
      }

      return NextResponse.json({ 
        message: 'Successfully joined streak',
        user_streak: userStreak
      })
    }

    if (action === 'leave') {
      // Leave streak
      const { error: leaveError } = await supabase
        .from('user_streaks')
        .delete()
        .eq('user_id', user.id)
        .eq('streak_id', streakId)

      if (leaveError) {
        console.error('Error leaving streak:', leaveError)
        return NextResponse.json({ error: 'Failed to leave streak' }, { status: 500 })
      }

      return NextResponse.json({ 
        message: 'Successfully left streak'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error in streak action API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
