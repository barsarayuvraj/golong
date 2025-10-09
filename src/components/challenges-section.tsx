'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Trophy, 
  Calendar, 
  Users, 
  Plus, 
  Clock, 
  Target,
  Award,
  Flame,
  Star
} from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface Challenge {
  id: string
  name: string
  description: string
  category: string
  duration_days: number
  start_date: string
  end_date: string
  max_participants?: number
  prize_description?: string
  rules?: string
  created_by: string
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined fields
  creator?: {
    id: string
    username: string
    avatar_url?: string
  }
  participant_count?: number
  user_participated?: boolean
}

interface CreateChallengeData {
  name: string
  description: string
  category: string
  duration_days: number
  start_date: string
  end_date: string
  max_participants?: number
  prize_description?: string
  rules?: string
}

export function ChallengesSection() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createData, setCreateData] = useState<CreateChallengeData>({
    name: '',
    description: '',
    category: '',
    duration_days: 30,
    start_date: '',
    end_date: '',
    max_participants: undefined,
    prize_description: '',
    rules: ''
  })

  const supabase = createClient()

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchChallenges()
    }
  }, [user])

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchChallenges = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('challenges')
        .select(`
          *,
          creator:profiles!created_by (
            id,
            username,
            avatar_url
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get participant counts and user participation status
      const challengesWithParticipants = await Promise.all(
        (data || []).map(async (challenge) => {
          const { count: participantCount } = await supabase
            .from('challenge_participants')
            .select('*', { count: 'exact', head: true })
            .eq('challenge_id', challenge.id)

          let userParticipated = false
          if (user) {
            const { data: participation } = await supabase
              .from('challenge_participants')
              .select('id')
              .eq('challenge_id', challenge.id)
              .eq('user_id', user.id)
              .single()
            userParticipated = !!participation
          }

          return {
            ...challenge,
            participant_count: participantCount || 0,
            user_participated: userParticipated
          }
        })
      )

      setChallenges(challengesWithParticipants)
    } catch (error) {
      console.error('Error fetching challenges:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateChallenge = async () => {
    if (!user) return

    // Validate required fields
    if (!createData.name.trim()) {
      toast.error('Challenge name is required')
      return
    }
    if (!createData.description.trim()) {
      toast.error('Challenge description is required')
      return
    }
    if (!createData.category.trim()) {
      toast.error('Challenge category is required')
      return
    }

    try {
      const { error } = await supabase
        .from('challenges')
        .insert({
          ...createData,
          created_by: user.id,
          start_date: createData.start_date ? new Date(createData.start_date).toISOString() : new Date().toISOString(),
          end_date: createData.end_date ? new Date(createData.end_date).toISOString() : new Date(Date.now() + createData.duration_days * 24 * 60 * 60 * 1000).toISOString()
        })

      if (error) throw error

      toast.success('Challenge created successfully!')
      setShowCreateDialog(false)
      setCreateData({
        name: '',
        description: '',
        category: '',
        duration_days: 30,
        start_date: '',
        end_date: '',
        max_participants: undefined,
        prize_description: '',
        rules: ''
      })
      fetchChallenges()
    } catch (error) {
      console.error('Error creating challenge:', error)
      toast.error('Failed to create challenge')
    }
  }

  // Helper function to calculate end date from start date and duration
  const calculateEndDate = (startDate: string, durationDays: number): string => {
    if (!startDate) return ''
    const start = new Date(startDate)
    const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000)
    return end.toISOString().split('T')[0]
  }

  // Helper function to calculate duration from start and end dates
  const calculateDuration = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 30
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Handle duration change - update end date
  const handleDurationChange = (duration: number) => {
    const startDate = createData.start_date || new Date().toISOString().split('T')[0]
    const endDate = calculateEndDate(startDate, duration)
    
    setCreateData(prev => ({
      ...prev,
      duration_days: duration,
      end_date: endDate
    }))
  }

  // Handle start date change - update end date if duration is set
  const handleStartDateChange = (startDate: string) => {
    const endDate = createData.duration_days ? calculateEndDate(startDate, createData.duration_days) : ''
    
    setCreateData(prev => ({
      ...prev,
      start_date: startDate,
      end_date: endDate
    }))
  }

  // Handle end date change - update duration
  const handleEndDateChange = (endDate: string) => {
    const startDate = createData.start_date || new Date().toISOString().split('T')[0]
    const duration = calculateDuration(startDate, endDate)
    
    setCreateData(prev => ({
      ...prev,
      end_date: endDate,
      duration_days: duration
    }))
  }

  // Handle opening create dialog with default values
  const handleOpenCreateDialog = () => {
    const today = new Date().toISOString().split('T')[0]
    const defaultEndDate = calculateEndDate(today, 30)
    
    setCreateData({
      name: '',
      description: '',
      category: '',
      duration_days: 30,
      start_date: today,
      end_date: defaultEndDate,
      max_participants: undefined,
      prize_description: '',
      rules: ''
    })
    setShowCreateDialog(true)
  }

  const handleJoinChallenge = async (challengeId: string) => {
    if (!user) return

    try {
      // First, get user's active streaks
      const { data: userStreaks, error: streaksError } = await supabase
        .from('user_streaks')
        .select(`
          id,
          streak:streaks (
            id,
            name,
            category
          )
        `)
        .eq('user_id', user.id)
        .gt('current_streak_count', 0)

      if (streaksError) throw streaksError

      if (!userStreaks || userStreaks.length === 0) {
        alert('You need at least one active streak to join a challenge!')
        return
      }

      // For now, use the first active streak
      const streakId = userStreaks[0].id

      const { error } = await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
          streak_id: streakId
        })

      if (error) throw error

      fetchChallenges()
    } catch (error) {
      console.error('Error joining challenge:', error)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Fitness': 'bg-green-100 text-green-800',
      'Health': 'bg-blue-100 text-blue-800',
      'Learning': 'bg-purple-100 text-purple-800',
      'Productivity': 'bg-orange-100 text-orange-800',
      'Lifestyle': 'bg-pink-100 text-pink-800',
      'Other': 'bg-gray-100 text-gray-800'
    }
    return colors[category] || colors['Other']
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const isChallengeActive = (startDate: string, endDate: string) => {
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)
    return now >= start && now <= end
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
          <h2 className="text-3xl font-bold">Streak Challenges</h2>
          <p className="text-gray-600">Join competitions and compete with others</p>
        </div>
        {user && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={handleOpenCreateDialog}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Challenge
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Challenge</DialogTitle>
                <DialogDescription>
                  Create a streak challenge for others to join and compete in.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Challenge Name</Label>
                    <Input
                      id="name"
                      value={createData.name}
                      onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                      placeholder="e.g., 30-Day Fitness Challenge"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={createData.category} onValueChange={(value) => setCreateData({ ...createData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fitness">Fitness</SelectItem>
                        <SelectItem value="Health">Health</SelectItem>
                        <SelectItem value="Learning">Learning</SelectItem>
                        <SelectItem value="Productivity">Productivity</SelectItem>
                        <SelectItem value="Lifestyle">Lifestyle</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={createData.description}
                    onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                    placeholder="Describe the challenge and its goals..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="duration">Duration (days)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={createData.duration_days}
                      onChange={(e) => handleDurationChange(parseInt(e.target.value) || 30)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={createData.start_date}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={createData.end_date}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="prize">Prize Description (Optional)</Label>
                  <Input
                    id="prize"
                    value={createData.prize_description || ''}
                    onChange={(e) => setCreateData({ ...createData, prize_description: e.target.value })}
                    placeholder="e.g., $100 gift card, Trophy, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="rules">Rules (Optional)</Label>
                  <Textarea
                    id="rules"
                    value={createData.rules || ''}
                    onChange={(e) => setCreateData({ ...createData, rules: e.target.value })}
                    placeholder="Any specific rules or requirements..."
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateChallenge}>
                  Create Challenge
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Challenges Grid */}
      {challenges.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No Active Challenges</h3>
          <p className="text-gray-600 mb-4">Be the first to create a challenge!</p>
          {user && (
            <Button onClick={handleOpenCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Challenge
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge, index) => (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{challenge.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {challenge.description}
                      </CardDescription>
                    </div>
                    <Badge className={getCategoryColor(challenge.category)}>
                      {challenge.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{challenge.duration_days} days</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{challenge.participant_count} participants</span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(challenge.start_date)} - {formatDate(challenge.end_date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      <span>Created by {challenge.creator?.username}</span>
                    </div>
                  </div>

                  {challenge.prize_description && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium text-yellow-800">Prize:</span>
                        <span className="text-yellow-700">{challenge.prize_description}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      {isChallengeActive(challenge.start_date, challenge.end_date) ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <Flame className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Upcoming</Badge>
                      )}
                    </div>
                    
                    {user && !challenge.user_participated && (
                      <Button 
                        size="sm" 
                        onClick={() => handleJoinChallenge(challenge.id)}
                        disabled={!isChallengeActive(challenge.start_date, challenge.end_date)}
                      >
                        Join Challenge
                      </Button>
                    )}
                    
                    {challenge.user_participated && (
                      <Badge variant="outline" className="text-blue-600 border-blue-200">
                        <Star className="h-3 w-3 mr-1" />
                        Participating
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
