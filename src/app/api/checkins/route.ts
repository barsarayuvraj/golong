import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

const checkinSchema = z.object({
  streak_id: z.string().uuid(),
  checkin_date: z.string().optional(), // Optional, defaults to today
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
    const validatedData = checkinSchema.parse(body)

    // Check if user is part of this streak
    const { data: userStreak, error: userStreakError } = await supabase
      .from('user_streaks')
      .select('id, current_streak_days, longest_streak_days, last_checkin_date')
      .eq('user_id', user.id)
      .eq('streak_id', validatedData.streak_id)
      .eq('is_active', true)
      .single()

    if (userStreakError || !userStreak) {
      return NextResponse.json({ 
        error: 'User is not part of this streak or streak not found' 
      }, { status: 404 })
    }

    // Determine check-in date (default to today)
    const checkinDate = validatedData.checkin_date 
      ? new Date(validatedData.checkin_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]

    // Check if user already checked in today
    const { data: existingCheckin, error: existingError } = await supabase
      .from('checkins')
      .select('id')
      .eq('user_streak_id', userStreak.id)
      .eq('checkin_date', checkinDate)
      .single()

    if (existingCheckin) {
      return NextResponse.json({ 
        error: 'Already checked in for this date',
        checkin_id: existingCheckin.id
      }, { status: 409 })
    }

    // Create the check-in
    const { data: checkin, error: checkinError } = await supabase
      .from('checkins')
      .insert({
        user_streak_id: userStreak.id,
        checkin_date: checkinDate,
      })
      .select()
      .single()

    if (checkinError) {
      console.error('Error creating checkin:', checkinError)
      return NextResponse.json({ error: 'Failed to create check-in' }, { status: 500 })
    }

    // Get updated streak data
    const { data: updatedUserStreak, error: updateError } = await supabase
      .from('user_streaks')
      .select('current_streak_days, longest_streak_days, last_checkin_date')
      .eq('id', userStreak.id)
      .single()

    if (updateError) {
      console.error('Error fetching updated streak:', updateError)
    }

    return NextResponse.json({ 
      id: checkin.id,
      checkin_date: checkin.checkin_date,
      current_streak_days: updatedUserStreak?.current_streak_days || 0,
      longest_streak_days: updatedUserStreak?.longest_streak_days || 0,
      message: 'Check-in successful!' 
    })

  } catch (error) {
    console.error('Error in check-in API:', error)
    
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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const streakId = searchParams.get('streak_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!streakId) {
      return NextResponse.json({ error: 'streak_id is required' }, { status: 400 })
    }

    // Check if user is part of this streak
    const { data: userStreak, error: userStreakError } = await supabase
      .from('user_streaks')
      .select('id')
      .eq('user_id', user.id)
      .eq('streak_id', streakId)
      .eq('is_active', true)
      .single()

    if (userStreakError || !userStreak) {
      return NextResponse.json({ 
        error: 'User is not part of this streak or streak not found' 
      }, { status: 404 })
    }

    // Build query for check-ins
    let query = supabase
      .from('checkins')
      .select('id, checkin_date, created_at')
      .eq('user_streak_id', userStreak.id)
      .order('checkin_date', { ascending: false })

    // Add date filters if provided
    if (startDate) {
      query = query.gte('checkin_date', startDate)
    }
    if (endDate) {
      query = query.lte('checkin_date', endDate)
    }

    const { data: checkins, error: checkinsError } = await query

    if (checkinsError) {
      console.error('Error fetching checkins:', checkinsError)
      return NextResponse.json({ error: 'Failed to fetch check-ins' }, { status: 500 })
    }

    return NextResponse.json({ 
      checkins: checkins || [],
      total: checkins?.length || 0
    })

  } catch (error) {
    console.error('Error in check-in GET API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const checkinId = searchParams.get('checkin_id')

    if (!checkinId) {
      return NextResponse.json({ error: 'checkin_id is required' }, { status: 400 })
    }

    // Verify the check-in belongs to the user
    const { data: checkin, error: checkinError } = await supabase
      .from('checkins')
      .select(`
        id,
        user_streak:user_streaks!inner (
          user_id
        )
      `)
      .eq('id', checkinId)
      .single()

    if (checkinError || !checkin) {
      return NextResponse.json({ error: 'Check-in not found' }, { status: 404 })
    }

    if (checkin.user_streak.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this check-in' }, { status: 403 })
    }

    // Delete the check-in
    const { error: deleteError } = await supabase
      .from('checkins')
      .delete()
      .eq('id', checkinId)

    if (deleteError) {
      console.error('Error deleting checkin:', deleteError)
      return NextResponse.json({ error: 'Failed to delete check-in' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Check-in deleted successfully' 
    })

  } catch (error) {
    console.error('Error in check-in DELETE API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
