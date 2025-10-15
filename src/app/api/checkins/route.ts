import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Validation schemas
const checkinSchema = z.object({
  user_streak_id: z.string().uuid(),
  checkin_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

const updateCheckinSchema = z.object({
  checkin_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

// GET /api/checkins - Get checkins for a user or streak
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const user_streak_id = searchParams.get('user_streak_id')
    const streak_id = searchParams.get('streak_id')
    const user_id = searchParams.get('user_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('checkins')
      .select(`
        *,
        user_streaks!inner(
          *,
          streaks(*),
          profiles(*)
        )
      `)
      .order('checkin_date', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (user_streak_id) {
      query = query.eq('user_streak_id', user_streak_id)
    } else if (streak_id) {
      // When filtering by streak_id, also filter by current user to show only their check-ins
      query = query.eq('user_streaks.streak_id', streak_id).eq('user_streaks.user_id', user.id)
    } else if (user_id) {
      query = query.eq('user_streaks.user_id', user_id)
    } else {
      // Default: get user's own checkins
      query = query.eq('user_streaks.user_id', user.id)
    }

    const { data: checkins, error } = await query

    if (error) {
      console.error('Error fetching checkins:', error)
      return NextResponse.json({ error: 'Failed to fetch checkins' }, { status: 500 })
    }

    return NextResponse.json({ checkins })
  } catch (error) {
    console.error('Checkins GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/checkins - Create a new checkin
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = checkinSchema.parse(body)

    // Verify the user owns this user_streak and get streak details
    const { data: userStreak, error: userStreakError } = await supabase
      .from('user_streaks')
      .select(`
        *,
        streaks!inner(
          id,
          title
        )
      `)
      .eq('id', validatedData.user_streak_id)
      .eq('user_id', user.id)
      .single()

    if (userStreakError || !userStreak) {
      return NextResponse.json({ error: 'User streak not found' }, { status: 404 })
    }

    // Check if checkin already exists for this date
    const { data: existingCheckin, error: existingError } = await supabase
      .from('checkins')
      .select('id')
      .eq('user_streak_id', validatedData.user_streak_id)
      .eq('checkin_date', validatedData.checkin_date)
      .single()

    if (existingCheckin) {
      return NextResponse.json({ error: 'Checkin already exists for this date' }, { status: 409 })
    }

    // Create the checkin
    const { data: checkin, error } = await supabase
      .from('checkins')
      .insert({
        user_streak_id: validatedData.user_streak_id,
        checkin_date: validatedData.checkin_date,
      })
      .select(`
        *,
        user_streaks!inner(
          *,
          streaks(*),
          profiles(*)
        )
      `)
      .single()

    if (error) {
      console.error('Error creating checkin:', error)
      return NextResponse.json({ error: 'Failed to create checkin' }, { status: 500 })
    }

    return NextResponse.json({ checkin }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Checkins POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/checkins - Update a checkin
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const checkinId = searchParams.get('id')

    if (!checkinId) {
      return NextResponse.json({ error: 'Checkin ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateCheckinSchema.parse(body)

    // Verify the user owns this checkin
    const { data: existingCheckin, error: existingError } = await supabase
      .from('checkins')
      .select(`
        *,
        user_streaks!inner(*)
      `)
      .eq('id', checkinId)
      .eq('user_streaks.user_id', user.id)
      .single()

    if (existingError || !existingCheckin) {
      return NextResponse.json({ error: 'Checkin not found' }, { status: 404 })
    }

    // Update the checkin
    const { data: checkin, error } = await supabase
      .from('checkins')
      .update(validatedData)
      .eq('id', checkinId)
      .select(`
        *,
        user_streaks!inner(
          *,
          streaks(*),
          profiles(*)
        )
      `)
      .single()

    if (error) {
      console.error('Error updating checkin:', error)
      return NextResponse.json({ error: 'Failed to update checkin' }, { status: 500 })
    }

    return NextResponse.json({ checkin })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Checkins PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/checkins - Delete a checkin
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const checkinId = searchParams.get('id')

    if (!checkinId) {
      return NextResponse.json({ error: 'Checkin ID is required' }, { status: 400 })
    }

    // Verify the user owns this checkin
    const { data: existingCheckin, error: existingError } = await supabase
      .from('checkins')
      .select(`
        *,
        user_streaks!inner(*)
      `)
      .eq('id', checkinId)
      .eq('user_streaks.user_id', user.id)
      .single()

    if (existingError || !existingCheckin) {
      return NextResponse.json({ error: 'Checkin not found' }, { status: 404 })
    }

    // Delete the checkin
    const { error } = await supabase
      .from('checkins')
      .delete()
      .eq('id', checkinId)

    if (error) {
      console.error('Error deleting checkin:', error)
      return NextResponse.json({ error: 'Failed to delete checkin' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Checkin deleted successfully' })
  } catch (error) {
    console.error('Checkins DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}