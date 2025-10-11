'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Flame, 
  Target, 
  Trophy, 
  Award, 
  Calendar, 
  Users, 
  Plus, 
  TrendingUp, 
  Zap,
  Star,
  Crown,
  Sparkles,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface UserStreak {
  id: string
  streak_id: string
  current_streak_days: number
  longest_streak_days: number
  last_checkin_date: string | null
  joined_at: string
  is_active: boolean
  streak: {
    id: string
    title: string
    description: string
    category: string
    is_public: boolean
    tags: string[]
    created_by: string
    profiles: {
      username: string
      display_name: string
      avatar_url: string
    }
  }
}

interface StreakStats {
  totalStreaks: number
  activeStreaks: number
  totalDays: number
  longestStreak: number
  currentLevel: number
  xp: number
  nextLevelXp: number
}

export default function MyStreaksPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userStreaks, setUserStreaks] = useState<UserStreak[]>([])
  const [stats, setStats] = useState<StreakStats>({
    totalStreaks: 0,
    activeStreaks: 0,
    totalDays: 0,
    longestStreak: 0,
    currentLevel: 1,
    xp: 0,
    nextLevelXp: 100
  })
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        await Promise.all([
          fetchUserStreaks(user.id),
          fetchStreakStats(user.id)
        ])
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      toast.error('Failed to load your streaks')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserStreaks = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_streaks')
        .select(`
          *,
          streak:streaks (
            id,
            title,
            description,
            category,
            is_public,
            tags,
            created_by,
            profiles:created_by (
              username,
              display_name,
              avatar_url
            )
          )
        `)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false })

      if (error) throw error
      setUserStreaks(data || [])
    } catch (error) {
      console.error('Error fetching user streaks:', error)
    }
  }

  const fetchStreakStats = async (userId: string) => {
    try {
      // Get user streaks for stats calculation
      const { data: userStreaks } = await supabase
        .from('user_streaks')
        .select('current_streak_days, longest_streak_days, is_active')
        .eq('user_id', userId)

      // Get total checkins for XP calculation
      const { data: checkins } = await supabase
        .from('checkins')
        .select('user_streak_id')
        .in('user_streak_id', userStreaks?.map(us => us.id) || [])

      const totalStreaks = userStreaks?.length || 0
      const activeStreaks = userStreaks?.filter(us => us.is_active).length || 0
      const totalDays = checkins?.length || 0
      const longestStreak = userStreaks && userStreaks.length > 0 
        ? Math.max(...userStreaks.map(us => us.longest_streak_days || 0)) 
        : 0
      
      // Calculate XP and level (1 XP per checkin, level up every 100 XP)
      const xp = totalDays
      const currentLevel = Math.floor(xp / 100) + 1
      const nextLevelXp = currentLevel * 100

      setStats({
        totalStreaks,
        activeStreaks,
        totalDays,
        longestStreak,
        currentLevel,
        xp: xp % 100, // XP within current level
        nextLevelXp
      })
    } catch (error) {
      console.error('Error fetching streak stats:', error)
    }
  }

  const getStreakStatus = (userStreak: UserStreak) => {
    const today = new Date().toISOString().split('T')[0]
    const lastCheckin = userStreak.last_checkin_date
    
    if (!lastCheckin) return { status: 'new', color: 'bg-blue-500', text: 'New Streak' }
    if (lastCheckin === today) return { status: 'active', color: 'bg-green-500', text: 'Active Today' }
    
    const lastCheckinDate = new Date(lastCheckin)
    const daysSinceLastCheckin = Math.floor((Date.now() - lastCheckinDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSinceLastCheckin === 1) return { status: 'warning', color: 'bg-yellow-500', text: 'Check In Today!' }
    if (daysSinceLastCheckin > 1) return { status: 'broken', color: 'bg-red-500', text: 'Streak Broken' }
    
    return { status: 'active', color: 'bg-green-500', text: 'Active' }
  }

  const getLevelIcon = (level: number) => {
    if (level >= 50) return <Crown className="h-5 w-5 text-yellow-500" />
    if (level >= 25) return <Star className="h-5 w-5 text-purple-500" />
    if (level >= 10) return <Trophy className="h-5 w-5 text-orange-500" />
    if (level >= 5) return <Award className="h-5 w-5 text-blue-500" />
    return <Target className="h-5 w-5 text-green-500" />
  }

  const getLevelTitle = (level: number) => {
    if (level >= 50) return 'Streak Legend'
    if (level >= 25) return 'Streak Master'
    if (level >= 10) return 'Streak Champion'
    if (level >= 5) return 'Streak Warrior'
    return 'Streak Beginner'
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header with Gamification */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Target className="h-8 w-8 text-green-600" />
                My Streaks
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="h-6 w-6 text-yellow-500" />
                </motion.div>
              </h1>
              <p className="text-gray-600">Track your progress and level up your habits!</p>
            </div>
            <Link href="/create">
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                <Plus className="h-4 w-4 mr-2" />
                New Streak
              </Button>
            </Link>
          </div>

          {/* Level & XP Progress */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getLevelIcon(stats.currentLevel)}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Level {stats.currentLevel} - {getLevelTitle(stats.currentLevel)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {stats.xp} / {stats.nextLevelXp} XP to next level
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">{stats.totalDays}</div>
                  <div className="text-sm text-gray-600">Total Check-ins</div>
                </div>
              </div>
              <Progress 
                value={stats.nextLevelXp > 0 ? (stats.xp / stats.nextLevelXp) * 100 : 0} 
                className="h-3 bg-purple-100"
              />
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Streaks</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.totalStreaks}</p>
                  </div>
                  <Target className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Active Streaks</p>
                    <p className="text-2xl font-bold text-green-900">{stats.activeStreaks}</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Longest Streak</p>
                    <p className="text-2xl font-bold text-orange-900">{stats.longestStreak} days</p>
                  </div>
                  <Flame className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Total XP</p>
                    <p className="text-2xl font-bold text-purple-900">{stats.totalDays}</p>
                  </div>
                  <Zap className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Streaks List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Your Streaks
          </h2>

          {userStreaks.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Target className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">No Streaks Yet</h3>
                <p className="text-gray-600 mb-6">Start your journey by creating your first streak!</p>
                <Link href="/create">
                  <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Streak
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userStreaks.map((userStreak, index) => {
                const status = getStreakStatus(userStreak)
                return (
                  <motion.div
                    key={userStreak.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="h-full"
                  >
                    <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-green-500 h-full flex flex-col">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-1">{userStreak.streak.title}</CardTitle>
                            <CardDescription className="text-sm">
                              {userStreak.streak.description}
                            </CardDescription>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${status.color}`} title={status.text} />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {userStreak.streak.category}
                          </Badge>
                          {userStreak.streak.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 flex-1 flex flex-col justify-end">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Current Streak</span>
                            <span className="font-semibold text-green-600">
                              {userStreak.current_streak_days} days
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Best Streak</span>
                            <span className="font-semibold text-orange-600">
                              {userStreak.longest_streak_days} days
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Joined</span>
                            <span className="text-gray-500">
                              {new Date(userStreak.joined_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <div className="pt-2">
                            <Link href={`/streaks/${userStreak.streak.id}`}>
                              <Button variant="outline" size="sm" className="w-full">
                                <TrendingUp className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
