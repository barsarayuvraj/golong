'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, UserPlus, Users, UserCheck, Clock, Flame } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface User {
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

interface FollowRequest {
  id: string
  requester_id: string
  target_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  requester: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

export default function StreakersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [following, setFollowing] = useState<User[]>([])
  const [followers, setFollowers] = useState<User[]>([])
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('search')
  const [userStats, setUserStats] = useState({
    followersCount: 0,
    followingCount: 0
  })
  const [followingSearchQuery, setFollowingSearchQuery] = useState('')
  const [followersSearchQuery, setFollowersSearchQuery] = useState('')

  const supabase = createClient()

  // Filter functions for following and followers
  const getFilteredFollowing = () => {
    if (!followingSearchQuery.trim()) return following
    return following.filter(user => 
      user.username.toLowerCase().includes(followingSearchQuery.toLowerCase()) ||
      (user.display_name && user.display_name.toLowerCase().includes(followingSearchQuery.toLowerCase()))
    )
  }

  const getFilteredFollowers = () => {
    if (!followersSearchQuery.trim()) return followers
    return followers.filter(user => 
      user.username.toLowerCase().includes(followersSearchQuery.toLowerCase()) ||
      (user.display_name && user.display_name.toLowerCase().includes(followersSearchQuery.toLowerCase()))
    )
  }

  // Load user's own stats
  const loadUserStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let followersCount = 0
      let followingCount = 0

