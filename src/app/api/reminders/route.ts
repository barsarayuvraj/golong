import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Validation schemas
const reminderSchema = z.object({
  streak_id: z.string().uuid(),
  time: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM format
  days_of_week: z.array(z.number().min(1).max(7)).min(1).max(7), // 1=Monday, 7=Sunday
  message: z.string().max(200).optional(),
  reminder_type: z.enum(['push', 'email', 'both']).default('push'),
})

const updateReminderSchema = reminderSchema.partial().omit({ streak_id: true })

// GET /api/reminders - Get user's reminders
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reminder_id = searchParams.get('id')
    const streak_id = searchParams.get('streak_id')
    const active_only = searchParams.get('active_only') === 'true'

    if (reminder_id) {
      // Get specific reminder
      const { data: reminder, error } = await supabase
        .from('reminders')
        .select(`
          *,
          streaks(
            id,
            title,
            description
          )
        `)
        .eq('id', reminder_id)
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error fetching reminder:', error)
        return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
      }

      return NextResponse.json({ reminder })
    } else {
      // Get multiple reminders
      let query = supabase
        .from('reminders')
        .select(`
          *,
          streaks(
            id,
            title,
            description
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (streak_id) {
        query = query.eq('streak_id', streak_id)
      }

      if (active_only) {
        query = query.eq('is_active', true)
      }

      const { data: reminders, error } = await query

      if (error) {
        console.error('Error fetching reminders:', error)
        return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 })
      }

      return NextResponse.json({ reminders })
    }
  } catch (error) {
    console.error('Reminders GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/reminders - Create a new reminder
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = reminderSchema.parse(body)

    // Verify the user is participating in this streak
    const { data: userStreak, error: userStreakError } = await supabase
      .from('user_streaks')
      .select('id')
      .eq('user_id', user.id)
      .eq('streak_id', validatedData.streak_id)
      .single()

    if (userStreakError || !userStreak) {
      return NextResponse.json({ error: 'You are not participating in this streak' }, { status: 403 })
    }

    // Check if user already has a reminder for this streak
    const { data: existingReminder, error: existingError } = await supabase
      .from('reminders')
      .select('id')
      .eq('user_id', user.id)
      .eq('streak_id', validatedData.streak_id)
      .eq('is_active', true)
      .single()

    if (existingReminder) {
      return NextResponse.json({ error: 'You already have an active reminder for this streak' }, { status: 409 })
    }

    const { data: reminder, error } = await supabase
      .from('reminders')
      .insert({
        ...validatedData,
        user_id: user.id,
      })
      .select(`
        *,
        streaks(
          id,
          title,
          description
        )
      `)
      .single()

    if (error) {
      console.error('Error creating reminder:', error)
      return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 })
    }

    return NextResponse.json({ reminder }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Reminders POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/reminders - Update a reminder
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reminderId = searchParams.get('id')

    if (!reminderId) {
      return NextResponse.json({ error: 'Reminder ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateReminderSchema.parse(body)

    // Verify the user owns this reminder
    const { data: existingReminder, error: existingError } = await supabase
      .from('reminders')
      .select('*')
      .eq('id', reminderId)
      .eq('user_id', user.id)
      .single()

    if (existingError || !existingReminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    }

    const { data: reminder, error } = await supabase
      .from('reminders')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reminderId)
      .select(`
        *,
        streaks(
          id,
          title,
          description
        )
      `)
      .single()

    if (error) {
      console.error('Error updating reminder:', error)
      return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 })
    }

    return NextResponse.json({ reminder })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Reminders PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/reminders - Delete a reminder
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reminderId = searchParams.get('id')

    if (!reminderId) {
      return NextResponse.json({ error: 'Reminder ID is required' }, { status: 400 })
    }

    // Verify the user owns this reminder
    const { data: existingReminder, error: existingError } = await supabase
      .from('reminders')
      .select('id')
      .eq('id', reminderId)
      .eq('user_id', user.id)
      .single()

    if (existingError || !existingReminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', reminderId)

    if (error) {
      console.error('Error deleting reminder:', error)
      return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Reminder deleted successfully' })
  } catch (error) {
    console.error('Reminders DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/reminders/toggle - Toggle reminder active status
export async function TOGGLE_REMINDER(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reminder_id, is_active } = body

    if (!reminder_id || typeof is_active !== 'boolean') {
      return NextResponse.json({ error: 'Reminder ID and active status are required' }, { status: 400 })
    }

    // Verify the user owns this reminder
    const { data: existingReminder, error: existingError } = await supabase
      .from('reminders')
      .select('id')
      .eq('id', reminder_id)
      .eq('user_id', user.id)
      .single()

    if (existingError || !existingReminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    }

    const { data: reminder, error } = await supabase
      .from('reminders')
      .update({
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reminder_id)
      .select(`
        *,
        streaks(
          id,
          title,
          description
        )
      `)
      .single()

    if (error) {
      console.error('Error toggling reminder:', error)
      return NextResponse.json({ error: 'Failed to toggle reminder' }, { status: 500 })
    }

    return NextResponse.json({ reminder })
  } catch (error) {
    console.error('Toggle reminder error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/reminders/upcoming - Get upcoming reminders for today
export async function GET_UPCOMING(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay() // Convert Sunday (0) to 7

    // Get active reminders for today
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select(`
        *,
        streaks(
          id,
          title,
          description
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .contains('days_of_week', [dayOfWeek])
      .order('time', { ascending: true })

    if (error) {
      console.error('Error fetching upcoming reminders:', error)
      return NextResponse.json({ error: 'Failed to fetch upcoming reminders' }, { status: 500 })
    }

    return NextResponse.json({ reminders })
  } catch (error) {
    console.error('Get upcoming reminders error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
