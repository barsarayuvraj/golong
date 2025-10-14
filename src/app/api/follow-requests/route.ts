import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

const followRequestSchema = z.object({
  request_id: z.string().uuid(),
  action: z.enum(['accept', 'reject'])
})

// Accept or reject follow request
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { request_id, action } = followRequestSchema.parse(body)

    // Verify the request exists and belongs to the user
    const { data: followRequest, error: requestError } = await supabase
      .from('follow_requests')
      .select('id, requester_id, target_id, status')
      .eq('id', request_id)
      .eq('target_id', user.id)
      .eq('status', 'pending')
      .single()

    if (requestError || !followRequest) {
      return NextResponse.json({ error: 'Follow request not found' }, { status: 404 })
    }

    if (action === 'accept') {
      // Accept the follow request
      const { error: updateError } = await supabase
        .from('follow_requests')
        .update({ 
          status: 'accepted',
          responded_at: new Date().toISOString()
        })
        .eq('id', request_id)

      if (updateError) {
        console.error('Error accepting follow request:', updateError)
        return NextResponse.json({ error: 'Failed to accept follow request' }, { status: 500 })
      }

      // Create the follow relationship
      const { error: followError } = await supabase
        .from('follows')
        .insert({
          follower_id: followRequest.requester_id,
          following_id: followRequest.target_id
        })

      if (followError) {
        console.error('Error creating follow relationship:', followError)
        // Don't fail the request if follow creation fails, as the trigger should handle this
      }

      return NextResponse.json({ message: 'Follow request accepted successfully' })
    } else {
      // Reject the follow request
      const { error: updateError } = await supabase
        .from('follow_requests')
        .update({ 
          status: 'rejected',
          responded_at: new Date().toISOString()
        })
        .eq('id', request_id)

      if (updateError) {
        console.error('Error rejecting follow request:', updateError)
        return NextResponse.json({ error: 'Failed to reject follow request' }, { status: 500 })
      }

      return NextResponse.json({ message: 'Follow request rejected successfully' })
    }
  } catch (error) {
    console.error('Error in follow request API:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Cancel a follow request (for the requester)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { request_id } = z.object({ request_id: z.string().uuid() }).parse(body)

    // Cancel the follow request
    const { error: deleteError } = await supabase
      .from('follow_requests')
      .delete()
      .eq('id', request_id)
      .eq('requester_id', user.id)
      .eq('status', 'pending')

    if (deleteError) {
      console.error('Error canceling follow request:', deleteError)
      return NextResponse.json({ error: 'Failed to cancel follow request' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Follow request canceled successfully' })
  } catch (error) {
    console.error('Error in cancel follow request API:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
