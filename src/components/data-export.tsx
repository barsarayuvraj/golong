'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Download, 
  FileText, 
  BarChart3, 
  Calendar, 
  FileSpreadsheet,
  Image,
  Mail,
  Share2,
  Clock,
  Target,
  TrendingUp,
  Award,
  Users
} from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { motion } from 'framer-motion'

interface ExportData {
  streaks: any[]
  checkins: any[]
  achievements: any[]
  userStats: any
}

interface ExportOptions {
  format: 'pdf' | 'csv' | 'json'
  includeCharts: boolean
  includeAchievements: boolean
  includeCheckins: boolean
  dateRange: 'all' | 'month' | 'quarter' | 'year'
  streaks: string[]
}

export function DataExport() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [exportData, setExportData] = useState<ExportData | null>(null)
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeCharts: true,
    includeAchievements: true,
    includeCheckins: true,
    dateRange: 'all',
    streaks: []
  })

  const supabase = createClient()

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchExportData()
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

  const fetchExportData = async () => {
    if (!user) {
      console.log('No user found, skipping fetchExportData')
      return
    }

    try {
      console.log('Fetching export data for user:', user.id)
      
      // Fetch user's streaks
      const { data: streaks, error: streaksError } = await supabase
        .from('user_streaks')
        .select(`
          *,
          streak:streaks (
            id,
            title,
            description,
            category,
            created_at
          )
        `)
        .eq('user_id', user.id)

      if (streaksError) {
        console.error('Supabase error fetching streaks:', streaksError)
        throw streaksError
      }

      console.log('Successfully fetched streaks:', streaks)

      // Fetch check-ins through user_streaks relationship
      let checkins = []
      if (streaks && streaks.length > 0) {
        const userStreakIds = streaks.map(us => us.id)
        const { data: checkinsData, error: checkinsError } = await supabase
          .from('checkins')
          .select('*')
          .in('user_streak_id', userStreakIds)

        if (checkinsError) {
          console.error('Supabase error fetching checkins:', checkinsError)
          throw checkinsError
        }

        checkins = checkinsData || []
        console.log('Successfully fetched checkins:', checkins)
      } else {
        console.log('No streaks found, skipping checkins fetch')
      }

      // Fetch achievements
      const { data: achievements, error: achievementsError } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements (*)
        `)
        .eq('user_id', user.id)

      if (achievementsError) {
        console.error('Supabase error fetching achievements:', achievementsError)
        throw achievementsError
      }

      console.log('Successfully fetched achievements:', achievements)

      // Calculate user stats
      const userStats = {
        totalStreaks: streaks?.length || 0,
        activeStreaks: streaks?.filter(s => s.current_streak_count > 0).length || 0,
        longestStreak: streaks && streaks.length > 0 
          ? Math.max(...streaks.map(s => s.longest_streak_count || 0).filter(count => !isNaN(count))) 
          : 0,
        totalCheckins: checkins?.length || 0,
        totalAchievements: achievements?.length || 0,
        joinDate: user.created_at,
        lastActive: checkins?.[0]?.checkin_date || user.created_at
      }

      console.log('Calculated user stats:', userStats)

      setExportData({
        streaks: streaks || [],
        checkins: checkins || [],
        achievements: achievements || [],
        userStats
      })
    } catch (error) {
      console.error('Error fetching export data:', error)
      console.error('Error details:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      })
      // Set empty data to prevent further errors
      setExportData({
        streaks: [],
        checkins: [],
        achievements: [],
        userStats: {
          totalStreaks: 0,
          activeStreaks: 0,
          longestStreak: 0,
          totalCheckins: 0,
          totalAchievements: 0,
          joinDate: user?.created_at || new Date().toISOString(),
          lastActive: user?.created_at || new Date().toISOString()
        }
      })
    }
  }

  const generateCSV = (data: any[], filename: string) => {
    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const generateJSON = (data: any, filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const generatePDF = async () => {
    // This would typically use a library like jsPDF or Puppeteer
    // For now, we'll create a simple HTML report that can be printed
    const reportHTML = generateReportHTML()
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(reportHTML)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const getStartDate = (dateRange: string): string => {
    const now = new Date()
    switch (dateRange) {
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
        return quarterStart.toISOString().split('T')[0]
      case 'year':
        return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
      default:
        return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().split('T')[0]
    }
  }

  const generateReportHTML = () => {
    if (!exportData) return ''

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>GoLong Streak Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
          .stat-card { border: 1px solid #ddd; padding: 15px; text-align: center; }
          .streaks-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .streaks-table th, .streaks-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .streaks-table th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>GoLong Streak Report</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="stats">
          <div class="stat-card">
            <h3>${exportData.userStats.totalStreaks}</h3>
            <p>Total Streaks</p>
          </div>
          <div class="stat-card">
            <h3>${exportData.userStats.activeStreaks}</h3>
            <p>Active Streaks</p>
          </div>
          <div class="stat-card">
            <h3>${exportData.userStats.longestStreak}</h3>
            <p>Longest Streak</p>
          </div>
        </div>

        <h2>Streak Details</h2>
        <table class="streaks-table">
          <thead>
            <tr>
              <th>Streak Name</th>
              <th>Category</th>
              <th>Current Count</th>
              <th>Longest Count</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${exportData.streaks.map(streak => `
              <tr>
                <td>${streak.streak?.title || 'N/A'}</td>
                <td>${streak.streak?.category || 'N/A'}</td>
                <td>${streak.current_streak_count}</td>
                <td>${streak.longest_streak_count}</td>
                <td>${streak.current_streak_count > 0 ? 'Active' : 'Inactive'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${exportOptions.includeAchievements && exportData.achievements.length > 0 ? `
          <h2>Achievements</h2>
          <ul>
            ${exportData.achievements.map(achievement => `
              <li>${achievement.achievement?.name} - Earned ${new Date(achievement.earned_at).toLocaleDateString()}</li>
            `).join('')}
          </ul>
        ` : ''}
      </body>
      </html>
    `
  }

  const handleExport = async () => {
    if (!user) return

    try {
      setLoading(true)
      console.log('Starting export with options:', exportOptions)
      
      // Map frontend options to API format
      const apiPayload = {
        export_type: 'all', // Always export all data for now
        format: exportOptions.format,
        // Add date range if not 'all'
        ...(exportOptions.dateRange !== 'all' && {
          start_date: getStartDate(exportOptions.dateRange),
          end_date: new Date().toISOString().split('T')[0]
        })
      }
      
      console.log('Sending API payload:', apiPayload)
      
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Export job created successfully:', result)
        
        // For now, we'll use the local data since the API creates a background job
        // In a real app, you'd wait for the job to complete and download the file
        
        if (exportOptions.format === 'csv') {
          generateCSV(exportData.streaks, `golong-streaks-${new Date().toISOString().split('T')[0]}.csv`)
          if (exportData.checkins.length > 0) {
            generateCSV(exportData.checkins, `golong-checkins-${new Date().toISOString().split('T')[0]}.csv`)
          }
          if (exportData.achievements.length > 0) {
            generateCSV(exportData.achievements, `golong-achievements-${new Date().toISOString().split('T')[0]}.csv`)
          }
        } else if (exportOptions.format === 'json') {
          generateJSON(exportData, `golong-export-${new Date().toISOString().split('T')[0]}.json`)
        } else if (exportOptions.format === 'pdf') {
          generatePDF()
        }
        
        console.log('Export completed successfully!')
      } else {
        const result = await response.json()
        console.error('Export failed:', result.error)
        console.error('Error details:', result.details)
      }
    } catch (error) {
      console.error('Error exporting data:', error)
    } finally {
      setLoading(false)
    }
  }

  const shareReport = async () => {
    if (!exportData) return

    const reportData = {
      title: 'My GoLong Streak Report',
      text: `Check out my streak progress! ${exportData.userStats.totalStreaks} streaks, ${exportData.userStats.longestStreak} day longest streak!`,
      url: window.location.href
    }

    if (navigator.share) {
      try {
        await navigator.share(reportData)
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(`${reportData.text} ${reportData.url}`)
      alert('Report link copied to clipboard!')
    }
  }

  if (!exportData) {
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
          <h2 className="text-3xl font-bold">Export Data</h2>
          <p className="text-gray-600">Download your streak data and generate progress reports</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={shareReport}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share Report
          </Button>
          <Button
            onClick={handleExport}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Download className="h-4 w-4 mr-2" />
            {loading ? 'Exporting...' : 'Export Data'}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <div className="text-2xl font-bold">{exportData.userStats.totalStreaks || 0}</div>
              <p className="text-xs text-muted-foreground">
                {exportData.userStats.activeStreaks || 0} active
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
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exportData.userStats.longestStreak || 0}</div>
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
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exportData.userStats.totalCheckins || 0}</div>
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
              <CardTitle className="text-sm font-medium">Achievements</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exportData.userStats.totalAchievements || 0}</div>
              <p className="text-xs text-muted-foreground">earned</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
          <CardDescription>Choose what to include in your export</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Format Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Export Format</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { value: 'pdf', label: 'PDF Report', icon: FileText },
                { value: 'csv', label: 'CSV Data', icon: FileSpreadsheet },
                { value: 'json', label: 'JSON Data', icon: BarChart3 }
              ].map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={exportOptions.format === value ? 'default' : 'outline'}
                  onClick={() => setExportOptions({ ...exportOptions, format: value as any })}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Content Options */}
          <div>
            <label className="text-sm font-medium mb-2 block">Include in Export</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="charts"
                  checked={exportOptions.includeCharts}
                  onCheckedChange={(checked) => 
                    setExportOptions({ ...exportOptions, includeCharts: !!checked })
                  }
                />
                <label htmlFor="charts" className="text-sm">
                  Charts and Visualizations
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="achievements"
                  checked={exportOptions.includeAchievements}
                  onCheckedChange={(checked) => 
                    setExportOptions({ ...exportOptions, includeAchievements: !!checked })
                  }
                />
                <label htmlFor="achievements" className="text-sm">
                  Achievements and Badges
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="checkins"
                  checked={exportOptions.includeCheckins}
                  onCheckedChange={(checked) => 
                    setExportOptions({ ...exportOptions, includeCheckins: !!checked })
                  }
                />
                <label htmlFor="checkins" className="text-sm">
                  Detailed Check-in History
                </label>
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="text-sm font-medium mb-2 block">Date Range</label>
            <Select 
              value={exportOptions.dateRange} 
              onValueChange={(value: any) => setExportOptions({ ...exportOptions, dateRange: value })}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Export Preview</CardTitle>
          <CardDescription>Preview of what will be included in your export</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Streak Data</span>
              <Badge variant="secondary">{exportData.streaks.length} streaks</Badge>
            </div>
            {exportOptions.includeCheckins && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Check-in History</span>
                <Badge variant="secondary">{exportData.checkins.length} check-ins</Badge>
              </div>
            )}
            {exportOptions.includeAchievements && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Achievements</span>
                <Badge variant="secondary">{exportData.achievements.length} earned</Badge>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm">Format</span>
              <Badge variant="outline">{exportOptions.format.toUpperCase()}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
