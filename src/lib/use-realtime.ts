'use client'

import { useState, useEffect, useCallback } from 'react'
import { realtimeService, RealtimeEvent, RealtimeSubscription } from '@/lib/realtime-service'
import { createClient } from '@/lib/supabase-client'
import { User as SupabaseUser } from '@supabase/supabase-js'

export interface RealtimeNotification {
  id: string
  type: 'achievement' | 'checkin' | 'comment' | 'like' | 'notification'
  title: string
  message: string
  data?: any
  timestamp: string
  read: boolean
}

export function useRealtimeNotifications() {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([])
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected')
  const [subscription, setSubscription] = useState<RealtimeSubscription | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (user) {
      setupRealtimeSubscription()
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [user])

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const setupRealtimeSubscription = useCallback(() => {
    if (!user) return

    const sub = realtimeService.subscribeToUserEvents(user.id, (event: RealtimeEvent) => {
      handleRealtimeEvent(event)
    })

    setSubscription(sub)
    setConnectionStatus(realtimeService.getConnectionStatus())
  }, [user])

  const handleRealtimeEvent = useCallback((event: RealtimeEvent) => {
    let notification: RealtimeNotification

    switch (event.type) {
      case 'achievement':
        notification = {
          id: `achievement-${event.data.id}-${Date.now()}`,
          type: 'achievement',
          title: 'Achievement Unlocked! 🏆',
          message: `You've earned the "${event.data.achievement?.name || 'New Achievement'}" achievement!`,
          data: event.data,
          timestamp: event.timestamp,
          read: false
        }
        break

      case 'checkin':
        notification = {
          id: `checkin-${event.data.id}-${Date.now()}`,
          type: 'checkin',
          title: 'Check-in Recorded! ✅',
          message: `Great job! You've checked in to your streak.`,
          data: event.data,
          timestamp: event.timestamp,
          read: false
        }
        break

      case 'comment':
        notification = {
          id: `comment-${event.data.id}-${Date.now()}`,
          type: 'comment',
          title: 'New Comment! 💬',
          message: `Someone commented on your streak.`,
          data: event.data,
          timestamp: event.timestamp,
          read: false
        }
        break

      case 'like':
        notification = {
          id: `like-${event.data.id}-${Date.now()}`,
          type: 'like',
          title: 'New Like! ❤️',
          message: `Someone liked your streak!`,
          data: event.data,
          timestamp: event.timestamp,
          read: false
        }
        break

      case 'notification':
        notification = {
          id: `notification-${event.data.id}-${Date.now()}`,
          type: 'notification',
          title: event.data.title || 'New Notification',
          message: event.data.message || 'You have a new notification.',
          data: event.data,
          timestamp: event.timestamp,
          read: false
        }
        break

      default:
        return
    }

    // Add notification to the list
    setNotifications(prev => [notification, ...prev.slice(0, 49)]) // Keep last 50 notifications

    // Show browser notification if permission is granted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      })
    }
  }, [])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    )
  }, [])

  const clearNotification = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notif => notif.id !== notificationId)
    )
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const requestNotificationPermission = useCallback(async () => {
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return Notification.permission === 'granted'
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return {
    notifications,
    unreadCount,
    connectionStatus,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    requestNotificationPermission,
    isConnected: connectionStatus === 'connected'
  }
}

// Hook for streak-specific real-time updates
export function useStreakRealtime(streakId: string) {
  const [events, setEvents] = useState<RealtimeEvent[]>([])
  const [subscription, setSubscription] = useState<RealtimeSubscription | null>(null)

  useEffect(() => {
    if (!streakId) return

    const sub = realtimeService.subscribeToStreakEvents(streakId, (event: RealtimeEvent) => {
      setEvents(prev => [event, ...prev.slice(0, 19)]) // Keep last 20 events
    })

    setSubscription(sub)

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [streakId])

  return {
    events,
    isConnected: subscription ? realtimeService.getConnectionStatus() === 'connected' : false
  }
}

// Hook for analytics real-time updates
export function useAnalyticsRealtime(userId: string) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [subscription, setSubscription] = useState<RealtimeSubscription | null>(null)

  useEffect(() => {
    if (!userId) return

    const sub = realtimeService.subscribeToAnalyticsUpdates(userId, (event: RealtimeEvent) => {
      setIsUpdating(true)
      // Trigger analytics refresh
      setTimeout(() => setIsUpdating(false), 1000)
    })

    setSubscription(sub)

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [userId])

  return {
    isUpdating,
    isConnected: subscription ? realtimeService.getConnectionStatus() === 'connected' : false
  }
}
