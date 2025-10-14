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

  const supabase = createClient()

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

      // Update search results
      setSearchResults(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, follow_status: isPrivate ? 'request_sent' : 'following' }
          : u
      ))
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
      
      // Refresh follow requests
      loadFollowRequests()
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
      
      // Refresh follow requests
      loadFollowRequests()
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

      const followingUsers = data.map(f => ({
        ...f.profiles,
        follow_status: 'following' as const
      }))

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

      const followerUsers = data.map(f => ({
        ...f.profiles,
        follow_status: 'not_following' as const
      }))

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

      const { data, error } = await supabase
        .from('follow_requests')
        .select(`
          id,
          requester_id,
          target_id,
          status,
          created_at,
          profiles!requester_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('target_id', user.id)
        .eq('status', 'pending')

      if (error) throw error

      setFollowRequests(data)
    } catch (error) {
      console.error('Error loading follow requests:', error)
    }
  }

  useEffect(() => {
    if (activeTab === 'following') loadFollowing()
    if (activeTab === 'followers') loadFollowers()
    if (activeTab === 'requests') loadFollowRequests()
  }, [activeTab])

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
          <TabsTrigger value="followers">Followers</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
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
          {following.length > 0 ? (
            <div className="grid gap-4">
              {following.map((user) => (
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
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>You're not following anyone yet</p>
              <p className="text-sm">Search for users to follow!</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="followers" className="space-y-4">
          {followers.length > 0 ? (
            <div className="grid gap-4">
              {followers.map((user) => (
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
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No followers yet</p>
              <p className="text-sm">Create public streaks to get discovered!</p>
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
