'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Heart, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { motion } from 'framer-motion'

interface LikesButtonProps {
  streakId: string
  initialLikes?: number
  initialLiked?: boolean
}

export function LikesButton({ streakId, initialLikes = 0, initialLiked = false }: LikesButtonProps) {
  const [likes, setLikes] = useState(initialLikes)
  const [liked, setLiked] = useState(initialLiked)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchUser()
    fetchLikes()
  }, [streakId])

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchLikes = async () => {
    try {
      const response = await fetch(`/api/likes?streak_id=${streakId}`)
      const result = await response.json()

      if (response.ok) {
        setLikes(result.likeCount || 0)
        setLiked(result.liked || false)
      } else {
        console.error('Error fetching likes:', result.error)
      }
    } catch (error) {
      console.error('Error fetching likes:', error)
    }
  }

  const handleLike = async () => {
    if (!user) return

    setLoading(true)
    try {
      if (liked) {
        // Unlike
        const response = await fetch(`/api/likes?streak_id=${streakId}`, {
          method: 'DELETE'
        })
        const result = await response.json()

        if (response.ok) {
          setLiked(false)
          setLikes(result.likeCount || 0)
        } else {
          console.error('Error unliking:', result.error)
        }
      } else {
        // Like
        const response = await fetch('/api/likes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            streak_id: streakId,
          })
        })
        const result = await response.json()

        if (response.ok) {
          setLiked(true)
          setLikes(result.likeCount || 0)
        } else {
          console.error('Error liking:', result.error)
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLike}
        disabled={loading || !user}
        className={`flex items-center gap-2 transition-colors ${
          liked 
            ? 'text-red-600 hover:text-red-700' 
            : 'text-gray-600 hover:text-red-600'
        }`}
      >
        <motion.div
          animate={liked ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
        </motion.div>
        <span className="text-sm">{likes}</span>
      </Button>
    </motion.div>
  )
}

interface StreakStatsProps {
  streakId: string
  participantCount?: number
}

export function StreakStats({ streakId, participantCount = 0 }: StreakStatsProps) {
  return (
    <div className="flex items-center gap-4 text-sm text-gray-600">
      <div className="flex items-center gap-1">
        <Users className="h-4 w-4" />
        <span>{participantCount} participants</span>
      </div>
      <LikesButton streakId={streakId} />
    </div>
  )
}
