'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Bell, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle,
  AlertCircle,
  Settings,
  Smartphone,
  Mail,
  Calendar,
  Repeat,
  Zap
} from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { motion } from 'framer-motion'

interface Reminder {
  id: string
  streak_id: string
  user_id: string
  time: string
  days_of_week: number[]
  message: string
  is_active: boolean
  reminder_type: 'push' | 'email' | 'both'
  created_at: string
  updated_at: string
  // Joined fields
  streak?: {
    id: string
    title: string
    description: string
    category: string
  }
}

interface CreateReminderData {
  streak_id: string
  time: string
  days_of_week: number[]
  message: string
  reminder_type: 'push' | 'email' | 'both'
}

export function StreakReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [userStreaks, setUserStreaks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [createData, setCreateData] = useState<CreateReminderData>({
    streak_id: '',
    time: '09:00',
    days_of_week: [1, 2, 3, 4, 5], // Monday to Friday
    message: '',
    reminder_type: 'push'
  })

  const supabase = createClient()

  const DAYS_OF_WEEK = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ]

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchReminders()
      fetchUserStreaks()
    }
  }, [user])

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchReminders = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('reminders')
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
        .order('time', { ascending: true })

      if (error) throw error
      setReminders(data || [])
    } catch (error) {
      console.error('Error fetching reminders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserStreaks = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
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
        .gt('current_streak_count', 0)

      if (error) throw error
      setUserStreaks(data || [])
    } catch (error) {
      console.error('Error fetching user streaks:', error)
    }
  }

  const handleCreateReminder = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('reminders')
        .insert({
          ...createData,
          user_id: user.id
        })

      if (error) throw error

      setShowCreateDialog(false)
      setCreateData({
        streak_id: '',
        time: '09:00',
        days_of_week: [1, 2, 3, 4, 5],
        message: '',
        reminder_type: 'push'
      })
      fetchReminders()
    } catch (error) {
      console.error('Error creating reminder:', error)
    }
  }

  const handleUpdateReminder = async (reminder: Reminder) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({
          time: reminder.time,
          days_of_week: reminder.days_of_week,
          message: reminder.message,
          reminder_type: reminder.reminder_type,
          is_active: reminder.is_active
        })
        .eq('id', reminder.id)

      if (error) throw error
      fetchReminders()
    } catch (error) {
      console.error('Error updating reminder:', error)
    }
  }

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', reminderId)

      if (error) throw error
      fetchReminders()
    } catch (error) {
      console.error('Error deleting reminder:', error)
    }
  }

  const toggleReminderActive = async (reminder: Reminder) => {
    const updatedReminder = { ...reminder, is_active: !reminder.is_active }
    await handleUpdateReminder(updatedReminder)
  }

  const formatDaysOfWeek = (days: number[]) => {
    if (days.length === 7) return 'Every day'
    if (days.length === 5 && days.every(d => d >= 1 && d <= 5)) return 'Weekdays'
    if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends'
    
    return days.map(day => DAYS_OF_WEEK[day].label.slice(0, 3)).join(', ')
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getReminderTypeIcon = (type: string) => {
    switch (type) {
      case 'push':
        return <Smartphone className="h-4 w-4" />
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'both':
        return <Zap className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getReminderTypeColor = (type: string) => {
    switch (type) {
      case 'push':
        return 'bg-blue-100 text-blue-800'
      case 'email':
        return 'bg-green-100 text-green-800'
      case 'both':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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
          <h2 className="text-3xl font-bold">Streak Reminders</h2>
          <p className="text-gray-600">Set up smart reminders to keep your streaks going</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Reminder</DialogTitle>
              <DialogDescription>
                Set up a reminder to help you maintain your streak.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="streak">Streak</Label>
                <Select value={createData.streak_id} onValueChange={(value) => setCreateData({ ...createData, streak_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a streak" />
                  </SelectTrigger>
                  <SelectContent>
                    {userStreaks.map(streak => (
                      <SelectItem key={streak.id} value={streak.streak_id}>
                        {streak.streak.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={createData.time}
                    onChange={(e) => setCreateData({ ...createData, time: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="type">Reminder Type</Label>
                  <Select value={createData.reminder_type} onValueChange={(value: 'push' | 'email' | 'both') => setCreateData({ ...createData, reminder_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="push">Push Notification</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Days of Week</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {DAYS_OF_WEEK.map(day => (
                    <Button
                      key={day.value}
                      variant={createData.days_of_week.includes(day.value) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const newDays = createData.days_of_week.includes(day.value)
                          ? createData.days_of_week.filter(d => d !== day.value)
                          : [...createData.days_of_week, day.value]
                        setCreateData({ ...createData, days_of_week: newDays })
                      }}
                    >
                      {day.label.slice(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="message">Custom Message (Optional)</Label>
                <Textarea
                  id="message"
                  value={createData.message}
                  onChange={(e) => setCreateData({ ...createData, message: e.target.value })}
                  placeholder="e.g., Time to work out! 💪"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateReminder}>
                Create Reminder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reminders List */}
      {reminders.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No Reminders Set</h3>
          <p className="text-gray-600 mb-4">Create your first reminder to stay consistent with your streaks!</p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Reminder
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {reminders.map((reminder, index) => (
            <motion.div
              key={reminder.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={reminder.is_active}
                          onCheckedChange={() => toggleReminderActive(reminder)}
                        />
                        <div className="flex items-center gap-2">
                          {getReminderTypeIcon(reminder.reminder_type)}
                          <Clock className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold">{reminder.streak?.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{formatTime(reminder.time)}</span>
                          <span>{formatDaysOfWeek(reminder.days_of_week)}</span>
                          <Badge className={getReminderTypeColor(reminder.reminder_type)}>
                            {reminder.reminder_type}
                          </Badge>
                        </div>
                        {reminder.message && (
                          <p className="text-sm text-gray-500 mt-1">"{reminder.message}"</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingReminder(reminder)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteReminder(reminder.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Smart Reminders Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Smart Reminders
          </CardTitle>
          <CardDescription>
            Our AI learns your patterns and suggests optimal reminder times
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">Adaptive Timing</h4>
                <p className="text-sm text-gray-600">Adjusts based on your check-in patterns</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Repeat className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium">Smart Frequency</h4>
                <p className="text-sm text-gray-600">Reduces notifications when you're consistent</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium">Motivational Messages</h4>
                <p className="text-sm text-gray-600">Personalized encouragement and tips</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
