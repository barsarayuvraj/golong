'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity, 
  Zap, 
  Award, 
  CheckCircle, 
  Heart, 
  MessageCircle,
  Flame,
  Trophy,
  Star,
  Clock,
  Users,
  RefreshCw
} from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { useRealtimeNotifications, RealtimeEvent } from '@/lib/use-realtime'
import { motion, AnimatePresence } from 'framer-motion'

interface ActivityItem {
  id: string
  type: 'achievement' | 'checkin' | 'comment' | 'like' | 'milestone'
  title: string
  description: string
  user?: {
    username: string
    display_name: string
    avatar_url?: string
  }
  streak?: {
    title: string
    category: string
  }
  timestamp: string
  data?: any
}

export function RealtimeActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  
  const supabase = createClient()
  
  // Use real-time notifications for live updates
  const { notifications: realtimeNotifications, isConnected: realtimeConnected } = useRealtimeNotifications()

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchRecentActivity()
      setIsConnected(realtimeConnected)
    }
  }, [user, realtimeConnected])

  // Convert real-time notifications to activity items
  useEffect(() => {
    const newActivities = realtimeNotifications.map(notification => ({
      id: notification.id,
      type: notification.type as ActivityItem['type'],
      title: notification.title,
      description: notification.message,
      timestamp: notification.timestamp,
      data: notification.data
    }))

    setActivities(prev => {
      const combined = [...newActivities, ...prev]
      // Remove duplicates and sort by timestamp
      const unique = combined.filter((item, index, self) => 
        index === self.findIndex(t => t.id === item.id)
      )
      return unique.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    })
  }, [realtimeNotifications])

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchRecentActivity = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Fetch recent achievements
      const { data: achievements, error: achievementsError } = await supabase
        .from('user_achievements')
        .select(`
          earned_at,
          achievement:achievements (
            name,
            description,
            points
          )
        `)
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false })
        .limit(5)

      if (achievementsError) throw achievementsError

      // Fetch recent check-ins
      const { data: checkins, error: checkinsError } = await supabase
        .from('checkins')
        .select(`
          checkin_date,
          created_at,
          user_streak:user_streaks!inner (
            streak:streaks (
              title,
              category
            )
          )
        `)
        .eq('user_streak.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (checkinsError) throw checkinsError

      // Convert to activity items
      const activityItems: ActivityItem[] = []

      achievements?.forEach(achievement => {
        activityItems.push({
          id: `achievement-${achievement.earned_at}`,
          type: 'achievement',
          title: 'Achievement Unlocked! 🏆',
          description: `Earned "${achievement.achievement?.name}" achievement`,
          timestamp: achievement.earned_at,
          data: achievement
        })
      })

      checkins?.forEach(checkin => {
        activityItems.push({
          id: `checkin-${checkin.created_at}`,
          type: 'checkin',
          title: 'Check-in Recorded! ✅',
          description: `Checked in to "${checkin.user_streak?.streak?.title}"`,
          streak: checkin.user_streak?.streak,
          timestamp: checkin.created_at,
          data: checkin
        })
      })

      // Sort by timestamp
      activityItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setActivities(activityItems)
    } catch (error) {
      console.error('Error fetching recent activity:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'achievement':
        return <Award className="h-4 w-4 text-yellow-500" />
      case 'checkin':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />
      case 'milestone':
        return <Trophy className="h-4 w-4 text-purple-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'achievement':
        return 'bg-yellow-50 border-yellow-200'
      case 'checkin':
        return 'bg-green-50 border-green-200'
      case 'comment':
        return 'bg-blue-50 border-blue-200'
      case 'like':
        return 'bg-red-50 border-red-200'
      case 'milestone':
        return 'bg-purple-50 border-purple-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Feed
          </CardTitle>
          <CardDescription>
            Sign in to see your activity feed
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle>Live Activity Feed</CardTitle>
            {isConnected && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Zap className="h-3 w-3 mr-1" />
                Live
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchRecentActivity}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>
          Real-time updates of your streak activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading activities...</span>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500">No recent activity</p>
              <p className="text-sm text-gray-400">Start checking in to see your activity here!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {activities.map((activity) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={`p-3 rounded-lg border ${getActivityColor(activity.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">
                            {activity.title}
                          </h4>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(activity.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {activity.description}
                        </p>
                        {activity.streak && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              {activity.streak.category}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
