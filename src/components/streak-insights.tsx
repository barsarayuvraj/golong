'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Target, Calendar, Zap, Award, Clock } from 'lucide-react'
import { Checkin, UserStreak } from '@/types/database'

interface StreakInsightsProps {
  checkins: Checkin[]
  userStreak: UserStreak | null
  className?: string
}

export function StreakInsights({ checkins, userStreak, className }: StreakInsightsProps) {
  const insights = useMemo(() => {
    if (!checkins.length || !userStreak) {
      return {
        totalCheckins: 0,
        totalActiveDays: 0,
        maxStreak: 0,
        currentStreak: 0,
        averagePerWeek: 0,
        bestDayOfWeek: '',
        bestMonth: '',
        consistencyScore: 0,
        longestGap: 0,
        recoveryTime: 0,
        milestones: [] as Array<{ days: number; achieved: boolean; date?: string }>
      }
    }

    const checkinDates = checkins
      .map(c => new Date(c.checkin_date))
      .sort((a, b) => a.getTime() - b.getTime())

    const streakStart = new Date(userStreak.joined_at)
    const today = new Date()
    const totalDaysSinceStart = Math.ceil((today.getTime() - streakStart.getTime()) / (1000 * 60 * 60 * 24))
    
    // Calculate streaks and gaps
    let maxStreak = 0
    let currentStreak = 0
    let longestGap = 0
    let currentGap = 0
    let lastCheckinDate: Date | null = null
    let recoveryTime = 0
    let totalRecoveryTime = 0
    let recoveryCount = 0

    // Add streak start as first "checkin" for calculation
    const allDates = [streakStart, ...checkinDates]
    
    for (let i = 0; i < allDates.length; i++) {
      const currentDate = allDates[i]
      const nextDate = allDates[i + 1]
      
      if (nextDate) {
        const daysDiff = Math.ceil((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff === 1) {
          // Consecutive day
          currentStreak++
          maxStreak = Math.max(maxStreak, currentStreak)
          currentGap = 0
        } else {
          // Gap found
          longestGap = Math.max(longestGap, daysDiff - 1)
          if (currentGap > 0) {
            totalRecoveryTime += daysDiff - 1
            recoveryCount++
          }
          currentStreak = 1
          currentGap = daysDiff - 1
        }
      } else {
        // Last date - check if it's today or recent
        const daysSinceLastCheckin = Math.ceil((today.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
        if (daysSinceLastCheckin <= 1) {
          currentStreak++
          maxStreak = Math.max(maxStreak, currentStreak)
        } else {
          longestGap = Math.max(longestGap, daysSinceLastCheckin - 1)
        }
      }
    }

    recoveryTime = recoveryCount > 0 ? Math.round(totalRecoveryTime / recoveryCount) : 0

    // Calculate day of week preferences
    const dayOfWeekCounts: { [key: number]: number } = {}
    checkinDates.forEach(date => {
      const dayOfWeek = date.getDay()
      dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1
    })
    
    const bestDayIndex = Object.entries(dayOfWeekCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0]
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const bestDayOfWeek = bestDayIndex ? dayNames[parseInt(bestDayIndex)] : 'N/A'

    // Calculate month preferences
    const monthCounts: { [key: number]: number } = {}
    checkinDates.forEach(date => {
      const month = date.getMonth()
      monthCounts[month] = (monthCounts[month] || 0) + 1
    })
    
    const bestMonthIndex = Object.entries(monthCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0]
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    const bestMonth = bestMonthIndex ? monthNames[parseInt(bestMonthIndex)] : 'N/A'

    // Calculate consistency score (0-100)
    const expectedCheckins = Math.max(1, totalDaysSinceStart)
    const consistencyScore = Math.round((checkins.length / expectedCheckins) * 100)

    // Calculate average per week
    const weeksSinceStart = Math.max(1, Math.ceil(totalDaysSinceStart / 7))
    const averagePerWeek = Math.round((checkins.length / weeksSinceStart) * 10) / 10

    // Define milestones
    const milestones = [
      { days: 7, achieved: maxStreak >= 7 },
      { days: 30, achieved: maxStreak >= 30 },
      { days: 100, achieved: maxStreak >= 100 },
      { days: 365, achieved: maxStreak >= 365 }
    ]

    return {
      totalCheckins: checkins.length,
      totalActiveDays: checkins.length,
      maxStreak,
      currentStreak,
      averagePerWeek,
      bestDayOfWeek,
      bestMonth,
      consistencyScore,
      longestGap,
      recoveryTime,
      milestones
    }
  }, [checkins, userStreak])

  if (!userStreak) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Streak Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Join the streak to see detailed insights about your progress!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="mr-2 h-5 w-5" />
          Streak Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{insights.totalCheckins}</div>
            <div className="text-xs text-gray-600">Total Check-ins</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{insights.maxStreak}</div>
            <div className="text-xs text-gray-600">Best Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{insights.consistencyScore}%</div>
            <div className="text-xs text-gray-600">Consistency</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{insights.averagePerWeek}</div>
            <div className="text-xs text-gray-600">Per Week</div>
          </div>
        </div>

        {/* Consistency Score */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Consistency Score</span>
            <span>{insights.consistencyScore}%</span>
          </div>
          <Progress value={insights.consistencyScore} className="h-2" />
          <p className="text-xs text-gray-500">
            {insights.consistencyScore >= 80 ? 'Excellent consistency! 🔥' :
             insights.consistencyScore >= 60 ? 'Good consistency! Keep it up! 💪' :
             insights.consistencyScore >= 40 ? 'Room for improvement 📈' :
             'Let\'s build some momentum! 🚀'}
          </p>
        </div>

        {/* Patterns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Best Day</span>
            </div>
            <p className="text-sm text-gray-600">{insights.bestDayOfWeek}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Best Month</span>
            </div>
            <p className="text-sm text-gray-600">{insights.bestMonth}</p>
          </div>
        </div>

        {/* Recovery Stats */}
        {insights.longestGap > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Longest Gap</span>
              </div>
              <p className="text-sm text-gray-600">{insights.longestGap} days</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Avg Recovery</span>
              </div>
              <p className="text-sm text-gray-600">{insights.recoveryTime} days</p>
            </div>
          </div>
        )}

        {/* Milestones */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">Milestones</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {insights.milestones.map((milestone, index) => (
              <Badge
                key={index}
                variant={milestone.achieved ? "default" : "secondary"}
                className={milestone.achieved ? "bg-green-100 text-green-800" : ""}
              >
                {milestone.days} days {milestone.achieved ? "✓" : ""}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
