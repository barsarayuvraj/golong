import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Optional: Add authentication for admin access
    // const { data: { user }, error: authError } = await supabase.auth.getUser()
    // if (authError || !user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Find public streaks that have been abandoned for 15+ days
    const fifteenDaysAgo = new Date()
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)
    
    const { data: abandonedStreaks, error: abandonedError } = await supabase
      .from('streaks')
      .select('id, title, last_member_left_at')
      .eq('is_public', true)
      .not('last_member_left_at', 'is', null)
      .lt('last_member_left_at', fifteenDaysAgo.toISOString())

    if (abandonedError) {
      return NextResponse.json({ 
        error: 'Failed to fetch abandoned streaks',
        details: abandonedError.message 
      }, { status: 500 })
    }

    if (!abandonedStreaks || abandonedStreaks.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'No abandoned streaks found',
        deletedCount: 0
      })
    }

    console.log(`Found ${abandonedStreaks.length} abandoned streaks to clean up`)

    let deletedCount = 0
    const errors: string[] = []

    // Process each abandoned streak
    for (const streak of abandonedStreaks) {
      try {
        // Double-check that there are no active members
        const { data: activeMembers, error: membersError } = await supabase
          .from('user_streaks')
          .select('id')
          .eq('streak_id', streak.id)
          .eq('is_active', true)

        if (membersError) {
          errors.push(`Failed to check active members for streak ${streak.id}: ${membersError.message}`)
          continue
        }

        if (activeMembers && activeMembers.length > 0) {
          // Skip if there are still active members
          console.log(`Skipping streak ${streak.id} - still has active members`)
          continue
        }

        // Delete all related data
        // 1. Delete check-ins
        const { error: checkinsError } = await supabase
          .from('checkins')
          .delete()
          .eq('streak_id', streak.id)

        if (checkinsError) {
          errors.push(`Failed to delete check-ins for streak ${streak.id}: ${checkinsError.message}`)
          continue
        }

        // 2. Delete user_streaks
        const { error: userStreaksError } = await supabase
          .from('user_streaks')
          .delete()
          .eq('streak_id', streak.id)

        if (userStreaksError) {
          errors.push(`Failed to delete user streaks for streak ${streak.id}: ${userStreaksError.message}`)
          continue
        }

        // 3. Delete comments (public streaks have comments)
        const { error: commentsError } = await supabase
          .from('comments')
          .delete()
          .eq('streak_id', streak.id)

        if (commentsError) {
          errors.push(`Failed to delete comments for streak ${streak.id}: ${commentsError.message}`)
          continue
        }

        // 4. Finally delete the streak itself
        const { error: streakDeleteError } = await supabase
          .from('streaks')
          .delete()
          .eq('id', streak.id)

        if (streakDeleteError) {
          errors.push(`Failed to delete streak ${streak.id}: ${streakDeleteError.message}`)
          continue
        }

        deletedCount++
        console.log(`Successfully deleted abandoned streak: ${streak.title} (${streak.id})`)

      } catch (error: any) {
        errors.push(`Unexpected error processing streak ${streak.id}: ${error.message}`)
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `Cleanup completed. Deleted ${deletedCount} abandoned streaks.`,
      deletedCount,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}
