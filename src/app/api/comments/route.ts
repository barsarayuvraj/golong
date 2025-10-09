import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

const createCommentSchema = z.object({
  streak_id: z.string().uuid(),
  content: z.string().min(1).max(1000),
})

const updateCommentSchema = z.object({
  content: z.string().min(1).max(1000),
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
    const validatedData = createCommentSchema.parse(body)

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
        error: 'Cannot comment on private streaks' 
      }, { status: 403 })
    }

    // Create the comment
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .insert({
        streak_id: validatedData.streak_id,
        user_id: user.id,
        content: validatedData.content,
      })
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user:profiles!user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (commentError) {
      console.error('Error creating comment:', commentError)
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }

    return NextResponse.json({ 
      comment,
      message: 'Comment created successfully' 
    })

  } catch (error) {
    console.error('Error in create comment API:', error)
    
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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { searchParams } = new URL(request.url)
    const streakId = searchParams.get('streak_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!streakId) {
      return NextResponse.json({ error: 'streak_id is required' }, { status: 400 })
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(streakId)) {
      return NextResponse.json({ 
        comments: [],
        total: 0,
        hasMore: false,
        message: 'Invalid streak ID format'
      })
    }

    // Verify the streak exists and is public
    const { data: streak, error: streakError } = await supabase
      .from('streaks')
      .select('id, is_public')
      .eq('id', streakId)
      .single()

    if (streakError || !streak) {
      return NextResponse.json({ 
        comments: [],
        total: 0,
        hasMore: false,
        message: 'Streak not found'
      })
    }

    if (!streak.is_public) {
      return NextResponse.json({ 
        comments: [],
        total: 0,
        hasMore: false,
        message: 'Cannot view comments on private streaks'
      })
    }

    // Get comments with user information
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user:profiles!user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('streak_id', streakId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (commentsError) {
      console.error('Error fetching comments:', commentsError)
      return NextResponse.json({ 
        comments: [],
        total: 0,
        hasMore: false,
        message: 'Error fetching comments'
      })
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('streak_id', streakId)

    if (countError) {
      console.error('Error fetching comment count:', countError)
    }

    return NextResponse.json({ 
      comments: comments || [],
      total: count || 0,
      hasMore: (offset + limit) < (count || 0)
    })

  } catch (error) {
    console.error('Error in get comments API:', error)
    return NextResponse.json({ 
      comments: [],
      total: 0,
      hasMore: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get('comment_id')

    if (!commentId) {
      return NextResponse.json({ error: 'comment_id is required' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateCommentSchema.parse(body)

    // Verify the comment belongs to the user
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id, user_id')
      .eq('id', commentId)
      .single()

    if (commentError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    if (comment.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to edit this comment' }, { status: 403 })
    }

    // Update the comment
    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update({
        content: validatedData.content,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user:profiles!user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating comment:', updateError)
      return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
    }

    return NextResponse.json({ 
      comment: updatedComment,
      message: 'Comment updated successfully' 
    })

  } catch (error) {
    console.error('Error in update comment API:', error)
    
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
    const commentId = searchParams.get('comment_id')

    if (!commentId) {
      return NextResponse.json({ error: 'comment_id is required' }, { status: 400 })
    }

    // Verify the comment belongs to the user
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id, user_id')
      .eq('id', commentId)
      .single()

    if (commentError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    if (comment.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this comment' }, { status: 403 })
    }

    // Delete the comment
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (deleteError) {
      console.error('Error deleting comment:', deleteError)
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Comment deleted successfully' 
    })

  } catch (error) {
    console.error('Error in delete comment API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
