import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

const noteSchema = z.object({
  streak_id: z.string(),
  content: z.string().min(1, 'Note cannot be empty'),
})

// GET /api/notes - Get notes for a streak
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const streakId = searchParams.get('streak_id')

    if (!streakId) {
      return NextResponse.json({ error: 'Streak ID is required' }, { status: 400 })
    }

    // Verify the streak exists and user has access
    const { data: streak, error: streakError } = await supabase
      .from('streaks')
      .select('is_public, created_by')
      .eq('id', streakId)
      .single()

    if (streakError || !streak) {
      return NextResponse.json({ error: 'Streak not found' }, { status: 404 })
    }

    // Check if user has access to view notes for this streak
    let hasAccess = false
    
    // Owner can always view notes
    if (streak.created_by === user.id) {
      hasAccess = true
    }
    // For private streaks, only the owner can view notes
    else if (!streak.is_public) {
      hasAccess = false
    }
    // For public streaks, anyone can view notes (if they exist)
    else {
      hasAccess = true
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get notes for this streak, ordered by most recent first
    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .eq('streak_id', streakId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notes:', error)
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
    }

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('Notes GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/notes - Create a new note
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('Auth check:', { user: user?.id, authError })

    if (authError || !user) {
      console.log('Authentication failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = noteSchema.parse(body)

    // Verify the streak exists and user has access
    const { data: streak, error: streakError } = await supabase
      .from('streaks')
      .select('is_public, created_by')
      .eq('id', validatedData.streak_id)
      .single()

    if (streakError || !streak) {
      return NextResponse.json({ error: 'Streak not found' }, { status: 404 })
    }

    // Check if user has access to create notes for this streak
    let hasAccess = false
    
    // Owner can always create notes
    if (streak.created_by === user.id) {
      hasAccess = true
    }
    // For private streaks, only the owner can create notes
    else if (!streak.is_public) {
      hasAccess = false
    }
    // For public streaks, anyone can create notes
    else {
      hasAccess = true
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Create the note
    const { data: note, error } = await supabase
      .from('notes')
      .insert({
        streak_id: validatedData.streak_id,
        user_id: user.id,
        content: validatedData.content,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating note:', error)
      return NextResponse.json({ error: 'Failed to create note', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ note }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Notes POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/notes - Update a note
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get('id')

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { content } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 })
    }

    // Update the note (only if user owns it)
    const { data: note, error } = await supabase
      .from('notes')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', noteId)
      .eq('user_id', user.id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating note:', error)
      return NextResponse.json({ error: 'Failed to update note' }, { status: 500 })
    }

    if (!note) {
      return NextResponse.json({ error: 'Note not found or access denied' }, { status: 404 })
    }

    return NextResponse.json({ note })
  } catch (error) {
    console.error('Notes PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/notes - Delete a note
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get('id')

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 })
    }

    // Delete the note (only if user owns it)
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting note:', error)
      return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notes DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
