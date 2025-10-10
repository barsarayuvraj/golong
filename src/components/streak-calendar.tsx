'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { Checkin } from '@/types/database'

interface StreakCalendarProps {
    checkins: Checkin[]
  userStreakStartDate?: string
  className?: string
}

interface CalendarDay {
  date: Date
  hasCheckin: boolean
  isToday: boolean
  isFuture: boolean
  isBeforeStreak: boolean
}

type CalendarView = 'week' | 'month' | 'year'

export function StreakCalendar({ checkins, userStreakStartDate, className }: StreakCalendarProps) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentWeek, setCurrentWeek] = useState(0)
  const [view, setView] = useState<CalendarView>('month')
  
  // Create a set of check-in dates for quick lookup
  const checkinDates = useMemo(() => {
    return new Set(checkins.map(checkin => checkin.checkin_date))
  }, [checkins])

  // Generate calendar data based on current view
  const calendarData = useMemo(() => {
    const today = new Date()
    const streakStart = userStreakStartDate ? new Date(userStreakStartDate) : null
    const days: CalendarDay[] = []
    
    if (view === 'year') {
      // Year view - show entire year
      const yearStart = new Date(currentYear, 0, 1)
      const yearEnd = new Date(currentYear, 11, 31)
      
      for (let date = new Date(yearStart); date <= yearEnd; date.setDate(date.getDate() + 1)) {
        // Use local date string to avoid timezone issues
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
        const isToday = dateStr === todayStr
        const isFuture = date > today
        const isBeforeStreak = streakStart ? dateStr < streakStart.toISOString().split('T')[0] : false
        
        days.push({
          date: new Date(date),
          hasCheckin: checkinDates.has(dateStr),
          isToday,
          isFuture,
          isBeforeStreak
        })
      }
    } else if (view === 'week') {
      // Week view - show current week
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek)
        date.setDate(startOfWeek.getDate() + i)
        // Use local date string to avoid timezone issues
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
        const isToday = dateStr === todayStr
        const isFuture = date > today
        const isBeforeStreak = streakStart ? dateStr < streakStart.toISOString().split('T')[0] : false
        
        days.push({
          date: new Date(date),
          hasCheckin: checkinDates.has(dateStr),
          isToday,
          isFuture,
          isBeforeStreak
        })
      }
    }
    // Note: Month view data is generated separately in renderCalendarGrid for proper alignment
    
    return days
  }, [currentYear, currentMonth, view, checkinDates, userStreakStartDate])

  // Calculate statistics based on current view
  const stats = useMemo(() => {
    let totalDays = 0
    let activeDays = 0
    let totalPossibleDays = 0
    let maxStreak = 0
    let currentStreak = 0
    
    
    if (view === 'month') {
      // For month view, calculate based on the current month
      const monthStart = new Date(currentYear, currentMonth, 1)
      const monthEnd = new Date(currentYear, currentMonth + 1, 0)
      const today = new Date()
      const streakStart = userStreakStartDate ? new Date(userStreakStartDate) : null
      
      for (let i = 1; i <= monthEnd.getDate(); i++) {
        const date = new Date(currentYear, currentMonth, i)
        // Use local date string to avoid timezone issues - consistent with calendarData
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
        const isToday = dateStr === todayStr
        const isFuture = date > today
        const isBeforeStreak = streakStart ? dateStr < streakStart.toISOString().split('T')[0] : false
        const hasCheckin = checkinDates.has(dateStr)
        
        
        totalDays++
        if (!isFuture && !isBeforeStreak) {
          totalPossibleDays++
          if (hasCheckin) {
            activeDays++
            currentStreak++
            maxStreak = Math.max(maxStreak, currentStreak)
      } else {
            currentStreak = 0
          }
        }
      }
    } else {
      // For week and year views, use calendarData
      totalDays = calendarData.length
      activeDays = calendarData.filter(day => day.hasCheckin && !day.isFuture && !day.isBeforeStreak).length
      totalPossibleDays = calendarData.filter(day => !day.isFuture && !day.isBeforeStreak).length
      
      // Calculate max streak
      for (const day of calendarData) {
        if (day.isFuture || day.isBeforeStreak) continue
        
        if (day.hasCheckin) {
          currentStreak++
          maxStreak = Math.max(maxStreak, currentStreak)
      } else {
          currentStreak = 0
        }
      }
    }

    const result = {
      totalDays,
      activeDays,
      totalPossibleDays,
      maxStreak,
      currentStreak,
      activityPercentage: totalPossibleDays > 0 ? Math.round((activeDays / totalPossibleDays) * 100) : 0
    }
    
    return result
  }, [calendarData, view, currentYear, currentMonth, checkinDates, userStreakStartDate])

  // Navigation functions
  const navigatePrevious = () => {
    if (view === 'year') {
      setCurrentYear(currentYear - 1)
    } else if (view === 'month') {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    }
  }

  const navigateNext = () => {
    if (view === 'year') {
      setCurrentYear(currentYear + 1)
    } else if (view === 'month') {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  const getCurrentPeriod = () => {
    if (view === 'year') {
      return currentYear.toString()
    } else if (view === 'month') {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December']
      return `${monthNames[currentMonth]} ${currentYear}`
    } else {
      return 'This Week'
    }
  }

  const getDayColor = (day: CalendarDay) => {
    if (day.isBeforeStreak) return 'bg-gray-100 text-gray-400'
    if (day.isFuture) return 'bg-gray-50 text-gray-400'
    if (day.isToday && day.hasCheckin) return 'bg-green-500 text-white border-2 border-blue-400'
    if (day.isToday) return 'bg-blue-200 text-blue-800 border-2 border-blue-400'
    if (day.hasCheckin) return 'bg-green-500 text-white'
    return 'bg-gray-200 text-gray-700'
  }


  const renderCalendarGrid = () => {
    if (view === 'week') {
      // Week view - horizontal layout
  return (
        <div className="flex items-center gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, index) => (
            <div key={index} className="flex flex-col items-center gap-1 min-w-[40px]">
              <div className="text-xs text-gray-500">{dayName}</div>
              <div
                className={`
                  w-8 h-8 rounded-md cursor-pointer transition-colors flex items-center justify-center text-xs font-medium
                  ${getDayColor(calendarData[index] || {})}
                  hover:scale-110
                `}
                title={calendarData[index] ? `
                  ${calendarData[index].date.toLocaleDateString()}
                  ${calendarData[index].hasCheckin ? '✓ Checked in' : '✗ No check-in'}
                  ${calendarData[index].isToday ? ' (Today)' : ''}
                ` : ''}
              >
                {calendarData[index]?.date.getDate()}
              </div>
            </div>
          ))}
        </div>
      )
    } else if (view === 'month') {
      // Month view - FIXED horizontal calendar grid
      const monthStart = new Date(currentYear, currentMonth, 1)
      const monthEnd = new Date(currentYear, currentMonth + 1, 0)
      const daysInMonth = monthEnd.getDate()
      const firstDayOfMonth = monthStart.getDay() // 0 = Sunday, 1 = Monday, etc.
      
      // Create array with null values for empty cells at the start of the month
      const days: (CalendarDay | null)[] = []
      
      // Add empty cells for days before the first day of the month
      for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null)
      }
      
      // Add all days of the month
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(currentYear, currentMonth, i)
        // Use local date string to avoid timezone issues
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
        const today = new Date()
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
        const isToday = dateStr === todayStr
        const isFuture = date > today
        const streakStart = userStreakStartDate ? new Date(userStreakStartDate) : null
        const isBeforeStreak = streakStart ? dateStr < streakStart.toISOString().split('T')[0] : false
        
        const hasCheckin = checkinDates.has(dateStr)
        const dayObj = {
          date,
          hasCheckin,
          isToday,
          isFuture,
          isBeforeStreak
        }
        days.push(dayObj)
        
      }
      
      return (
        <div className="w-full">
          {/* Day headers - HORIZONTAL alignment */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <div key={index} className="text-xs text-gray-500 text-center p-1 font-medium">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid - DIRECT 7-column layout without weeks array */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const dayColor = day ? getDayColor(day) : 'bg-transparent'
              return (
              <div
                key={index}
                className={`
                  aspect-square rounded-sm cursor-pointer transition-all duration-200 flex items-center justify-center text-xs font-medium
                  ${dayColor}
                  ${day ? 'hover:scale-110' : ''}
                  min-h-[32px]
                `}
                title={day ? `
                  ${day.date.toLocaleDateString()}
                  ${day.hasCheckin ? '✓ Checked in' : '✗ No check-in'}
                  ${day.isToday ? ' (Today)' : ''}
                ` : ''}
              >
                {day ? day.date.getDate() : ''}
              </div>
              )
            })}
          </div>
        </div>
      )
    } else {
      // Year view - horizontal layout with months
      const monthsData: { [key: number]: CalendarDay[] } = {}
      calendarData.forEach(day => {
        const month = day.date.getMonth()
        if (!monthsData[month]) monthsData[month] = []
        monthsData[month].push(day)
      })

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      
      return (
        <div className="grid grid-cols-12 gap-2">
          {monthNames.map((monthName, monthIndex) => (
            <div key={monthIndex} className="flex flex-col items-center gap-1">
              <div className="text-xs text-gray-500 font-medium">{monthName}</div>
              <div className="flex flex-wrap gap-0.5 max-w-[80px]">
                {monthsData[monthIndex]?.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`
                      w-3 h-3 rounded-sm cursor-pointer transition-all duration-200
                      ${getDayColor(day)}
                      hover:scale-125 hover:shadow-sm
                      ${day.hasCheckin ? 'ring-1 ring-green-300' : ''}
                    `}
                    title={`
                      ${day.date.toLocaleDateString()}
                      ${day.hasCheckin ? '✓ Checked in' : '✗ No check-in'}
                      ${day.isToday ? ' (Today)' : ''}
                    `}
                  />
                ))}
                          </div>
                        </div>
                      ))}
                    </div>
      )
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="flex items-center text-lg">
            <CalendarIcon className="mr-2 h-5 w-5" />
            Activity Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['week', 'month', 'year'] as CalendarView[]).map((viewOption) => (
                      <Button
                  key={viewOption}
                  variant={view === viewOption ? "default" : "ghost"}
                        size="sm"
                  onClick={() => setView(viewOption)}
                  className="h-7 px-3 text-xs"
                      >
                  {viewOption.charAt(0).toUpperCase() + viewOption.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
        </div>
        
        {/* Navigation and Statistics */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={navigatePrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {getCurrentPeriod()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={navigateNext}
              disabled={view === 'year' && currentYear >= new Date().getFullYear()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Statistics */}
          <div className="flex items-center gap-3 text-sm">
            <div className="text-center">
              <div className="font-bold text-green-600">{stats.activeDays}</div>
              <div className="text-xs text-gray-600">Active</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-blue-600">{stats.maxStreak}</div>
              <div className="text-xs text-gray-600">Max</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-orange-600">{stats.currentStreak}</div>
              <div className="text-xs text-gray-600">Current</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-purple-600">{stats.activityPercentage}%</div>
              <div className="text-xs text-gray-600">Rate</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Calendar Grid */}
        <div className="mb-3">
          {renderCalendarGrid()}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-200 rounded-sm"></div>
            <span>No check-in</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
            <span>Checked in</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-200 border-2 border-blue-400 rounded-sm"></div>
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 border-2 border-blue-400 rounded-sm"></div>
            <span>Today + Check-in</span>
      </div>
    </div>
      </CardContent>
    </Card>
  )
}