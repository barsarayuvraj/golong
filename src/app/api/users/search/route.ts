import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: 'Search query must be at least 2 characters' }, { status: 400 })
    }

    // Search for users by username or display name
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, created_at')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .neq('id', user.id) // Exclude current user
      .limit(limit)

    if (error) {
      console.error('Error searching users:', error)
      return NextResponse.json({ error: 'Failed to search users' }, { status: 500 })
    }

    // Check which users are blocked or have blocked the current user
    const userIds = users.map(u => u.id)
    const { data: blockedUsers } = await supabase
      .from('blocked_users')
      .select('blocker_id, blocked_id')
      .or(`blocker_id.in.(${userIds.join(',')}),blocked_id.in.(${userIds.join(',')})`)

    const blockedSet = new Set()
    if (blockedUsers) {
      blockedUsers.forEach(block => {
        if (block.blocker_id === user.id) {
          blockedSet.add(block.blocked_id)
        } else if (block.blocked_id === user.id) {
          blockedSet.add(block.blocker_id)
        }
      })
    }

    // Filter out blocked users
    const filteredUsers = users.filter(user => !blockedSet.has(user.id))

    return NextResponse.json({ users: filteredUsers })
  } catch (error) {
    console.error('User search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}