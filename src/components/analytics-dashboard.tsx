'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  Award, 
  Flame, 
  Clock,
  Users,
  BarChart3,
  Activity
} from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { useAnalyticsRealtime } from '@/lib/use-realtime'
import { motion } from 'framer-motion'
import { useAnalytics } from '@/hooks/useApi'
import { toast } from 'sonner'

interface StreakAnalytics {
  totalStreaks: number
  activeStreaks: number
  longestStreak: number
  totalDays: number
  successRate: number
  averageStreakLength: number
  monthlyData: Array<{
    month: string
    streaks: number
    days: number
  }>
  categoryData: Array<{
    category: string
    count: number
    color: string
  }>
  weeklyData: Array<{
    day: string
    checkins: number
  }>
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff']

export function AnalyticsDashboard() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')

  const supabase = createClient()
  
  // Use our custom analytics hook
  const { data: analyticsData, loading, error, refetch } = useAnalytics({
    metric: 'overview',
    period: timeRange
  })
  
  const analytics = analyticsData?.analytics || null

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const handleTimeRangeChange = (newRange: 'week' | 'month' | 'year') => {
    setTimeRange(newRange)
    // The hook will automatically refetch when timeRange changes
  }

  const calculateAnalytics = (streaks: any[], checkins: any[], range: 'week' | 'month' | 'year') => {
    const totalStreaks = streaks.length
    const activeStreaks = streaks.filter(s => s.current_streak_count > 0).length
    const longestStreak = Math.max(...streaks.map(s => s.longest_streak_count), 0)
    const totalDays = checkins.length
    const successRate = totalStreaks > 0 ? (activeStreaks / totalStreaks) * 100 : 0
    const averageStreakLength = totalStreaks > 0 
      ? streaks.reduce((sum, s) => sum + s.longest_streak_count, 0) / totalStreaks 
      : 0

    // Generate monthly data
    const monthlyData = generateMonthlyData(checkins, range)
    
    // Generate category data
    const categoryData = generateCategoryData(streaks)
    
    // Generate weekly data
    const weeklyData = generateWeeklyData(checkins)

    return {
      totalStreaks,
      activeStreaks,
      longestStreak,
      totalDays,
      successRate,
      averageStreakLength,
      monthlyData,
      categoryData,
      weeklyData
    }
  }

  const generateMonthlyData = (checkins: any[], range: 'week' | 'month' | 'year') => {
    const data: Array<{ month: string; streaks: number; days: number }> = []
    const now = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = date.toLocaleDateString('en-US', { month: 'short' })
      
      const monthCheckins = checkins.filter(c => {
        const checkinDate = new Date(c.created_at)
        return checkinDate.getMonth() === date.getMonth() && 
               checkinDate.getFullYear() === date.getFullYear()
      })
      
      data.push({
        month: monthStr,
        streaks: Math.floor(Math.random() * 10) + 1, // Mock data for now
        days: monthCheckins.length
      })
    }
    
    return data
  }

  const generateCategoryData = (streaks: any[]) => {
    const categories: { [key: string]: number } = {}
    
    streaks.forEach(streak => {
      const category = streak.streak?.category || 'Other'
      categories[category] = (categories[category] || 0) + 1
    })
    
    return Object.entries(categories).map(([category, count], index) => ({
      category,
      count,
      color: COLORS[index % COLORS.length]
    }))
  }

  const generateWeeklyData = (checkins: any[]) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return days.map(day => ({
      day,
      checkins: Math.floor(Math.random() * 20) + 1 // Mock data for now
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500">No analytics data available yet</p>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
            <p className="text-gray-600">Loading your analytics...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
            <p className="text-red-600">Error loading analytics: {error}</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Unable to load analytics data. Please try again later.</p>
            <Button onClick={() => refetch()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
          <p className="text-gray-600">Track your streak performance and insights</p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', 'year'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTimeRangeChange(range)}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Streaks</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.streaks?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {analytics?.streaks?.active || 0} active
              </p>
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
              <CardTitle className="text-sm font-medium">Longest Streak</CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.streaks?.longest || 0}</div>
              <p className="text-xs text-muted-foreground">days</p>
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
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.consistency?.average_current_streak ? 
                  analytics.consistency.average_current_streak.toFixed(1) : '0.0'} days
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics?.consistency?.current_total_days || 0} total days
              </p>
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
              <CardTitle className="text-sm font-medium">Avg Length</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.consistency?.average_current_streak ? 
                  analytics.consistency.average_current_streak.toFixed(1) : '0.0'}
              </div>
              <p className="text-xs text-muted-foreground">days per streak</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Progress</CardTitle>
                <CardDescription>Streak activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics?.checkins?.daily_data || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Activity</CardTitle>
                <CardDescription>Check-ins by day of week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics?.checkins?.daily_data || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Streak Trends</CardTitle>
              <CardDescription>Your streak performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analytics?.checkins?.daily_data || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Streak Categories</CardTitle>
              <CardDescription>Distribution of your streaks by category</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.streaks?.current_streaks?.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={analytics.streaks.current_streaks.map((streak: any, index: number) => ({
                        category: streak.name || 'Unnamed Streak',
                        count: streak.days || 0,
                        color: COLORS[index % COLORS.length]
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.streaks.current_streaks.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-96 text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No streak data available yet</p>
                    <p className="text-sm">Start some streaks to see your category distribution</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
