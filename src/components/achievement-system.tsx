'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Award, 
  Trophy, 
  Star, 
  Flame, 
  Target, 
  Zap, 
  Crown, 
  Gem,
  Medal,
  Shield,
  Rocket,
  Heart,
  CheckCircle,
  Lock,
  Gift,
  Sparkles
} from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { useRealtimeNotifications } from '@/lib/use-realtime'
import { motion } from 'framer-motion'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  criteria: any
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  points: number
  created_at: string
}

interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  earned_at: string
  achievement?: Achievement
}

interface AchievementProgress {
  achievement: Achievement
  progress: number
  maxProgress: number
  isEarned: boolean
  earnedAt?: string
}

export function AchievementSystem() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([])
  const [achievementProgress, setAchievementProgress] = useState<AchievementProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userStats, setUserStats] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchAchievements()
      fetchUserAchievements()
      fetchUserStats()
    }
  }, [user])

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchAchievements = async () => {
    try {
      const response = await fetch('/api/achievements')
      const result = await response.json()

      if (response.ok) {
        setAchievements(result.achievements.map((a: any) => a.achievement))
        setUserAchievements(result.earnedAchievements)
        setAchievementProgress(result.achievements)
      } else {
        console.error('Error fetching achievements:', result.error)
      }
    } catch (error) {
      console.error('Error fetching achievements:', error)
    }
  }

  const checkForNewAchievements = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/achievements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id
        })
      })

      const result = await response.json()

      if (response.ok && result.newAchievements.length > 0) {
        // Refresh achievements to show new ones
        await fetchAchievements()
        
        // Show notification for new achievements
        console.log(`Earned ${result.newAchievements.length} new achievements!`)
      }
    } catch (error) {
      console.error('Error checking achievements:', error)
    }
  }

  const fetchUserStats = async () => {
    if (!user) return

    try {
      // Get user's streak statistics
      const { data: userStreaks, error: streaksError } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)

      if (streaksError) throw streaksError

      const { data: checkins, error: checkinsError } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', user.id)

      if (checkinsError) throw checkinsError

      const stats = {
        totalStreaks: userStreaks?.length || 0,
        activeStreaks: userStreaks?.filter(s => s.current_streak_count > 0).length || 0,
        longestStreak: Math.max(...(userStreaks?.map(s => s.longest_streak_count) || [0])),
        totalCheckins: checkins?.length || 0,
        totalDays: new Set(checkins?.map(c => c.created_at.split('T')[0])).size || 0
      }

      setUserStats(stats)
      calculateAchievementProgress(stats)
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  const calculateAchievementProgress = (stats: any) => {
    const progress: AchievementProgress[] = achievements.map(achievement => {
      const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id)
      
      if (userAchievement) {
        return {
          achievement,
          progress: achievement.criteria.target,
          maxProgress: achievement.criteria.target,
          isEarned: true,
          earnedAt: userAchievement.earned_at
        }
      }

      let progressValue = 0
      let maxValue = achievement.criteria.target

      switch (achievement.criteria.type) {
        case 'total_streaks':
          progressValue = stats.totalStreaks
          break
        case 'active_streaks':
          progressValue = stats.activeStreaks
          break
        case 'longest_streak':
          progressValue = stats.longestStreak
          break
        case 'total_checkins':
          progressValue = stats.totalCheckins
          break
        case 'total_days':
          progressValue = stats.totalDays
          break
        case 'perfect_week':
          // This would need more complex calculation
          progressValue = 0
          break
        default:
          progressValue = 0
      }

      return {
        achievement,
        progress: Math.min(progressValue, maxValue),
        maxProgress: maxValue,
        isEarned: progressValue >= maxValue,
        earnedAt: undefined
      }
    })

    setAchievementProgress(progress)
  }

  const getAchievementIcon = (iconName: string) => {
    const icons: { [key: string]: any } = {
      'award': Award,
      'trophy': Trophy,
      'star': Star,
      'flame': Flame,
      'target': Target,
      'zap': Zap,
      'crown': Crown,
      'gem': Gem,
      'medal': Medal,
      'shield': Shield,
      'rocket': Rocket,
      'heart': Heart,
      'sparkles': Sparkles
    }
    return icons[iconName] || Award
  }

  const getRarityColor = (rarity: string) => {
    const colors: { [key: string]: string } = {
      'common': 'bg-gray-100 text-gray-800',
      'rare': 'bg-blue-100 text-blue-800',
      'epic': 'bg-purple-100 text-purple-800',
      'legendary': 'bg-yellow-100 text-yellow-800'
    }
    return colors[rarity] || colors['common']
  }

  const getRarityGradient = (rarity: string) => {
    const gradients: { [key: string]: string } = {
      'common': 'from-gray-400 to-gray-600',
      'rare': 'from-blue-400 to-blue-600',
      'epic': 'from-purple-400 to-purple-600',
      'legendary': 'from-yellow-400 to-orange-500'
    }
    return gradients[rarity] || gradients['common']
  }

  const earnedAchievements = achievementProgress.filter(a => a.isEarned)
  const unearnedAchievements = achievementProgress.filter(a => !a.isEarned)
  const totalPoints = earnedAchievements.reduce((sum, a) => sum + a.achievement.points, 0)

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
          <h2 className="text-3xl font-bold">Achievements</h2>
          <p className="text-gray-600">Unlock badges and earn rewards for your streak journey</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-yellow-600">{totalPoints}</div>
          <div className="text-sm text-gray-600">Total Points</div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Earned</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{earnedAchievements.length}</div>
              <p className="text-xs text-muted-foreground">achievements</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((earnedAchievements.length / achievements.length) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">completion</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rarity</CardTitle>
              <Gem className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {earnedAchievements.filter(a => a.achievement.rarity === 'legendary').length}
              </div>
              <p className="text-xs text-muted-foreground">legendary</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rank</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalPoints >= 1000 ? 'Master' : totalPoints >= 500 ? 'Expert' : totalPoints >= 100 ? 'Advanced' : 'Beginner'}
              </div>
              <p className="text-xs text-muted-foreground">level</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Achievements Tabs */}
      <Tabs defaultValue="earned" className="space-y-4">
        <TabsList>
          <TabsTrigger value="earned">Earned ({earnedAchievements.length})</TabsTrigger>
          <TabsTrigger value="progress">In Progress ({unearnedAchievements.length})</TabsTrigger>
          <TabsTrigger value="all">All Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="earned" className="space-y-4">
          {earnedAchievements.length === 0 ? (
            <div className="text-center py-12">
              <Award className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No Achievements Yet</h3>
              <p className="text-gray-600">Start building streaks to earn your first achievement!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {earnedAchievements.map((achievement, index) => {
                const Icon = getAchievementIcon(achievement.achievement.icon)
                return (
                  <motion.div
                    key={achievement.achievement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="relative overflow-hidden">
                      <div className={`absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-green-500`} />
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 bg-gradient-to-r ${getRarityGradient(achievement.achievement.rarity)} rounded-full flex items-center justify-center`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">{achievement.achievement.name}</CardTitle>
                            <Badge className={getRarityColor(achievement.achievement.rarity)}>
                              {achievement.achievement.rarity}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-3">
                          {achievement.achievement.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            Earned {new Date(achievement.earnedAt!).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Star className="h-4 w-4" />
                            <span className="font-medium">{achievement.achievement.points}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unearnedAchievements.map((achievement, index) => {
              const Icon = getAchievementIcon(achievement.achievement.icon)
              const progressPercentage = (achievement.progress / achievement.maxProgress) * 100
              
              return (
                <motion.div
                  key={achievement.achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="relative opacity-75">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 bg-gradient-to-r ${getRarityGradient(achievement.achievement.rarity)} rounded-full flex items-center justify-center`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{achievement.achievement.name}</CardTitle>
                          <Badge className={getRarityColor(achievement.achievement.rarity)}>
                            {achievement.achievement.rarity}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">
                        {achievement.achievement.description}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span>{achievement.progress}/{achievement.maxProgress}</span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            {Math.round(progressPercentage)}% complete
                          </div>
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Star className="h-4 w-4" />
                            <span className="font-medium">{achievement.achievement.points}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievementProgress.map((achievement, index) => {
              const Icon = getAchievementIcon(achievement.achievement.icon)
              const progressPercentage = (achievement.progress / achievement.maxProgress) * 100
              
              return (
                <motion.div
                  key={achievement.achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`relative ${achievement.isEarned ? '' : 'opacity-75'}`}>
                    {achievement.isEarned && (
                      <div className={`absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-green-500`} />
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 bg-gradient-to-r ${getRarityGradient(achievement.achievement.rarity)} rounded-full flex items-center justify-center`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{achievement.achievement.name}</CardTitle>
                          <Badge className={getRarityColor(achievement.achievement.rarity)}>
                            {achievement.achievement.rarity}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">
                        {achievement.achievement.description}
                      </p>
                      {achievement.isEarned ? (
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            Earned {new Date(achievement.earnedAt!).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Star className="h-4 w-4" />
                            <span className="font-medium">{achievement.achievement.points}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span>{achievement.progress}/{achievement.maxProgress}</span>
                          </div>
                          <Progress value={progressPercentage} className="h-2" />
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                              {Math.round(progressPercentage)}% complete
                            </div>
                            <div className="flex items-center gap-1 text-yellow-600">
                              <Star className="h-4 w-4" />
                              <span className="font-medium">{achievement.achievement.points}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