      try {
        const { count: followersCountData } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id)
        followersCount = followersCountData || 0
      } catch (error) {
        console.log('Error getting followers count:', error)
      }

      try {
        const { count: followingCountData } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', user.id)
        followingCount = followingCountData || 0
      } catch (error) {
        console.log('Error getting following count:', error)
      }

      setUserStats({
        followersCount,
        followingCount
      })
    } catch (error) {
      console.error('Error loading user stats:', error)
    }
  }

  // Search users
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=20`)
      
      if (!response.ok) {
        throw new Error('Failed to search users')
      }

      const data = await response.json()
      setSearchResults(data.users || [])
    } catch (error) {
      console.error('Error searching users:', error)
      toast.error('Failed to search users')
    } finally {
      setLoading(false)
    }
  }

  // Follow a user
  const followUser = async (userId: string, isPrivate: boolean) => {
    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_user_id: userId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to follow user')
      }

      const result = await response.json()
      
      if (result.type === 'request_sent') {
        toast.success('Follow request sent!')
      } else {
        toast.success('Following user!')
      }

      // Update search results based on actual API response
      setSearchResults(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, follow_status: result.type === 'request_sent' ? 'request_sent' : 'following' }
          : u
      ))

      // Refresh user stats
      loadUserStats()
    } catch (error: any) {
      console.error('Error following user:', error)
      toast.error(error.message || 'Failed to follow user')
    }
  }

  // Unfollow a user
  const unfollowUser = async (userId: string) => {
    try {
      const response = await fetch('/api/follow', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_user_id: userId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to unfollow user')
      }

      toast.success('Unfollowed user')

      // Update search results and following list
      setSearchResults(prev => prev.map(u => 
        u.id === userId ? { ...u, follow_status: 'not_following' } : u
      ))
      setFollowing(prev => prev.filter(u => u.id !== userId))

      // Refresh user stats
      loadUserStats()
    } catch (error: any) {
      console.error('Error unfollowing user:', error)
      toast.error(error.message || 'Failed to unfollow user')
    }
  }

  // Accept follow request
  const acceptFollowRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/follow-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: requestId,
          action: 'accept'
        }),
      })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to accept follow request')
    }

      toast.success('Follow request accepted!')
      
      // Remove the accepted request from local state immediately
      setFollowRequests(prev => prev.filter(request => request.id !== requestId))
      
      // Also refresh from server to ensure consistency
      await loadFollowRequests()
      
      // Refresh user stats (followers count increased)
      loadUserStats()
    } catch (error: any) {
      console.error('Error accepting follow request:', error)
      toast.error(error.message || 'Failed to accept follow request')
    }
  }

  // Reject follow request
  const rejectFollowRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/follow-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: requestId,
          action: 'reject'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject follow request')
      }

      toast.success('Follow request rejected')
      
      // Remove the rejected request from local state immediately
      setFollowRequests(prev => prev.filter(request => request.id !== requestId))
    } catch (error: any) {
      console.error('Error rejecting follow request:', error)
      toast.error(error.message || 'Failed to reject follow request')
    }
  }

  // Load following list
  const loadFollowing = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('follows')
        .select(`
          following_id,
          profiles!following_id (
            id,
            username,
            display_name,
            avatar_url,
            bio,
            is_private,
            created_at
          )
        `)
        .eq('follower_id', user.id)

      if (error) throw error

      // Get stats for each user
      const followingUsers = await Promise.all(
        data.map(async (f: any) => {
          const userProfile = f.profiles
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

          return {
            ...userProfile,
            followers_count: followersCount,
            following_count: followingCount,
            streaks_count: streaksCount,
            follow_status: 'following' as const
          }
        })
      )

      setFollowing(followingUsers)
    } catch (error) {
      console.error('Error loading following:', error)
    }
  }

  // Load followers list
  const loadFollowers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('follows')
        .select(`
          follower_id,
          profiles!follower_id (
            id,
            username,
            display_name,
            avatar_url,
            bio,
            is_private,
            created_at
          )
        `)
        .eq('following_id', user.id)

      if (error) throw error

      // Get stats for each user
      const followerUsers = await Promise.all(
        data.map(async (f: any) => {
          const userProfile = f.profiles
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

          return {
            ...userProfile,
            followers_count: followersCount,
            following_count: followingCount,
            streaks_count: streaksCount,
            follow_status: 'not_following' as const
          }
        })
      )

      setFollowers(followerUsers)
    } catch (error) {
      console.error('Error loading followers:', error)
    }
  }

  // Load follow requests
  const loadFollowRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // First, get the follow requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('follow_requests')
        .select('id, requester_id, target_id, status, created_at')
        .eq('target_id', user.id)
        .eq('status', 'pending')

      if (requestsError) throw requestsError

      if (!requestsData || requestsData.length === 0) {
        setFollowRequests([])
        return
      }

            // Get the requester profiles
            const requesterIds = requestsData.map((req: any) => req.requester_id)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', requesterIds)

      if (profilesError) throw profilesError

            // Combine the data
            const transformedData = requestsData.map((request: any) => {
              const profile = profilesData?.find((p: any) => p.id === request.requester_id)
        return {
          id: request.id,
          requester_id: request.requester_id,
          target_id: request.target_id,
          status: request.status,
          created_at: request.created_at,
          requester: profile
        }
      })

      setFollowRequests(transformedData)
    } catch (error) {
      console.error('Error loading follow requests:', error)
      setFollowRequests([])
    }
  }

  useEffect(() => {
    if (activeTab === 'following') loadFollowing()
    if (activeTab === 'followers') loadFollowers()
    if (activeTab === 'requests') loadFollowRequests()
  }, [activeTab])

  // Load follow requests and user stats on component mount
  useEffect(() => {
    loadFollowRequests()
    loadUserStats()
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Streakers</h1>
        <p className="text-gray-600">Discover and connect with other streak enthusiasts</p>
      </div>

      {/* User Stats Summary */}
      <div className="mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-12">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{userStats.followersCount}</div>
                <div className="text-sm text-gray-600">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{userStats.followingCount}</div>
                <div className="text-sm text-gray-600">Following</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
          <TabsTrigger value="followers">Followers</TabsTrigger>
          <TabsTrigger value="requests">
            Requests{followRequests.length > 0 && ` (${followRequests.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by username or display name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="grid gap-4">
              {searchResults.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Link href={`/profile/${user.username}`} className="cursor-pointer hover:opacity-80 transition-opacity">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.avatar_url || ''} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                              {user.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link href={`/profile/${user.username}`} className="cursor-pointer hover:text-blue-600 transition-colors">
                              <h3 className="font-semibold">{user.display_name || user.username}</h3>
                            </Link>
                            {user.is_private && (
                              <Badge variant="outline" className="text-xs">Private</Badge>
                            )}
                          </div>
                          <Link href={`/profile/${user.username}`} className="cursor-pointer hover:text-blue-600 transition-colors">
                            <p className="text-sm text-gray-600">@{user.username}</p>
                          </Link>
                          {user.bio && (
                            <p className="text-sm text-gray-500 mt-1">{user.bio}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{user.streaks_count || 0} streaks</span>
                            <span>{user.followers_count || 0} followers</span>
                            <span>{user.following_count || 0} following</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/profile/${user.username}`}>
                          <Button variant="outline" size="sm">
                            View Profile
                          </Button>
                        </Link>
                        {user.follow_status === 'following' ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => unfollowUser(user.id)}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Following
                          </Button>
                        ) : user.follow_status === 'request_sent' ? (
                          <Button variant="outline" size="sm" disabled>
                            <Clock className="h-4 w-4 mr-1" />
                            Request Sent
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={() => followUser(user.id, user.is_private)}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            {user.is_private ? 'Send Request' : 'Follow'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {searchQuery && !loading && searchResults.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found matching "{searchQuery}"
            </div>
          )}
        </TabsContent>

        <TabsContent value="following" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search your following..."
              value={followingSearchQuery}
              onChange={(e) => setFollowingSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {getFilteredFollowing().length > 0 ? (
            <div className="grid gap-4">
              {getFilteredFollowing().map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Link href={`/profile/${user.username}`} className="cursor-pointer hover:opacity-80 transition-opacity">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.avatar_url || ''} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                              {user.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link href={`/profile/${user.username}`} className="cursor-pointer hover:text-blue-600 transition-colors">
                              <h3 className="font-semibold">{user.display_name || user.username}</h3>
                            </Link>
                            {user.is_private && (
                              <Badge variant="outline" className="text-xs">Private</Badge>
                            )}
                          </div>
                          <Link href={`/profile/${user.username}`} className="cursor-pointer hover:text-blue-600 transition-colors">
                            <p className="text-sm text-gray-600">@{user.username}</p>
                          </Link>
                          {user.bio && (
                            <p className="text-sm text-gray-500 mt-1">{user.bio}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{user.streaks_count || 0} streaks</span>
                            <span>{user.followers_count || 0} followers</span>
                            <span>{user.following_count || 0} following</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/profile/${user.username}`}>
                          <Button variant="outline" size="sm">
                            View Profile
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => unfollowUser(user.id)}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Following
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : following.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>You're not following anyone yet</p>
              <p className="text-sm">Search for users to follow!</p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No users found matching "{followingSearchQuery}"</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="followers" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search your followers..."
              value={followersSearchQuery}
              onChange={(e) => setFollowersSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {getFilteredFollowers().length > 0 ? (
            <div className="grid gap-4">
              {getFilteredFollowers().map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Link href={`/profile/${user.username}`} className="cursor-pointer hover:opacity-80 transition-opacity">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.avatar_url || ''} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                              {user.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link href={`/profile/${user.username}`} className="cursor-pointer hover:text-blue-600 transition-colors">
                              <h3 className="font-semibold">{user.display_name || user.username}</h3>
                            </Link>
                            {user.is_private && (
                              <Badge variant="outline" className="text-xs">Private</Badge>
                            )}
                          </div>
                          <Link href={`/profile/${user.username}`} className="cursor-pointer hover:text-blue-600 transition-colors">
                            <p className="text-sm text-gray-600">@{user.username}</p>
                          </Link>
                          {user.bio && (
                            <p className="text-sm text-gray-500 mt-1">{user.bio}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{user.streaks_count || 0} streaks</span>
                            <span>{user.followers_count || 0} followers</span>
                            <span>{user.following_count || 0} following</span>
                          </div>
                        </div>
                      </div>
                      <Link href={`/profile/${user.username}`}>
                        <Button variant="outline" size="sm">
                          View Profile
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : followers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No followers yet</p>
              <p className="text-sm">Create public streaks to get discovered!</p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No users found matching "{followersSearchQuery}"</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {followRequests.length > 0 ? (
            <div className="grid gap-4">
              {followRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Link href={`/profile/${request.requester.username}`} className="cursor-pointer hover:opacity-80 transition-opacity">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={request.requester.avatar_url || ''} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                              {request.requester.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <div>
                          <Link href={`/profile/${request.requester.username}`} className="cursor-pointer hover:text-blue-600 transition-colors">
                            <h3 className="font-semibold">{request.requester.display_name || request.requester.username}</h3>
                          </Link>
                          <Link href={`/profile/${request.requester.username}`} className="cursor-pointer hover:text-blue-600 transition-colors">
                            <p className="text-sm text-gray-600">@{request.requester.username}</p>
                          </Link>
                          <p className="text-xs text-gray-500 mt-1">
                            Requested {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => rejectFollowRequest(request.id)}
                        >
                          Reject
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => acceptFollowRequest(request.id)}
                        >
                          Accept
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No pending follow requests</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
