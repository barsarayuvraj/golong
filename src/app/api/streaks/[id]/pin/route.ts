import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: streakId } = await params

    // Check if user is part of this streak
    const { data: userStreak, error: userStreakError } = await supabase
      .from('user_streaks')
      .select('id, is_active')
      .eq('streak_id', streakId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (userStreakError || !userStreak) {
      return NextResponse.json({ error: 'You are not part of this streak' }, { status: 404 })
    }

    // Check if already pinned
    if (userStreak.pinned_at) {
      return NextResponse.json({ error: 'Streak is already pinned' }, { status: 400 })
    }

    // Check how many streaks are currently pinned (max 3)
    const { data: pinnedStreaks, error: pinnedError } = await supabase
      .from('user_streaks')
      .select('id, pinned_at')
      .eq('user_id', user.id)
      .not('pinned_at', 'is', null)
      .order('pinned_at', { ascending: true })

    if (pinnedError) {
      return NextResponse.json({ error: 'Failed to check pinned streaks' }, { status: 500 })
    }

    // If 3 streaks are already pinned, unpin the oldest one
    if (pinnedStreaks && pinnedStreaks.length >= 3) {
      const oldestPinnedStreak = pinnedStreaks[0]
      
      const { error: unpinError } = await supabase
        .from('user_streaks')
        .update({ pinned_at: null })
        .eq('id', oldestPinnedStreak.id)

      if (unpinError) {
        return NextResponse.json({ error: 'Failed to unpin oldest streak' }, { status: 500 })
      }
    }

    // Pin the current streak
    const { error: pinError } = await supabase
      .from('user_streaks')
      .update({ pinned_at: new Date().toISOString() })
      .eq('id', userStreak.id)

    if (pinError) {
      return NextResponse.json({ error: 'Failed to pin streak' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Streak pinned successfully',
      unpinnedOldest: pinnedStreaks && pinnedStreaks.length >= 3 ? true : false
    })

  } catch (error: any) {
    console.error('Error pinning streak:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
