import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

const followSchema = z.object({
  target_user_id: z.string().uuid()
})

// Follow a user (direct follow for public profiles)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { target_user_id } = followSchema.parse(body)

    // Check if trying to follow self
    if (user.id === target_user_id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    // Check if target user exists and get privacy setting
    const { data: targetUser, error: userError } = await supabase
      .from('profiles')
      .select('id, is_private')
      .eq('id', target_user_id)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isPrivate = targetUser.is_private || false

    // Check if already following (with error handling)
    let existingFollow = null
    try {
      const { data: existingFollowData, error: followCheckError } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', target_user_id)
        .single()
      
      if (followCheckError && followCheckError.code !== 'PGRST116') {
        console.log('Error checking follows:', followCheckError)
      } else {
        existingFollow = existingFollowData
      }
    } catch (error) {
      console.log('Follows table not available yet:', error)
    }

    if (existingFollow) {
      return NextResponse.json({ error: 'Already following this user' }, { status: 400 })
    }

    // Check if there's a pending follow request (with error handling)
    let existingRequest = null
    try {
      const { data: existingRequestData, error: requestCheckError } = await supabase
        .from('follow_requests')
        .select('id')
        .eq('requester_id', user.id)
        .eq('target_id', target_user_id)
        .eq('status', 'pending')
        .single()
      
      if (requestCheckError && requestCheckError.code !== 'PGRST116') {
        console.log('Error checking follow requests:', requestCheckError)
      } else {
        existingRequest = existingRequestData
      }
    } catch (error) {
      console.log('Follow requests table not available yet:', error)
    }

    if (existingRequest) {
      return NextResponse.json({ error: 'Follow request already sent' }, { status: 400 })
    }

    if (isPrivate) {
      // Send follow request for private profiles
      try {
        const { error: requestError } = await supabase
          .from('follow_requests')
          .insert({
            requester_id: user.id,
            target_id: target_user_id,
            status: 'pending'
          })

        if (requestError) {
          console.error('Error creating follow request:', requestError)
          
          // Handle duplicate key constraint (already sent request)
          if (requestError.code === '23505') {
            return NextResponse.json({ error: 'Follow request already sent' }, { status: 400 })
          }
          
          return NextResponse.json({ error: 'Failed to send follow request' }, { status: 500 })
        }

        return NextResponse.json({ 
          message: 'Follow request sent successfully',
          type: 'request_sent'
        })
      } catch (error) {
        console.error('Follow requests table not available:', error)
        return NextResponse.json({ error: 'Follow system not available yet' }, { status: 503 })
      }
    } else {
      // Direct follow for public profiles
      try {
        const { error: followError } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: target_user_id
          })

        if (followError) {
          console.error('Error creating follow:', followError)
          
          // Handle duplicate key constraint (already following)
          if (followError.code === '23505') {
            return NextResponse.json({ error: 'Already following this user' }, { status: 400 })
          }
          
          return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 })
        }

        return NextResponse.json({ 
          message: 'Successfully followed user',
          type: 'followed'
        })
      } catch (error) {
        console.error('Follows table not available:', error)
        return NextResponse.json({ error: 'Follow system not available yet' }, { status: 503 })
      }
    }
  } catch (error) {
    console.error('Error in follow API:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Unfollow a user
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { target_user_id } = followSchema.parse(body)

    // Remove follow relationship (with error handling)
    try {
      const { error: followError } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', target_user_id)

      if (followError) {
        console.error('Error removing follow:', followError)
        return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 })
      }

      return NextResponse.json({ message: 'Successfully unfollowed user' })
    } catch (error) {
      console.error('Follows table not available:', error)
      return NextResponse.json({ error: 'Follow system not available yet' }, { status: 503 })
    }
  } catch (error) {
    console.error('Error in unfollow API:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
