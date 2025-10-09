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
  const [analytics, setAnalytics] = useState<StreakAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')

  const supabase = createClient()

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchAnalytics()
    }
  }, [user, timeRange])

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchAnalytics = async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch(`/api/analytics?timeRange=${timeRange}`)
      const result = await response.json()

      if (response.ok) {
        setAnalytics(result.analytics)
      } else {
        console.error('Error fetching analytics:', result.error)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStartDate = (range: 'week' | 'month' | 'year') => {
    const now = new Date()
    switch (range) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    }
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
              onClick={() => setTimeRange(range)}
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
              <div className="text-2xl font-bold">{analytics.totalStreaks}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.activeStreaks} active
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
              <div className="text-2xl font-bold">{analytics.longestStreak}</div>
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
              <div className="text-2xl font-bold">{analytics.successRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {analytics.totalDays} total days
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
              <div className="text-2xl font-bold">{analytics.averageStreakLength.toFixed(1)}</div>
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
                  <AreaChart data={analytics.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="days" 
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
                  <BarChart data={analytics.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="checkins" fill="#82ca9d" />
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
                <LineChart data={analytics.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="streaks" 
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
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={analytics.categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
