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

    // Check if user is part of this streak and if it's pinned
    const { data: userStreak, error: userStreakError } = await supabase
      .from('user_streaks')
      .select('id, pinned_at')
      .eq('streak_id', streakId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (userStreakError || !userStreak) {
      return NextResponse.json({ error: 'You are not part of this streak' }, { status: 404 })
    }

    // Check if streak is pinned
    if (!userStreak.pinned_at) {
      return NextResponse.json({ error: 'Streak is not pinned' }, { status: 400 })
    }

    // Unpin the streak
    const { error: unpinError } = await supabase
      .from('user_streaks')
      .update({ pinned_at: null })
      .eq('id', userStreak.id)

    if (unpinError) {
      return NextResponse.json({ error: 'Failed to unpin streak' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Streak unpinned successfully'
    })

  } catch (error: any) {
    console.error('Error unpinning streak:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
