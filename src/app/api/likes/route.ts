import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Validation schemas
const likeSchema = z.object({
  streak_id: z.string().uuid(),
})

// GET /api/likes - Get likes for a streak or check if user has liked
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const streak_id = searchParams.get('streak_id')
    const check_user_like = searchParams.get('check_user_like') === 'true'

    if (!streak_id) {
      return NextResponse.json({ error: 'Streak ID is required' }, { status: 400 })
    }

    // Verify the streak exists and is public
    const { data: streak, error: streakError } = await supabase
      .from('streaks')
      .select('is_public')
      .eq('id', streak_id)
      .single()

    if (streakError || !streak) {
      return NextResponse.json({ error: 'Streak not found' }, { status: 404 })
    }

    if (!streak.is_public) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (check_user_like) {
      // Check if current user has liked this streak
      const { data: userLike, error: userLikeError } = await supabase
        .from('likes')
        .select('id')
        .eq('streak_id', streak_id)
        .eq('user_id', user.id)
        .single()

      if (userLikeError && userLikeError.code !== 'PGRST116') {
        console.error('Error checking user like:', userLikeError)
        return NextResponse.json({ error: 'Failed to check user like' }, { status: 500 })
      }

      return NextResponse.json({ 
        has_liked: !!userLike,
        like_id: userLike?.id || null
      })
    } else {
      // Get all likes for the streak with user info
      const { data: likes, error } = await supabase
        .from('likes')
        .select(`
          *,
          profiles!inner(
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('streak_id', streak_id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching likes:', error)
        return NextResponse.json({ error: 'Failed to fetch likes' }, { status: 500 })
      }

      return NextResponse.json({ 
        likes,
        count: likes.length
      })
    }
  } catch (error) {
    console.error('Likes GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/likes - Like a streak
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = likeSchema.parse(body)

    // Verify the streak exists and is public
    const { data: streak, error: streakError } = await supabase
      .from('streaks')
      .select('is_public, created_by')
      .eq('id', validatedData.streak_id)
      .single()

    if (streakError || !streak) {
      return NextResponse.json({ error: 'Streak not found' }, { status: 404 })
    }

    if (!streak.is_public) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if user already liked this streak
    const { data: existingLike, error: existingError } = await supabase
      .from('likes')
      .select('id')
      .eq('streak_id', validatedData.streak_id)
      .eq('user_id', user.id)
      .single()

    if (existingLike) {
      return NextResponse.json({ error: 'Already liked this streak' }, { status: 409 })
    }

    // Create the like
    const { data: like, error } = await supabase
      .from('likes')
      .insert({
        streak_id: validatedData.streak_id,
        user_id: user.id,
      })
      .select(`
        *,
        profiles!inner(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error creating like:', error)
      return NextResponse.json({ error: 'Failed to create like' }, { status: 500 })
    }

    return NextResponse.json({ like }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Likes POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/likes - Unlike a streak
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const streak_id = searchParams.get('streak_id')
    const like_id = searchParams.get('like_id')

    if (!streak_id && !like_id) {
      return NextResponse.json({ error: 'Streak ID or Like ID is required' }, { status: 400 })
    }

    let query = supabase
      .from('likes')
      .delete()
      .eq('user_id', user.id)

    if (like_id) {
      query = query.eq('id', like_id)
    } else if (streak_id) {
      query = query.eq('streak_id', streak_id)
    }

    const { error } = await query

    if (error) {
      console.error('Error deleting like:', error)
      return NextResponse.json({ error: 'Failed to delete like' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Like removed successfully' })
  } catch (error) {
    console.error('Likes DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}