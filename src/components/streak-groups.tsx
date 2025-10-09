'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  Plus, 
  Search, 
  Crown, 
  Shield, 
  UserPlus, 
  Settings,
  Trophy,
  Flame,
  Target,
  Calendar,
  MessageCircle,
  BarChart3
} from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { motion } from 'framer-motion'

interface Group {
  id: string
  name: string
  description: string
  category: string
  is_public: boolean
  max_members?: number
  created_by: string
  created_at: string
  updated_at: string
  // Joined fields
  creator?: {
    id: string
    username: string
    avatar_url?: string
  }
  member_count?: number
  user_is_member?: boolean
  user_role?: 'admin' | 'member'
}

interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
  user?: {
    id: string
    username: string
    avatar_url?: string
    display_name?: string
  }
}

interface CreateGroupData {
  name: string
  description: string
  category: string
  is_public: boolean
  max_members?: number
}

export function StreakGroups() {
  const [groups, setGroups] = useState<Group[]>([])
  const [userGroups, setUserGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])
  const [createData, setCreateData] = useState<CreateGroupData>({
    name: '',
    description: '',
    category: '',
    is_public: true,
    max_members: undefined
  })

  const supabase = createClient()

  const GROUP_CATEGORIES = [
    'Health & Fitness',
    'Learning & Education',
    'Productivity',
    'Lifestyle',
    'Creative',
    'Social',
    'Other'
  ]

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchGroups()
      fetchUserGroups()
    }
  }, [user])

  const fetchUser = async () => {
    try {
      console.log('Fetching user from Supabase auth')
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('Error fetching user:', error)
        setUser(null)
        return
      }
      
      console.log('User fetched successfully:', user?.id)
      setUser(user)
    } catch (error) {
      console.error('Error in fetchUser:', error)
      setUser(null)
    }
  }

  const fetchGroups = async () => {
    try {
      setLoading(true)
      console.log('Fetching public groups')
      
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          creator:profiles!created_by (
            id,
            username,
            avatar_url
          )
        `)
        .eq('is_private', false)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error fetching groups:', error)
        throw error
      }

      console.log('Successfully fetched groups:', data)

      // Get member counts and user membership status
      const groupsWithMembers = await Promise.all(
        (data || []).map(async (group) => {
          const { count: memberCount } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)

          let userIsMember = false
          let userRole = 'member' as 'admin' | 'member'
          if (user) {
            const { data: membership } = await supabase
              .from('group_members')
              .select('role')
              .eq('group_id', group.id)
              .eq('user_id', user.id)
              .single()

            userIsMember = !!membership
            userRole = membership?.role || 'member'
          }

          return {
            ...group,
            is_public: !group.is_private, // Convert is_private to is_public for UI
            member_count: memberCount || 0,
            user_is_member: userIsMember,
            user_role: userRole
          }
        })
      )

      console.log('Successfully processed groups with members:', groupsWithMembers)
      setGroups(groupsWithMembers)
    } catch (error) {
      console.error('Error fetching groups:', error)
      console.error('Error details:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      })
      // Set empty array to prevent further errors
      setGroups([])
    } finally {
      setLoading(false)
    }
  }

  const fetchUserGroups = async () => {
    if (!user) {
      console.log('No user found, skipping fetchUserGroups')
      return
    }

    try {
      console.log('Fetching user groups for user:', user.id)
      
      // First, try to fetch just the group_members data
      const { data: memberships, error: membershipsError } = await supabase
        .from('group_members')
        .select('*')
        .eq('user_id', user.id)

      if (membershipsError) {
        console.error('Supabase error fetching user group memberships:', membershipsError)
        throw membershipsError
      }

      console.log('Successfully fetched user group memberships:', memberships)

      if (!memberships || memberships.length === 0) {
        console.log('No group memberships found for user')
        setUserGroups([])
        return
      }

      // Then fetch the group details for each membership
      const groupIds = memberships.map(m => m.group_id)
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select(`
          *,
          creator:profiles!created_by (
            id,
            username,
            avatar_url
          )
        `)
        .in('id', groupIds)

      if (groupsError) {
        console.error('Supabase error fetching group details:', groupsError)
        throw groupsError
      }

      console.log('Successfully fetched group details:', groups)

      // Combine the data
      const userGroupsData = memberships.map(membership => {
        const group = groups?.find(g => g.id === membership.group_id)
        return group ? {
          ...group,
          is_public: !group.is_private, // Convert is_private to is_public for UI
          user_role: membership.role
        } : null
      }).filter(Boolean) // Remove any null entries

      console.log('Successfully processed user groups:', userGroupsData)
      setUserGroups(userGroupsData)
    } catch (error) {
      console.error('Error fetching user groups:', error)
      console.error('Error details:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      })
      // Set empty array to prevent further errors
      setUserGroups([])
    }
  }

  const fetchGroupMembers = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          user:profiles!user_id (
            id,
            username,
            avatar_url,
            display_name
          )
        `)
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true })

      if (error) throw error
      setGroupMembers(data || [])
    } catch (error) {
      console.error('Error fetching group members:', error)
    }
  }

  const handleCreateGroup = async () => {
    if (!user) {
      console.log('No user found, cannot create group')
      return
    }

    // Validate required fields
    if (!createData.name?.trim()) {
      console.error('Group name is required')
      return
    }
    if (!createData.description?.trim()) {
      console.error('Group description is required')
      return
    }
    if (!createData.category?.trim()) {
      console.error('Group category is required')
      return
    }

    try {
      console.log('Creating group with data:', createData)
      console.log('User ID:', user.id)
      
      const { data, error } = await supabase
        .from('groups')
        .insert({
          name: createData.name,
          description: createData.description,
          category: createData.category,
          is_private: !createData.is_public, // Convert is_public to is_private
          max_members: createData.max_members,
          created_by: user.id
        })
        .select()

      if (error) {
        console.error('Supabase error creating group:', error)
        throw error
      }

      console.log('Successfully created group:', data)

      // Add the creator as an admin member of the group
      if (data && data[0]) {
        const { error: memberError } = await supabase
          .from('group_members')
          .insert({
            group_id: data[0].id,
            user_id: user.id,
            role: 'admin'
          })

        if (memberError) {
          console.error('Error adding creator as group member:', memberError)
        } else {
          console.log('Successfully added creator as group admin')
        }
      }

      setShowCreateDialog(false)
      setCreateData({
        name: '',
        description: '',
        category: '',
        is_public: true,
        max_members: undefined
      })
      fetchGroups()
      fetchUserGroups()
    } catch (error) {
      console.error('Error creating group:', error)
      console.error('Error details:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      })
    }
  }

  const handleJoinGroup = async (groupId: string) => {
    if (!user) {
      console.log('No user found, cannot join group')
      return
    }

    try {
      console.log('Joining group:', groupId, 'for user:', user.id)
      
      const { data, error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member'
        })
        .select()

      if (error) {
        console.error('Supabase error joining group:', error)
        throw error
      }

      console.log('Successfully joined group:', data)

      fetchGroups()
      fetchUserGroups()
    } catch (error) {
      console.error('Error joining group:', error)
      console.error('Error details:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      })
    }
  }

  const handleLeaveGroup = async (groupId: string) => {
    if (!user) {
      console.log('No user found, cannot leave group')
      return
    }

    try {
      console.log('Leaving group:', groupId, 'for user:', user.id)
      
      const { data, error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .select()

      if (error) {
        console.error('Supabase error leaving group:', error)
        throw error
      }

      console.log('Successfully left group:', data)

      fetchGroups()
      fetchUserGroups()
    } catch (error) {
      console.error('Error leaving group:', error)
      console.error('Error details:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      })
    }
  }

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Health & Fitness': 'bg-green-100 text-green-800',
      'Learning & Education': 'bg-blue-100 text-blue-800',
      'Productivity': 'bg-orange-100 text-orange-800',
      'Lifestyle': 'bg-pink-100 text-pink-800',
      'Creative': 'bg-purple-100 text-purple-800',
      'Social': 'bg-yellow-100 text-yellow-800',
      'Other': 'bg-gray-100 text-gray-800'
    }
    return colors[category] || colors['Other']
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Streak Groups</h2>
          <p className="text-gray-600">Join communities and build streaks together</p>
        </div>
        {user && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogDescription>
                  Create a group for people to join and build streaks together.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Group Name</Label>
                  <Input
                    id="name"
                    value={createData.name}
                    onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                    placeholder="e.g., Morning Runners Club"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={createData.description}
                    onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                    placeholder="Describe your group and its goals..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={createData.category} onValueChange={(value) => setCreateData({ ...createData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {GROUP_CATEGORIES.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="max_members">Max Members (Optional)</Label>
                    <Input
                      id="max_members"
                      type="number"
                      value={createData.max_members || ''}
                      onChange={(e) => setCreateData({ ...createData, max_members: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="No limit"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateGroup}>
                  Create Group
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* User's Groups */}
      {userGroups.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Your Groups</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userGroups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedGroup(group)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {group.description}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <Badge className={getCategoryColor(group.category)}>
                          {group.category}
                        </Badge>
                        {group.user_role === 'admin' && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{group.member_count || 0} members</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* All Groups */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Discover Groups</h3>
        {filteredGroups.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No Groups Found</h3>
            <p className="text-gray-600 mb-4">Be the first to create a group!</p>
            {user && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {group.description}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <Badge className={getCategoryColor(group.category)}>
                          {group.category}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{group.member_count} members</span>
                        {group.max_members && (
                          <span className="text-gray-400">/ {group.max_members}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Created {new Date(group.created_at).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={group.creator?.avatar_url} />
                            <AvatarFallback>
                              {group.creator?.username?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-600">
                            {group.creator?.username}
                          </span>
                        </div>
                        
                        {user && (
                          <div className="flex gap-2">
                            {group.user_is_member ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleLeaveGroup(group.id)}
                              >
                                Leave
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleJoinGroup(group.id)}
                                disabled={group.max_members && group.member_count >= group.max_members}
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
                                Join
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Group Details Modal */}
      {selectedGroup && (
        <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedGroup.name}</DialogTitle>
              <DialogDescription>{selectedGroup.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge className={getCategoryColor(selectedGroup.category)}>
                  {selectedGroup.category}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>{selectedGroup.member_count} members</span>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Members</h4>
                <div className="space-y-2">
                  {groupMembers.map(member => (
                    <div key={member.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.user?.avatar_url} />
                        <AvatarFallback>
                          {member.user?.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{member.user?.display_name || member.user?.username}</div>
                        <div className="text-sm text-gray-600">
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </div>
                      </div>
                      {member.role === 'admin' && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
