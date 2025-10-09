import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Validation schemas
const challengeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  category: z.string().min(1).max(50),
  duration_days: z.number().min(1).max(365),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  max_participants: z.number().min(2).max(1000).optional(),
  prize_description: z.string().max(500).optional(),
  rules: z.string().max(1000).optional(),
})

const updateChallengeSchema = challengeSchema.partial()

// GET /api/challenges - Get challenges
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const challenge_id = searchParams.get('id')
    const user_challenges = searchParams.get('user_challenges') === 'true'
    const active_only = searchParams.get('active_only') === 'true'
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (challenge_id) {
      // Get specific challenge
      const { data: challenge, error } = await supabase
        .from('challenges')
        .select(`
          *,
          profiles!challenges_created_by_fkey(
            id,
            username,
            display_name,
            avatar_url
          ),
          challenge_participants(
            *,
            profiles(
              id,
              username,
              display_name,
              avatar_url
            )
          )
        `)
        .eq('id', challenge_id)
        .single()

      if (error) {
        console.error('Error fetching challenge:', error)
        return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
      }

      return NextResponse.json({ challenge })
    } else {
      // Get multiple challenges
      let query = supabase
        .from('challenges')
        .select(`
          *,
          profiles!challenges_created_by_fkey(
            id,
            username,
            display_name,
            avatar_url
          ),
          challenge_participants(count)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (user_challenges) {
        // Get challenges created by user
        query = query.eq('created_by', user.id)
      }

      if (active_only) {
        query = query.eq('is_active', true)
      }

      if (category) {
        query = query.eq('category', category)
      }

      const { data: challenges, error } = await query

      if (error) {
        console.error('Error fetching challenges:', error)
        return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 })
      }

      return NextResponse.json({ challenges })
    }
  } catch (error) {
    console.error('Challenges GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/challenges - Create a new challenge
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = challengeSchema.parse(body)

    // Validate dates
    const startDate = new Date(validatedData.start_date)
    const endDate = new Date(validatedData.end_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (startDate < today) {
      return NextResponse.json({ error: 'Start date cannot be in the past' }, { status: 400 })
    }

    if (endDate <= startDate) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
    }

    const { data: challenge, error } = await supabase
      .from('challenges')
      .insert({
        ...validatedData,
        created_by: user.id,
      })
      .select(`
        *,
        profiles!challenges_created_by_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error creating challenge:', error)
      return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 })
    }

    return NextResponse.json({ challenge }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Challenges POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/challenges - Update a challenge
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const challengeId = searchParams.get('id')

    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateChallengeSchema.parse(body)

    // Verify the user owns this challenge
    const { data: existingChallenge, error: existingError } = await supabase
      .from('challenges')
      .select('created_by')
      .eq('id', challengeId)
      .single()

    if (existingError || !existingChallenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    if (existingChallenge.created_by !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { data: challenge, error } = await supabase
      .from('challenges')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', challengeId)
      .select(`
        *,
        profiles!challenges_created_by_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error updating challenge:', error)
      return NextResponse.json({ error: 'Failed to update challenge' }, { status: 500 })
    }

    return NextResponse.json({ challenge })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Challenges PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/challenges - Delete a challenge
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const challengeId = searchParams.get('id')

    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 })
    }

    // Verify the user owns this challenge
    const { data: existingChallenge, error: existingError } = await supabase
      .from('challenges')
      .select('created_by')
      .eq('id', challengeId)
      .single()

    if (existingError || !existingChallenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    if (existingChallenge.created_by !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { error } = await supabase
      .from('challenges')
      .delete()
      .eq('id', challengeId)

    if (error) {
      console.error('Error deleting challenge:', error)
      return NextResponse.json({ error: 'Failed to delete challenge' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Challenge deleted successfully' })
  } catch (error) {
    console.error('Challenges DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/challenges/join - Join a challenge
export async function JOIN_CHALLENGE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { challenge_id } = body

    if (!challenge_id) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 })
    }

    // Verify the challenge exists and is active
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('is_active, max_participants, start_date, end_date')
      .eq('id', challenge_id)
      .single()

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    if (!challenge.is_active) {
      return NextResponse.json({ error: 'Challenge is not active' }, { status: 400 })
    }

    // Check if challenge has started
    const today = new Date()
    const startDate = new Date(challenge.start_date)
    if (today < startDate) {
      return NextResponse.json({ error: 'Challenge has not started yet' }, { status: 400 })
    }

    // Check if challenge has ended
    const endDate = new Date(challenge.end_date)
    if (today > endDate) {
      return NextResponse.json({ error: 'Challenge has ended' }, { status: 400 })
    }

    // Check participant limit
    if (challenge.max_participants) {
      const { count: participantCount, error: countError } = await supabase
        .from('challenge_participants')
        .select('*', { count: 'exact', head: true })
        .eq('challenge_id', challenge_id)

      if (!countError && participantCount && participantCount >= challenge.max_participants) {
        return NextResponse.json({ error: 'Challenge is full' }, { status: 400 })
      }
    }

    // Check if user is already participating
    const { data: existingParticipation, error: existingError } = await supabase
      .from('challenge_participants')
      .select('id')
      .eq('challenge_id', challenge_id)
      .eq('user_id', user.id)
      .single()

    if (existingParticipation) {
      return NextResponse.json({ error: 'Already participating in this challenge' }, { status: 409 })
    }

    // Join the challenge
    const { data: participation, error } = await supabase
      .from('challenge_participants')
      .insert({
        challenge_id,
        user_id: user.id,
      })
      .select(`
        *,
        profiles(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error joining challenge:', error)
      return NextResponse.json({ error: 'Failed to join challenge' }, { status: 500 })
    }

    return NextResponse.json({ participation }, { status: 201 })
  } catch (error) {
    console.error('Join challenge error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/challenges/leave - Leave a challenge
export async function LEAVE_CHALLENGE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const challengeId = searchParams.get('challenge_id')

    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('challenge_participants')
      .delete()
      .eq('challenge_id', challengeId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error leaving challenge:', error)
      return NextResponse.json({ error: 'Failed to leave challenge' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Left challenge successfully' })
  } catch (error) {
    console.error('Leave challenge error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
