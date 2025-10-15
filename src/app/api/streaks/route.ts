import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

const createStreakSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: z.string().optional(),
  is_public: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const category = searchParams.get('category')
    const is_public = searchParams.get('is_public')

    // Build query
    let query = supabase
      .from('streaks')
      .select(`
        *,
        profiles:created_by (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (category) {
      query = query.eq('category', category)
    }
    if (is_public !== null) {
      query = query.eq('is_public', is_public === 'true')
    }

    const { data: streaks, error: streaksError } = await query

    if (streaksError) {
      console.error('Error fetching streaks:', streaksError)
      return NextResponse.json({ error: 'Failed to fetch streaks' }, { status: 500 })
    }

    // Get user's participation status for each streak
    const streakIds = streaks.map(s => s.id)
    const { data: userStreaks } = await supabase
      .from('user_streaks')
      .select('streak_id, current_streak_days, longest_streak_days, last_checkin_date, joined_at, is_active')
      .eq('user_id', user.id)
      .in('streak_id', streakIds)

    // Combine streak data with user participation
    const streaksWithUserData = streaks.map(streak => {
      const userStreak = userStreaks?.find(us => us.streak_id === streak.id)
      return {
        streak,
        user_streak: userStreak || null
      }
    })

    return NextResponse.json({ 
      streaks: streaksWithUserData,
      total: streaks.length
    })

  } catch (error) {
    console.error('Error in get streaks API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createStreakSchema.parse(body)

    // Create the streak
    const { data: streak, error: streakError } = await supabase
      .from('streaks')
      .insert({
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        is_public: validatedData.is_public,
        tags: validatedData.tags,
        created_by: user.id,
      })
      .select()
      .single()

    if (streakError) {
      console.error('Error creating streak:', streakError)
      return NextResponse.json({ error: 'Failed to create streak' }, { status: 500 })
    }

    // Create user_streak entry (user joins their own streak)
    const { data: userStreak, error: userStreakError } = await supabase
      .from('user_streaks')
      .insert({
        user_id: user.id,
        streak_id: streak.id,
        current_streak_days: 0,
        longest_streak_days: 0,
        is_active: true,
      })
      .select()
      .single()

    if (userStreakError) {
      console.error('Error creating user streak:', userStreakError)
      return NextResponse.json({ error: 'Failed to join streak' }, { status: 500 })
    }

    return NextResponse.json({ 
      id: streak.id,
      user_streak_id: userStreak.id,
      message: 'Streak created successfully' 
    })

  } catch (error) {
    console.error('Error in create streak API:', error)
    
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
