import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

const createNotificationSchema = z.object({
  user_id: z.string().uuid(),
  type: z.enum(['streak_reminder', 'milestone', 'comment', 'like', 'follow']),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  data: z.record(z.any()).optional(),
})

const updateNotificationSchema = z.object({
  read: z.boolean(),
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
    const validatedData = createNotificationSchema.parse(body)

    // Create the notification
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: validatedData.user_id,
        type: validatedData.type,
        title: validatedData.title,
        message: validatedData.message,
        data: validatedData.data || {},
      })
      .select()
      .single()

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }

    return NextResponse.json({ 
      notification,
      message: 'Notification created successfully' 
    })

  } catch (error) {
    console.error('Error in create notification API:', error)
    
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
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const unreadOnly = searchParams.get('unread_only') === 'true'

    // Build query
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data: notifications, error: notificationsError } = await query

    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError)
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
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
      hasMore: (offset + limit) < (notifications?.length || 0)
    })

  } catch (error) {
    console.error('Error in get notifications API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('notification_id')

    if (!notificationId) {
      return NextResponse.json({ error: 'notification_id is required' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateNotificationSchema.parse(body)

    // Verify the notification belongs to the user
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .select('id, user_id')
      .eq('id', notificationId)
      .single()

    if (notificationError || !notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    if (notification.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to update this notification' }, { status: 403 })
    }

    // Update the notification
    const { data: updatedNotification, error: updateError } = await supabase
      .from('notifications')
      .update({
        read: validatedData.read,
      })
      .eq('id', notificationId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating notification:', updateError)
      return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
    }

    return NextResponse.json({ 
      notification: updatedNotification,
      message: 'Notification updated successfully' 
    })

  } catch (error) {
    console.error('Error in update notification API:', error)
    
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

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('notification_id')

    if (!notificationId) {
      return NextResponse.json({ error: 'notification_id is required' }, { status: 400 })
    }

    // Verify the notification belongs to the user
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .select('id, user_id')
      .eq('id', notificationId)
      .single()

    if (notificationError || !notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    if (notification.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this notification' }, { status: 403 })
    }

    // Delete the notification
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (deleteError) {
      console.error('Error deleting notification:', deleteError)
      return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Notification deleted successfully' 
    })

  } catch (error) {
    console.error('Error in delete notification API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
