import { createClient } from './supabase-client'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface RealtimeEvent {
  type: 'achievement' | 'checkin' | 'comment' | 'like' | 'notification'
  data: any
  timestamp: string
}

export interface RealtimeSubscription {
  channel: RealtimeChannel
  unsubscribe: () => void
}

class RealtimeService {
  private supabase = createClient()
  private channels: Map<string, RealtimeSubscription> = new Map()
  private eventHandlers: Map<string, ((event: RealtimeEvent) => void)[]> = new Map()

  // Subscribe to user-specific events
  subscribeToUserEvents(userId: string, onEvent: (event: RealtimeEvent) => void): RealtimeSubscription {
    const channelName = `user:${userId}`
    
    if (this.channels.has(channelName)) {
      // Add handler to existing channel
      this.addEventHandler(channelName, onEvent)
      return this.channels.get(channelName)!
    }

    const channel = this.supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_achievements',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        this.handleEvent({
          type: 'achievement',
          data: payload.new,
          timestamp: new Date().toISOString()
        })
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'checkins',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        this.handleEvent({
          type: 'checkin',
          data: payload.new,
          timestamp: new Date().toISOString()
        })
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        this.handleEvent({
          type: 'notification',
          data: payload.new,
          timestamp: new Date().toISOString()
        })
      })
      .subscribe()

    const subscription: RealtimeSubscription = {
      channel,
      unsubscribe: () => {
        this.removeEventHandler(channelName, onEvent)
        if (this.eventHandlers.get(channelName)?.length === 0) {
          this.supabase.removeChannel(channel)
          this.channels.delete(channelName)
        }
      }
    }

    this.channels.set(channelName, subscription)
    this.addEventHandler(channelName, onEvent)

    return subscription
  }

  // Subscribe to streak-specific events (comments, likes)
  subscribeToStreakEvents(streakId: string, onEvent: (event: RealtimeEvent) => void): RealtimeSubscription {
    const channelName = `streak:${streakId}`
    
    if (this.channels.has(channelName)) {
      this.addEventHandler(channelName, onEvent)
      return this.channels.get(channelName)!
    }

    const channel = this.supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `streak_id=eq.${streakId}`
      }, (payload) => {
        this.handleEvent({
          type: 'comment',
          data: payload.new,
          timestamp: new Date().toISOString()
        })
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'likes',
        filter: `streak_id=eq.${streakId}`
      }, (payload) => {
        this.handleEvent({
          type: 'like',
          data: payload.new,
          timestamp: new Date().toISOString()
        })
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'likes',
        filter: `streak_id=eq.${streakId}`
      }, (payload) => {
        this.handleEvent({
          type: 'like',
          data: { ...payload.old, deleted: true },
          timestamp: new Date().toISOString()
        })
      })
      .subscribe()

    const subscription: RealtimeSubscription = {
      channel,
      unsubscribe: () => {
        this.removeEventHandler(channelName, onEvent)
        if (this.eventHandlers.get(channelName)?.length === 0) {
          this.supabase.removeChannel(channel)
          this.channels.delete(channelName)
        }
      }
    }

    this.channels.set(channelName, subscription)
    this.addEventHandler(channelName, onEvent)

    return subscription
  }

  // Subscribe to global activity feed
  subscribeToGlobalActivity(onEvent: (event: RealtimeEvent) => void): RealtimeSubscription {
    const channelName = 'global:activity'
    
    if (this.channels.has(channelName)) {
      this.addEventHandler(channelName, onEvent)
      return this.channels.get(channelName)!
    }

    const channel = this.supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_achievements'
      }, (payload) => {
        this.handleEvent({
          type: 'achievement',
          data: payload.new,
          timestamp: new Date().toISOString()
        })
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'checkins'
      }, (payload) => {
        this.handleEvent({
          type: 'checkin',
          data: payload.new,
          timestamp: new Date().toISOString()
        })
      })
      .subscribe()

    const subscription: RealtimeSubscription = {
      channel,
      unsubscribe: () => {
        this.removeEventHandler(channelName, onEvent)
        if (this.eventHandlers.get(channelName)?.length === 0) {
          this.supabase.removeChannel(channel)
          this.channels.delete(channelName)
        }
      }
    }

    this.channels.set(channelName, subscription)
    this.addEventHandler(channelName, onEvent)

    return subscription
  }

  // Subscribe to analytics updates
  subscribeToAnalyticsUpdates(userId: string, onEvent: (event: RealtimeEvent) => void): RealtimeSubscription {
    const channelName = `analytics:${userId}`
    
    if (this.channels.has(channelName)) {
      this.addEventHandler(channelName, onEvent)
      return this.channels.get(channelName)!
    }

    const channel = this.supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_streaks',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        this.handleEvent({
          type: 'checkin',
          data: payload,
          timestamp: new Date().toISOString()
        })
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'checkins',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        this.handleEvent({
          type: 'checkin',
          data: payload,
          timestamp: new Date().toISOString()
        })
      })
      .subscribe()

    const subscription: RealtimeSubscription = {
      channel,
      unsubscribe: () => {
        this.removeEventHandler(channelName, onEvent)
        if (this.eventHandlers.get(channelName)?.length === 0) {
          this.supabase.removeChannel(channel)
          this.channels.delete(channelName)
        }
      }
    }

    this.channels.set(channelName, subscription)
    this.addEventHandler(channelName, onEvent)

    return subscription
  }

  private addEventHandler(channelName: string, handler: (event: RealtimeEvent) => void) {
    if (!this.eventHandlers.has(channelName)) {
      this.eventHandlers.set(channelName, [])
    }
    this.eventHandlers.get(channelName)!.push(handler)
  }

  private removeEventHandler(channelName: string, handler: (event: RealtimeEvent) => void) {
    const handlers = this.eventHandlers.get(channelName)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  private handleEvent(event: RealtimeEvent) {
    const channelName = this.getChannelNameForEvent(event)
    const handlers = this.eventHandlers.get(channelName)
    if (handlers) {
      handlers.forEach(handler => handler(event))
    }
  }

  private getChannelNameForEvent(event: RealtimeEvent): string {
    // This is a simplified mapping - in practice, you'd need more sophisticated logic
    if (event.type === 'achievement' || event.type === 'notification') {
      return `user:${event.data.user_id}`
    } else if (event.type === 'comment' || event.type === 'like') {
      return `streak:${event.data.streak_id}`
    }
    return 'global:activity'
  }

  // Clean up all subscriptions
  cleanup() {
    this.channels.forEach(subscription => {
      this.supabase.removeChannel(subscription.channel)
    })
    this.channels.clear()
    this.eventHandlers.clear()
  }

  // Get connection status
  getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' {
    const channel = Array.from(this.channels.values())[0]?.channel
    if (!channel) return 'disconnected'
    
    const state = channel.state
    switch (state) {
      case 'joined':
        return 'connected'
      case 'joining':
        return 'connecting'
      default:
        return 'disconnected'
    }
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService()

// React hook for real-time updates
export function useRealtime() {
  return realtimeService
}
