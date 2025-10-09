'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Target,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp
} from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { motion } from 'framer-motion'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

interface Checkin {
  id: string
  streak_id: string
  user_id: string
  created_at: string
  notes?: string
}

interface UserStreak {
  id: string
  streak_id: string
  user_id: string
  current_streak_count: number
  longest_streak_count: number
  last_checkin_date: string
  streak: {
    id: string
    title: string
    description: string
    category: string
    color?: string
  }
}

interface CalendarData {
  [date: string]: {
    checkins: Checkin[]
    streaks: UserStreak[]
    totalCheckins: number
  }
}

export function StreakCalendar() {
  const [calendarData, setCalendarData] = useState<CalendarData>({})
  const [userStreaks, setUserStreaks] = useState<UserStreak[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedStreak, setSelectedStreak] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [view, setView] = useState<'month' | 'week' | 'year'>('month')

  const supabase = createClient()

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchCalendarData()
    }
  }, [user, selectedStreak])

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchCalendarData = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Get user's streaks
      const { data: streaks, error: streaksError } = await supabase
        .from('user_streaks')
        .select(`
          *,
          streak:streaks (
            id,
            title,
            description,
            category
          )
        `)
        .eq('user_id', user.id)

      if (streaksError) throw streaksError

      setUserStreaks(streaks || [])

      // Get check-ins for the last 6 months
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const { data: checkins, error: checkinsError } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', sixMonthsAgo.toISOString())

      if (checkinsError) throw checkinsError

      // Process calendar data
      const processedData: CalendarData = {}
      
      checkins?.forEach(checkin => {
        const date = new Date(checkin.created_at).toISOString().split('T')[0]
        if (!processedData[date]) {
          processedData[date] = {
            checkins: [],
            streaks: [],
            totalCheckins: 0
          }
        }
        processedData[date].checkins.push(checkin)
        processedData[date].totalCheckins++
      })

      // Add streak information for each date
      streaks?.forEach(userStreak => {
        if (selectedStreak === 'all' || userStreak.streak_id === selectedStreak) {
          // Add streak info to relevant dates
          Object.keys(processedData).forEach(date => {
            if (processedData[date].checkins.some(c => c.streak_id === userStreak.streak_id)) {
              if (!processedData[date].streaks.find(s => s.id === userStreak.id)) {
                processedData[date].streaks.push(userStreak)
              }
            }
          })
        }
      })

      setCalendarData(processedData)
    } catch (error) {
      console.error('Error fetching calendar data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTileContent = ({ date, view }: { date: Date; view: string }) => {
    const dateStr = date.toISOString().split('T')[0]
    const dayData = calendarData[dateStr]

    if (!dayData || dayData.totalCheckins === 0) {
      return null
    }

    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="flex items-center gap-1">
          {dayData.streaks.slice(0, 3).map((streak, index) => (
            <div
              key={streak.id}
              className="w-2 h-2 rounded-full bg-green-500"
              style={{ backgroundColor: getStreakColor(streak.streak.category) }}
            />
          ))}
          {dayData.streaks.length > 3 && (
            <div className="w-2 h-2 rounded-full bg-gray-400" />
          )}
        </div>
        <div className="text-xs font-medium text-green-600">
          {dayData.totalCheckins}
        </div>
      </div>
    )
  }

  const getStreakColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Health & Fitness': '#10b981',
      'Learning': '#3b82f6',
      'Productivity': '#f59e0b',
      'Lifestyle': '#8b5cf6',
      'Other': '#6b7280'
    }
    return colors[category] || colors['Other']
  }

  const getSelectedDateData = () => {
    const dateStr = selectedDate.toISOString().split('T')[0]
    return calendarData[dateStr] || { checkins: [], streaks: [], totalCheckins: 0 }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleCheckIn = async (streakId: string, date?: Date) => {
    if (!user) return

    try {
      const checkinDate = date || new Date()
      const response = await fetch('/api/checkins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streak_id: streakId,
          checkin_date: checkinDate.toISOString().split('T')[0]
        })
      })

      const result = await response.json()

      if (response.ok) {
        // Refresh calendar data
        await fetchCalendarData()
        
        // Show success message
        console.log('Check-in successful:', result.message)
      } else {
        console.error('Check-in failed:', result.error)
      }
    } catch (error) {
      console.error('Error checking in:', error)
    }
  }

  const handleRemoveCheckIn = async (checkinId: string) => {
    if (!user) return

    try {
      const response = await fetch(`/api/checkins?checkin_id=${checkinId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (response.ok) {
        // Refresh calendar data
        await fetchCalendarData()
        
        console.log('Check-in removed:', result.message)
      } else {
        console.error('Remove check-in failed:', result.error)
      }
    } catch (error) {
      console.error('Error removing check-in:', error)
    }
  }

  const getStreakStats = () => {
    const totalDays = Object.keys(calendarData).length
    const totalCheckins = Object.values(calendarData).reduce((sum, day) => sum + day.totalCheckins, 0)
    const currentStreak = calculateCurrentStreak()
    const longestStreak = calculateLongestStreak()

    return {
      totalDays,
      totalCheckins,
      currentStreak,
      longestStreak,
      averagePerDay: totalDays > 0 ? (totalCheckins / totalDays).toFixed(1) : '0'
    }
  }

  const calculateCurrentStreak = () => {
    const today = new Date()
    let streak = 0
    
    for (let i = 0; i < 365; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      if (calendarData[dateStr] && calendarData[dateStr].totalCheckins > 0) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  }

  const calculateLongestStreak = () => {
    const dates = Object.keys(calendarData).sort()
    let longestStreak = 0
    let currentStreak = 0
    
    dates.forEach(date => {
      if (calendarData[date].totalCheckins > 0) {
        currentStreak++
        longestStreak = Math.max(longestStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    })
    
    return longestStreak
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const stats = getStreakStats()
  const selectedDateData = getSelectedDateData()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Streak Calendar</h2>
          <p className="text-gray-600">Track your daily progress and build consistency</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={view} onValueChange={(value: 'month' | 'week' | 'year') => setView(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
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
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.currentStreak}</div>
              <p className="text-xs text-muted-foreground">days</p>
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
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.longestStreak}</div>
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
              <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCheckins}</div>
              <p className="text-xs text-muted-foreground">all time</p>
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
              <CardTitle className="text-sm font-medium">Avg per Day</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averagePerDay}</div>
              <p className="text-xs text-muted-foreground">check-ins</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Calendar View</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={selectedStreak} onValueChange={setSelectedStreak}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by streak" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Streaks</SelectItem>
                      {userStreaks.map(streak => (
                        <SelectItem key={streak.id} value={streak.streak_id}>
                          {streak.streak.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="calendar-container">
                <Calendar
                  onChange={setSelectedDate}
                  value={selectedDate}
                  tileContent={getTileContent}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Date Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Selected Date</CardTitle>
              <CardDescription>{formatDate(selectedDate)}</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDateData.totalCheckins > 0 ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {selectedDateData.totalCheckins}
                    </div>
                    <div className="text-sm text-gray-600">Check-ins completed</div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Streaks:</h4>
                    {selectedDateData.streaks.map(streak => (
                      <div key={streak.id} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getStreakColor(streak.streak.category) }}
                        />
                        <span className="text-sm">{streak.streak.title}</span>
                      </div>
                    ))}
                  </div>

                  {selectedDateData.checkins.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Check-in Details:</h4>
                      {selectedDateData.checkins.map(checkin => (
                        <div key={checkin.id} className="text-sm text-gray-600">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>
                                {new Date(checkin.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              onClick={() => handleRemoveCheckIn(checkin.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                          {checkin.notes && (
                            <p className="ml-6 text-xs italic">"{checkin.notes}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <XCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500 mb-4">No check-ins on this date</p>
                  
                  {/* Quick Check-in Buttons */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Quick Check-in:</h4>
                    {userStreaks.map(streak => (
                      <Button
                        key={streak.id}
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleCheckIn(streak.streak_id, selectedDate)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {streak.streak.title}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
