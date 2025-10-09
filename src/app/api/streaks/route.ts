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
    const { error: userStreakError } = await supabase
      .from('user_streaks')
      .insert({
        user_id: user.id,
        streak_id: streak.id,
        current_streak_days: 0,
        longest_streak_days: 0,
        is_active: true,
      })

    if (userStreakError) {
      console.error('Error creating user streak:', userStreakError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({ 
      id: streak.id,
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
