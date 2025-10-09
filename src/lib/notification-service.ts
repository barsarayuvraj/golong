'use client'

import { createClient } from '@/lib/supabase-client'

export interface NotificationData {
  user_id: string
  type: 'streak_reminder' | 'milestone' | 'comment' | 'like' | 'follow'
  title: string
  message: string
  data?: any
}

export class NotificationService {
  private supabase = createClient()

  async createNotification(notification: NotificationData) {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .insert(notification)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error creating notification:', error)
      return { success: false, error }
    }
  }

  async createStreakReminder(userId: string, streakTitle: string) {
    return this.createNotification({
      user_id: userId,
      type: 'streak_reminder',
      title: 'Streak Reminder',
      message: `Don't forget to check in for "${streakTitle}" today!`,
      data: { streak_title: streakTitle }
    })
  }

  async createMilestoneNotification(userId: string, streakTitle: string, days: number) {
    return this.createNotification({
      user_id: userId,
      type: 'milestone',
      title: 'Milestone Achieved! 🎉',
      message: `Congratulations! You've reached ${days} days on "${streakTitle}"!`,
      data: { streak_title: streakTitle, days }
    })
  }

  async createCommentNotification(userId: string, streakTitle: string, commenterUsername: string) {
    return this.createNotification({
      user_id: userId,
      type: 'comment',
      title: 'New Comment',
      message: `${commenterUsername} commented on "${streakTitle}"`,
      data: { streak_title: streakTitle, commenter: commenterUsername }
    })
  }

  async createLikeNotification(userId: string, streakTitle: string, likerUsername: string) {
    return this.createNotification({
      user_id: userId,
      type: 'like',
      title: 'New Like',
      message: `${likerUsername} liked "${streakTitle}"`,
      data: { streak_title: streakTitle, liker: likerUsername }
    })
  }

  async markAsRead(notificationId: string) {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return { success: false, error }
    }
  }

  async markAllAsRead(userId: string) {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      return { success: false, error }
    }
  }

  async getUnreadCount(userId: string) {
    try {
      const { count, error } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) throw error
      return { success: true, count: count || 0 }
    } catch (error) {
      console.error('Error getting unread count:', error)
      return { success: false, error, count: 0 }
    }
  }
}

// Singleton instance
export const notificationService = new NotificationService()
