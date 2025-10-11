import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const streakId = params.id

    // Verify the streak exists and is public
    const { data: streak, error: streakError } = await supabase
      .from('streaks')
      .select('is_public, created_by')
      .eq('id', streakId)
      .single()

    if (streakError || !streak) {
      return NextResponse.json({ error: 'Streak not found' }, { status: 404 })
    }

    // Check if user has access to view this streak
    let hasAccess = false
    
    // Owner can always view
    if (streak.created_by === user.id) {
      hasAccess = true
    }
    // Public streaks can be viewed by anyone
    else if (streak.is_public) {
      hasAccess = true
    }
    // For private streaks, check if user has joined
    else {
      const { data: userStreak } = await supabase
        .from('user_streaks')
        .select('id')
        .eq('streak_id', streakId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()
      
      hasAccess = !!userStreak
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get recent activities from different sources and combine them
    const activities = []

    // 1. Recent check-ins (last 10)
    const { data: recentCheckins } = await supabase
      .from('checkins')
      .select(`
        id,
        checkin_date,
        created_at,
        user_streaks!inner(
          profiles!inner(
            id,
            username,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('user_streaks.streak_id', streakId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (recentCheckins) {
      recentCheckins.forEach(checkin => {
        activities.push({
          id: `checkin_${checkin.id}`,
          type: 'checkin',
          user: checkin.user_streaks.profiles,
          timestamp: checkin.created_at,
          date: checkin.checkin_date,
          action: 'checked in'
        })
      })
    }

    // 2. Recent comments (last 10)
    const { data: recentComments } = await supabase
      .from('comments')
      .select(`
        id,
        created_at,
        profiles!inner(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('streak_id', streakId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (recentComments) {
      recentComments.forEach(comment => {
        activities.push({
          id: `comment_${comment.id}`,
          type: 'comment',
          user: comment.profiles,
          timestamp: comment.created_at,
          action: 'commented'
        })
      })
    }

    // 3. Recent joins (last 10)
    const { data: recentJoins } = await supabase
      .from('user_streaks')
      .select(`
        id,
        joined_at,
        profiles!inner(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('streak_id', streakId)
      .eq('is_active', true)
      .order('joined_at', { ascending: false })
      .limit(10)

    if (recentJoins) {
      recentJoins.forEach(userStreak => {
        activities.push({
          id: `join_${userStreak.id}`,
          type: 'join',
          user: userStreak.profiles,
          timestamp: userStreak.joined_at,
          action: 'joined the streak'
        })
      })
    }

    // 4. Recent notes (last 10) - only for private streaks
    if (!streak.is_public) {
      const { data: recentNotes } = await supabase
        .from('notes')
        .select(`
          id,
          created_at,
          content,
          user_id
        `)
        .eq('streak_id', streakId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (recentNotes) {
        // Get user profiles for the note creators
        const userIds = recentNotes.map(note => note.user_id)
        const { data: noteUsers } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', userIds)

        recentNotes.forEach(note => {
          const user = noteUsers?.find(u => u.id === note.user_id)
          if (user) {
            activities.push({
              id: `note_${note.id}`,
              type: 'note',
              user: user,
              timestamp: note.created_at,
              action: 'added a note',
              content: note.content.substring(0, 50) + (note.content.length > 50 ? '...' : '')
            })
          }
        })
      }
    }

    // Sort all activities by timestamp (most recent first) and take top 10
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    const recentActivities = activities.slice(0, 10)

    return NextResponse.json({ activities: recentActivities })

  } catch (error) {
    console.error('Recent Activity GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
