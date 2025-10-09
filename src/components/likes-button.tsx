'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Heart, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { motion } from 'framer-motion'
import { useLikes, useCreateLike, useDeleteLike } from '@/hooks/useApi'
import { toast } from 'sonner'

interface LikesButtonProps {
  streakId: string
  initialLikes?: number
  initialLiked?: boolean
}

export function LikesButton({ streakId, initialLikes = 0, initialLiked = false }: LikesButtonProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null)

  const supabase = createClient()
  
  // Use our custom hooks
  const { data: likesData, loading, error, refetch } = useLikes(streakId, { check_user_like: true })
  const { createLike, loading: creatingLike } = useCreateLike()
  const { deleteLike, loading: deletingLike } = useDeleteLike()
  
  const likes = likesData?.count || 0
  const liked = likesData?.user_liked || false
  const isLoading = creatingLike || deletingLike

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const handleLike = async () => {
    if (!user) return

    try {
      if (liked) {
        // Unlike
        await deleteLike(streakId)
        toast.success('Unliked!')
      } else {
        // Like
        await createLike({ streak_id: streakId })
        toast.success('Liked!')
      }
      refetch() // Refresh likes data
    } catch (error) {
      toast.error('Failed to update like. Please try again.')
      console.error('Error toggling like:', error)
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
        disabled={isLoading || !user}
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
