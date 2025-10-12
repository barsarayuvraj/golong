import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

const editDatesSchema = z.object({
  end_date: z.string().datetime(),
})

export async function PATCH(
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
    const body = await request.json()
    const validatedData = editDatesSchema.parse(body)

    // Get the streak details
    const { data: streak, error: streakError } = await supabase
      .from('streaks')
      .select('id, title, created_by, is_public, start_date')
      .eq('id', streakId)
      .single()

    if (streakError) {
      return NextResponse.json({ error: 'Streak not found' }, { status: 404 })
    }

    // Only allow editing of private streaks by their creator
    if (streak.is_public) {
      return NextResponse.json({ 
        error: 'Cannot edit dates for public streaks' 
      }, { status: 400 })
    }

    if (streak.created_by !== user.id) {
      return NextResponse.json({ 
        error: 'Only the creator can edit their private streak dates' 
      }, { status: 403 })
    }

    // Validate that end date is after start date
    const startDate = new Date(streak.start_date)
    const endDate = new Date(validatedData.end_date)
    
    if (endDate <= startDate) {
      return NextResponse.json({ 
        error: 'End date must be after start date' 
      }, { status: 400 })
    }

    // Get the current end date for comparison
    const currentEndDate = streak.end_date

    // Update the streak end date
    const { error: updateError } = await supabase
      .from('streaks')
      .update({ 
        end_date: validatedData.end_date
      })
      .eq('id', streakId)

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to update streak dates',
        details: updateError.message 
      }, { status: 500 })
    }

    // Log this activity in the activity log
    const { error: activityError } = await supabase
      .from('activity_log')
      .insert({
        streak_id: streakId,
        user_id: user.id,
        activity_type: 'streak_modified',
        description: `Updated streak end date from ${currentEndDate ? new Date(currentEndDate).toLocaleDateString() : 'not set'} to ${new Date(validatedData.end_date).toLocaleDateString()}`,
        metadata: {
          old_end_date: currentEndDate,
          new_end_date: validatedData.end_date,
          modification_type: 'end_date_update'
        }
      })

    if (activityError) {
      console.error('Failed to log streak modification activity:', activityError)
      // Don't fail the request for this, just log the error
    }

    return NextResponse.json({ 
      success: true,
      message: 'Streak end date updated successfully'
    })

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: error.errors 
      }, { status: 400 })
    }
    
    console.error('Error updating streak dates:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}
