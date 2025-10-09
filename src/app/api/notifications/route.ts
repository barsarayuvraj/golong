import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Validation schemas
const notificationPreferencesSchema = z.object({
  email_notifications: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  streak_reminders: z.boolean().optional(),
  milestone_notifications: z.boolean().optional(),
  social_notifications: z.boolean().optional(),
})

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    if (!supabase) {
      console.error('Supabase client is null/undefined')
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }
    
    if (!supabase.auth) {
      console.error('Supabase auth is null/undefined')
      return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 500 })
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unread_only = searchParams.get('unread_only') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (unread_only) {
      query = query.eq('read', false)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    // Get unread count
    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)

    if (countError) {
      console.error('Error fetching unread count:', countError)
    }

    return NextResponse.json({ 
      notifications,
      unread_count: unreadCount || 0
    })
  } catch (error) {
    console.error('Notifications GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/notifications - Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    if (!supabase || !supabase.auth) {
      console.error('Supabase client or auth is null/undefined')
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')
    const markAllRead = searchParams.get('mark_all_read') === 'true'

    if (markAllRead) {
      // Mark all notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 })
      }

      return NextResponse.json({ message: 'All notifications marked as read' })
    } else if (notificationId) {
      // Mark specific notification as read
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error marking notification as read:', error)
        return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 })
      }

      return NextResponse.json({ message: 'Notification marked as read' })
    } else {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 })
    }
  } catch (error) {
    console.error('Notifications PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/notifications - Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    if (!supabase || !supabase.auth) {
      console.error('Supabase client or auth is null/undefined')
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')
    const deleteAllRead = searchParams.get('delete_all_read') === 'true'

    if (deleteAllRead) {
      // Delete all read notifications
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('read', true)

      if (error) {
        console.error('Error deleting read notifications:', error)
        return NextResponse.json({ error: 'Failed to delete read notifications' }, { status: 500 })
      }

      return NextResponse.json({ message: 'All read notifications deleted' })
    } else if (notificationId) {
      // Delete specific notification
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error deleting notification:', error)
        return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
      }

      return NextResponse.json({ message: 'Notification deleted' })
    } else {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 })
    }
  } catch (error) {
    console.error('Notifications DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/notifications/preferences - Get notification preferences
export async function GET_PREFERENCES(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching notification preferences:', error)
      return NextResponse.json({ error: 'Failed to fetch notification preferences' }, { status: 500 })
    }

    // If no preferences exist, return default values
    if (!preferences) {
      return NextResponse.json({
        preferences: {
          email_notifications: true,
          push_notifications: true,
          streak_reminders: true,
          milestone_notifications: true,
          social_notifications: true,
        }
      })
    }

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Notification preferences GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/notifications/preferences - Update notification preferences
export async function PUT_PREFERENCES(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = notificationPreferencesSchema.parse(body)

    // Check if preferences exist
    const { data: existingPreferences, error: existingError } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single()

    let result
    if (existingPreferences) {
      // Update existing preferences
      const { data: preferences, error } = await supabase
        .from('notification_preferences')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single()

      result = { preferences, error }
    } else {
      // Create new preferences
      const { data: preferences, error } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: user.id,
          ...validatedData,
        })
        .select()
        .single()

      result = { preferences, error }
    }

    if (result.error) {
      console.error('Error updating notification preferences:', result.error)
      return NextResponse.json({ error: 'Failed to update notification preferences' }, { status: 500 })
    }

    return NextResponse.json({ preferences: result.preferences })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Notification preferences PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}