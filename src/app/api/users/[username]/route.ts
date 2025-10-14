import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// Get user profile by username
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { username } = await params

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        display_name,
        avatar_url,
        bio,
        created_at
      `)
      .eq('username', username)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Default to public profile until privacy is set up
    const isPrivate = false

    // Get follow counts (with error handling)
    let followersCount = 0
    let followingCount = 0
    let streaksCount = 0

    try {
      const { count: followersCountData } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profile.id)
      followersCount = followersCountData || 0
    } catch (error) {
      console.log('Error getting followers count:', error)
    }

    try {
      const { count: followingCountData } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profile.id)
      followingCount = followingCountData || 0
    } catch (error) {
      console.log('Error getting following count:', error)
    }

    try {
      const { count: streaksCountData } = await supabase
        .from('streaks')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', profile.id)
      streaksCount = streaksCountData || 0
    } catch (error) {
      console.log('Error getting streaks count:', error)
    }

    // Check follow status (with error handling)
    let followData = null
    let requestData = null

    try {
      const { data: followDataResult } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', profile.id)
        .single()
      followData = followDataResult
    } catch (error) {
      console.log('Error checking follow status:', error)
    }

    try {
      const { data: requestDataResult } = await supabase
        .from('follow_requests')
        .select('id')
        .eq('requester_id', user.id)
        .eq('target_id', profile.id)
        .eq('status', 'pending')
        .single()
      requestData = requestDataResult
    } catch (error) {
      console.log('Error checking follow request status:', error)
    }

    let followStatus = 'not_following'
    if (followData) {
      followStatus = 'following'
    } else if (requestData) {
      followStatus = 'request_sent'
    }

    // Check if user has access to private profile
    const hasAccess = !isPrivate || followStatus === 'following'

    const userProfile = {
      ...profile,
      is_private: isPrivate,
      followers_count: followersCount || 0,
      following_count: followingCount || 0,
      streaks_count: streaksCount || 0,
      follow_status: followStatus,
      has_access: hasAccess
    }

    return NextResponse.json({ profile: userProfile })
  } catch (error) {
    console.error('Error in user profile API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
