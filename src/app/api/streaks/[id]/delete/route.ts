import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function DELETE(
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

    // Get the streak details
    const { data: streak, error: streakError } = await supabase
      .from('streaks')
      .select('id, title, created_by, is_public')
      .eq('id', streakId)
      .single()

    if (streakError) {
      return NextResponse.json({ 
        error: 'Streak not found',
        details: streakError.message 
      }, { status: 404 })
    }

    // Only allow deletion of private streaks by their creator
    if (streak.is_public) {
      return NextResponse.json({ 
        error: 'Cannot delete public streaks. You can only leave them.' 
      }, { status: 400 })
    }

    if (streak.created_by !== user.id) {
      return NextResponse.json({ 
        error: 'Only the creator can delete their private streak' 
      }, { status: 403 })
    }

    // Create service role client to bypass RLS for deletion
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Delete all related data for private streak using service role
    // 1. Delete notes first (private streaks have notes, not comments)
    const { error: notesError } = await serviceSupabase
      .from('notes')
      .delete()
      .eq('streak_id', streakId)

    if (notesError) {
      return NextResponse.json({ 
        error: 'Failed to delete notes',
        details: notesError.message 
      }, { status: 500 })
    }

    // 2. Get all user_streaks for this streak to find their IDs
    const { data: userStreaks, error: userStreaksFetchError } = await serviceSupabase
      .from('user_streaks')
      .select('id')
      .eq('streak_id', streakId)

    if (userStreaksFetchError) {
      return NextResponse.json({ 
        error: 'Failed to fetch user streaks',
        details: userStreaksFetchError.message 
      }, { status: 500 })
    }

    // 3. Delete check-ins for all user_streaks
    if (userStreaks && userStreaks.length > 0) {
      const userStreakIds = userStreaks.map(us => us.id)
      const { error: checkinsError } = await serviceSupabase
        .from('checkins')
        .delete()
        .in('user_streak_id', userStreakIds)

      if (checkinsError) {
        return NextResponse.json({ 
          error: 'Failed to delete check-ins',
          details: checkinsError.message 
        }, { status: 500 })
      }
    }

    // 4. Delete user_streaks
    const { error: userStreaksError } = await serviceSupabase
      .from('user_streaks')
      .delete()
      .eq('streak_id', streakId)

    if (userStreaksError) {
      return NextResponse.json({ 
        error: 'Failed to delete user streaks',
        details: userStreaksError.message 
      }, { status: 500 })
    }

    // 5. Finally delete the streak itself
    const { error: streakDeleteError } = await serviceSupabase
      .from('streaks')
      .delete()
      .eq('id', streakId)

    if (streakDeleteError) {
      return NextResponse.json({ 
        error: 'Failed to delete streak',
        details: streakDeleteError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Streak deleted successfully' 
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}
