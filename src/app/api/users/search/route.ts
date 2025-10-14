import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// Get user search results
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ users: [] })
    }

    // Special case: search for "all" returns all profiles (for testing)
    let usersQuery = supabase
      .from('profiles')
      .select(`
        id,
        username,
        display_name,
        avatar_url,
        bio,
        created_at
      `)
      .neq('id', user.id) // Exclude current user

    if (query.toLowerCase() === 'all') {
      // Return all profiles for testing
      usersQuery = usersQuery.limit(limit)
    } else {
      // Normal search by username or display name
      usersQuery = usersQuery
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(limit)
    }

    const { data: users, error: searchError } = await usersQuery

    if (searchError) {
      console.error('Error searching users:', searchError)
      return NextResponse.json({ error: 'Failed to search users' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ users: [] })
    }

    // Get follow status for each user (with error handling)
    const userIds = users.map(u => u.id)
    let follows: any[] = []
    let requests: any[] = []
    
    try {
      const { data: followsData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .in('following_id', userIds)
      follows = followsData || []
    } catch (error) {
      console.log('Follows table not available yet:', error)
    }

    try {
      const { data: requestsData } = await supabase
        .from('follow_requests')
        .select('target_id')
        .eq('requester_id', user.id)
        .eq('status', 'pending')
        .in('target_id', userIds)
      requests = requestsData || []
    } catch (error) {
      console.log('Follow requests table not available yet:', error)
    }

    // Get user stats (with error handling)
    const usersWithStats = await Promise.all(
      users.map(async (userProfile) => {
        let followersCount = 0
        let followingCount = 0
        let streaksCount = 0

        try {
          const { count: followersCountData } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', userProfile.id)
          followersCount = followersCountData || 0
        } catch (error) {
          console.log('Error getting followers count:', error)
        }

        try {
          const { count: followingCountData } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', userProfile.id)
          followingCount = followingCountData || 0
        } catch (error) {
          console.log('Error getting following count:', error)
        }

        try {
          const { count: streaksCountData } = await supabase
            .from('streaks')
            .select('*', { count: 'exact', head: true })
            .eq('created_by', userProfile.id)
          streaksCount = streaksCountData || 0
        } catch (error) {
          console.log('Error getting streaks count:', error)
        }

        // Determine follow status
        let followStatus = 'not_following'
        if (follows?.some(f => f.following_id === userProfile.id)) {
          followStatus = 'following'
        } else if (requests?.some(r => r.target_id === userProfile.id)) {
          followStatus = 'request_sent'
        }

        return {
          ...userProfile,
          is_private: false, // Default to public until privacy is set up
          followers_count: followersCount,
          following_count: followingCount,
          streaks_count: streaksCount,
          follow_status: followStatus
        }
      })
    )

    return NextResponse.json({ users: usersWithStats })
  } catch (error) {
    console.error('Error in user search API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
