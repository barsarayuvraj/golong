'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  UserPlus, 
  UserCheck, 
  Clock, 
  Users, 
  Target, 
  Calendar, 
  Flame,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface UserProfile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  is_private: boolean
  created_at: string
  followers_count: number
  following_count: number
  streaks_count: number
  follow_status?: 'following' | 'request_sent' | 'not_following'
}

interface UserStreak {
  id: string
  title: string
  description: string | null
  category: string | null
  is_public: boolean
  created_at: string
  start_date: string | null
  end_date: string | null
  current_streak_days: number
  longest_streak_days: number
  tags: string[]
  is_joined?: boolean
}

interface Activity {
  id: string
  type: string
  description: string
  timestamp: string
}

export default function UserProfilePage() {
  const params = useParams()
  const username = params.username as string
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [streaks, setStreaks] = useState<UserStreak[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)

  const supabase = createClient()

  // Load user profile
  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          display_name,
          avatar_url,
          bio,
          is_private,
          created_at
        `)
        .eq('username', username)
        .single()

      if (profileError) throw profileError
      if (!profileData) {
        setProfile(null)
        return
      }

      // Get follow counts
      const { data: followersData } = await supabase
        .from('follows')
        .select('id')
        .eq('following_id', profileData.id)

      const { data: followingData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', profileData.id)

      // Get streaks count
      const { data: streaksData } = await supabase
        .from('streaks')
        .select('id')
        .eq('created_by', profileData.id)

      // Check follow status if user is logged in
      let followStatus = 'not_following'
      if (user) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', profileData.id)
          .single()

        const { data: requestData } = await supabase
          .from('follow_requests')
          .select('id')
          .eq('requester_id', user.id)
          .eq('target_id', profileData.id)
          .eq('status', 'pending')
          .single()

        if (followData) followStatus = 'following'
        else if (requestData) followStatus = 'request_sent'

        // Check if user has access to private profile
        if (profileData.is_private && followStatus !== 'following') {
          setHasAccess(false)
        } else {
          setHasAccess(true)
        }
      } else {
        setHasAccess(!profileData.is_private)
      }

      const userProfile: UserProfile = {
        ...profileData,
        followers_count: followersData?.length || 0,
        following_count: followingData?.length || 0,
        streaks_count: streaksData?.length || 0,
        follow_status: followStatus as any
      }

      setProfile(userProfile)
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    }
  }

  // Load user's public streaks
  const loadStreaks = async () => {
    if (!profile || !hasAccess) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('streaks')
        .select(`
          id,
          title,
          description,
          category,
          is_public,
          created_at,
          start_date,
          end_date,
          tags
        `)
        .eq('created_by', profile.id)
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get streak stats for each streak
      const streakIds = data.map(s => s.id)
      const { data: userStreaksData } = await supabase
        .from('user_streaks')
        .select(`
          streak_id,
          current_streak_days,
          longest_streak_days
        `)
        .eq('user_id', profile.id)
        .in('streak_id', streakIds)

      // Check if current user has joined any of these streaks
      let currentUserJoinedStreaks: string[] = []
      if (user) {
        const { data: currentUserStreaks, error: currentUserError } = await supabase
          .from('user_streaks')
          .select('streak_id')
          .eq('user_id', user.id)
          .in('streak_id', streakIds)
          .eq('is_active', true)
        
        if (currentUserError) {
          console.error('Error checking current user streaks:', currentUserError)
        } else {
          currentUserJoinedStreaks = currentUserStreaks?.map(us => us.streak_id) || []
        }
      }

      const streaksWithStats = data.map(streak => {
        const userStreak = userStreaksData?.find(us => us.streak_id === streak.id)
        const isJoined = currentUserJoinedStreaks.includes(streak.id)
        
        console.log(`Streak ${streak.title}: is_joined = ${isJoined}, joined streaks:`, currentUserJoinedStreaks)
        
        return {
          ...streak,
          current_streak_days: userStreak?.current_streak_days || 0,
          longest_streak_days: userStreak?.longest_streak_days || 0,
          is_joined: isJoined
        }
      })

      setStreaks(streaksWithStats)
    } catch (error) {
      console.error('Error loading streaks:', error)
    }
  }

  // Load user activities
  const loadActivities = async () => {
    if (!profile || !hasAccess) return

    try {
      const activities: Activity[] = []

      // Get recent check-ins
      const { data: checkinsData } = await supabase
        .from('checkins')
        .select(`
          id,
          checkin_date,
          created_at,
          user_streaks!inner(
            streak_id,
            streaks!inner(
              title,
              is_public
            )
          )
        `)
        .eq('user_streaks.user_id', profile.id)
        .eq('user_streaks.streaks.is_public', true)
        .order('created_at', { ascending: false })
        .limit(10)

      checkinsData?.forEach(checkin => {
        activities.push({
          id: `checkin_${checkin.id}`,
          type: 'checkin',
          description: `Checked in to "${checkin.user_streaks.streaks.title}"`,
          timestamp: checkin.created_at
        })
      })

      // Get recent streak creations
      const { data: streaksData } = await supabase
        .from('streaks')
        .select('id, title, created_at')
        .eq('created_by', profile.id)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(5)

      streaksData?.forEach(streak => {
        activities.push({
          id: `streak_${streak.id}`,
          type: 'streak_created',
          description: `Created streak "${streak.title}"`,
          timestamp: streak.created_at
        })
      })

      // Sort by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setActivities(activities.slice(0, 20))
    } catch (error) {
      console.error('Error loading activities:', error)
    }
  }

  // Follow user
  const followUser = async () => {
    if (!profile) return

    setFollowLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (profile.is_private) {
        // Send follow request
        const { error } = await supabase
          .from('follow_requests')
          .insert({
            requester_id: user.id,
            target_id: profile.id,
            status: 'pending'
          })

        if (error) throw error
        toast.success('Follow request sent!')
        setProfile(prev => prev ? { ...prev, follow_status: 'request_sent' } : null)
      } else {
        // Direct follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: profile.id
          })

        if (error) throw error
        toast.success('Following user!')
        setProfile(prev => prev ? { ...prev, follow_status: 'following' } : null)
        setHasAccess(true)
        loadStreaks()
        loadActivities()
      }
    } catch (error) {
      console.error('Error following user:', error)
      toast.error('Failed to follow user')
    } finally {
      setFollowLoading(false)
    }
  }

  // Unfollow user
  const unfollowUser = async () => {
    if (!profile) return

    setFollowLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profile.id)

      if (error) throw error
      toast.success('Unfollowed user')
      setProfile(prev => prev ? { ...prev, follow_status: 'not_following' } : null)
      
      if (profile.is_private) {
        setHasAccess(false)
        setStreaks([])
        setActivities([])
      }
    } catch (error) {
      console.error('Error unfollowing user:', error)
      toast.error('Failed to unfollow user')
    } finally {
      setFollowLoading(false)
    }
  }

  // Join streak
  const joinStreak = async (streakId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please log in to join streaks')
        return
      }

      console.log('Attempting to join streak:', streakId, 'for user:', user.id)

      const response = await fetch('/api/streaks/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streak_id: streakId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to join streak')
      }

      toast.success('Successfully joined streak!')
      
      // Update the streak's joined status
      setStreaks(prev => prev.map(streak => 
        streak.id === streakId 
          ? { ...streak, is_joined: true }
          : streak
      ))
    } catch (error: any) {
      console.error('Error joining streak:', error)
      toast.error(error.message || 'Failed to join streak')
    }
  }

  useEffect(() => {
    loadProfile()
  }, [username])

  useEffect(() => {
    if (profile) {
      loadStreaks()
      loadActivities()
      setLoading(false)
    }
  }, [profile, hasAccess])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h1>
          <p className="text-gray-600">The user you're looking for doesn't exist.</p>
          <Link href="/streakers">
            <Button className="mt-4">Back to Streakers</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl">
                  {profile.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold">{profile.display_name || profile.username}</h1>
                  {profile.is_private && (
                    <Badge variant="outline" className="text-xs">
                      <Lock className="h-3 w-3 mr-1" />
                      Private
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600 mb-2">@{profile.username}</p>
                {profile.bio && (
                  <p className="text-gray-700 mb-3">{profile.bio}</p>
                )}
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span>{profile.streaks_count} streaks</span>
                  <span>{profile.followers_count} followers</span>
                  <span>{profile.following_count} following</span>
                  <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {profile.follow_status === 'following' ? (
                <Button 
                  variant="outline" 
                  onClick={unfollowUser}
                  disabled={followLoading}
                >
                  <UserCheck className="h-4 w-4 mr-1" />
                  Following
                </Button>
              ) : profile.follow_status === 'request_sent' ? (
                <Button variant="outline" disabled>
                  <Clock className="h-4 w-4 mr-1" />
                  Request Sent
                </Button>
              ) : (
                <Button 
                  onClick={followUser}
                  disabled={followLoading}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  {profile.is_private ? 'Send Request' : 'Follow'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {!hasAccess ? (
        <Card>
          <CardContent className="p-8 text-center">
            <EyeOff className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold mb-2">Private Profile</h2>
            <p className="text-gray-600 mb-4">
              This user has a private profile. Send a follow request to see their content.
            </p>
            <Button onClick={followUser} disabled={followLoading}>
              <UserPlus className="h-4 w-4 mr-1" />
              Send Follow Request
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="streaks" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="streaks">Public Streaks</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="streaks" className="space-y-4">
            {streaks.length > 0 ? (
              <div className="grid gap-4">
                {streaks.map((streak) => (
                  <Card key={streak.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{streak.title}</CardTitle>
                          {streak.description && (
                            <CardDescription className="mt-1">{streak.description}</CardDescription>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {streak.category && (
                            <Badge variant="outline">{streak.category}</Badge>
                          )}
                          <Badge variant="secondary">Public</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{streak.current_streak_days}</div>
                          <div className="text-sm text-gray-600">Current Streak</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{streak.longest_streak_days}</div>
                          <div className="text-sm text-gray-600">Longest Streak</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress to 30 days</span>
                          <span>{Math.min(100, (streak.current_streak_days / 30) * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={Math.min(100, (streak.current_streak_days / 30) * 100)} />
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Link href={`/streaks/${streak.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            View Streak
                          </Button>
                        </Link>
                        {!streak.is_joined && (
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => joinStreak(streak.id)}
                          >
                            Join Streak
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No public streaks yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            {activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <Card key={activity.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {activity.type === 'checkin' ? (
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <Flame className="h-4 w-4 text-green-600" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Target className="h-4 w-4 text-blue-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recent activity</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
