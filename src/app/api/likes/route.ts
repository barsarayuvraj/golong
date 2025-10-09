import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

const likeSchema = z.object({
  streak_id: z.string().uuid(),
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
    const validatedData = likeSchema.parse(body)

    // Verify the streak exists and is public
    const { data: streak, error: streakError } = await supabase
      .from('streaks')
      .select('id, is_public')
      .eq('id', validatedData.streak_id)
      .single()

    if (streakError || !streak) {
      return NextResponse.json({ 
        error: 'Streak not found' 
      }, { status: 404 })
    }

    if (!streak.is_public) {
      return NextResponse.json({ 
        error: 'Cannot like private streaks' 
      }, { status: 403 })
    }

    // Check if user already liked this streak
    const { data: existingLike, error: existingError } = await supabase
      .from('likes')
      .select('id')
      .eq('streak_id', validatedData.streak_id)
      .eq('user_id', user.id)
      .single()

    if (existingLike) {
      return NextResponse.json({ 
        error: 'Already liked this streak',
        liked: true
      }, { status: 409 })
    }

    // Create the like
    const { data: like, error: likeError } = await supabase
      .from('likes')
      .insert({
        streak_id: validatedData.streak_id,
        user_id: user.id,
      })
      .select()
      .single()

    if (likeError) {
      console.error('Error creating like:', likeError)
      return NextResponse.json({ error: 'Failed to like streak' }, { status: 500 })
    }

    // Get updated like count
    const { count, error: countError } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('streak_id', validatedData.streak_id)

    if (countError) {
      console.error('Error fetching like count:', countError)
    }

    return NextResponse.json({ 
      id: like.id,
      liked: true,
      likeCount: count || 0,
      message: 'Streak liked successfully' 
    })

  } catch (error) {
    console.error('Error in like streak API:', error)
    
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
    const streakId = searchParams.get('streak_id')

    if (!streakId) {
      return NextResponse.json({ error: 'streak_id is required' }, { status: 400 })
    }

    // Delete the like
    const { error: deleteError } = await supabase
      .from('likes')
      .delete()
      .eq('streak_id', streakId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting like:', deleteError)
      return NextResponse.json({ error: 'Failed to unlike streak' }, { status: 500 })
    }

    // Get updated like count
    const { count, error: countError } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('streak_id', streakId)

    if (countError) {
      console.error('Error fetching like count:', countError)
    }

    return NextResponse.json({ 
      liked: false,
      likeCount: count || 0,
      message: 'Streak unliked successfully' 
    })

  } catch (error) {
    console.error('Error in unlike streak API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { searchParams } = new URL(request.url)
    const streakId = searchParams.get('streak_id')

    if (!streakId) {
      return NextResponse.json({ error: 'streak_id is required' }, { status: 400 })
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(streakId)) {
      return NextResponse.json({ 
        likeCount: 0,
        liked: false,
        message: 'Invalid streak ID format'
      })
    }

    // Get like count
    const { count, error: countError } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('streak_id', streakId)

    if (countError) {
      console.error('Error fetching like count:', countError)
      return NextResponse.json({ 
        likeCount: 0,
        liked: false,
        message: 'Error fetching like count'
      })
    }

    // Check if current user liked this streak (if authenticated)
    let userLiked = false
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: userLike } = await supabase
        .from('likes')
        .select('id')
        .eq('streak_id', streakId)
        .eq('user_id', user.id)
        .single()
      
      userLiked = !!userLike
    }

    return NextResponse.json({ 
      likeCount: count || 0,
      liked: userLiked
    })

  } catch (error) {
    console.error('Error in get likes API:', error)
    return NextResponse.json({ 
      likeCount: 0,
      liked: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}
