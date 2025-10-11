'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Eye, UserPlus, Calendar, User, Loader2, CheckCircle } from 'lucide-react'
import { useInfinitePopularStreaks } from '@/hooks/useApi'
import { useJoinStreak } from '@/hooks/useApi'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface PopularStreak {
  id: string
  title: string
  description: string
  category: string
  created_at: string
  is_public: boolean
  participant_count: number
  hasJoined: boolean
  profiles: {
    id: string
    username: string
    display_name: string
    avatar_url: string
  }
}

interface PopularStreaksProps {
  currentUserId?: string
}

const colorClasses = [
  'bg-red-500',
  'bg-green-500', 
  'bg-blue-500',
  'bg-orange-500',
  'bg-purple-500',
  'bg-pink-500'
]

export function PopularStreaks({ currentUserId }: PopularStreaksProps) {
  const { streaks, loading, loadingMore, error, hasMore, loadMore } = useInfinitePopularStreaks(12)
  const { joinStreak, loading: joiningStreak } = useJoinStreak()
  const router = useRouter()
  const observerRef = useRef<HTMLDivElement>(null)
  
  const isAuthenticated = !!currentUserId

  const handleViewStreak = (streakId: string) => {
    router.push(`/streaks/${streakId}`)
  }

  const handleJoinStreak = async (streakId: string) => {
    if (!isAuthenticated) {
      router.push('/auth')
      return
    }
    
    try {
      await joinStreak(streakId)
      toast.success('Successfully joined the streak!')
      // Optionally refresh the data or redirect to the streak
      router.push(`/streaks/${streakId}`)
    } catch (error) {
      toast.error('Failed to join streak. Please try again.')
    }
  }

  // Infinite scroll observer
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loadingMore) return
    if (observerRef.current) observerRef.current.disconnect()
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore()
      }
    })
    
    if (node) observerRef.current.observe(node)
  }, [loadingMore, hasMore, loadMore])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <Card className="h-full">
              <div className="h-2 bg-gray-200 w-full" />
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-full mb-4" />
                <div className="h-8 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load popular streaks. Please try again later.</p>
      </div>
    )
  }

  if (streaks.length === 0 && !loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No public streaks available yet. Be the first to create one!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {streaks.map((streak, index) => {
        const isOwner = currentUserId === streak.profiles.id
        const colorClass = colorClasses[index % colorClasses.length]
        
        return (
          <motion.div
            key={streak.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            viewport={{ once: true }}
            whileHover={{ y: -8, scale: 1.02 }}
          >
            <Card 
              className="h-full hover:shadow-2xl transition-all duration-300 border-0 shadow-lg overflow-hidden group cursor-pointer"
              onClick={() => handleViewStreak(streak.id)}
            >
              <div className={`h-2 ${colorClass} w-full`} />
              <CardHeader>
                <CardTitle className="text-lg font-bold group-hover:text-blue-600 transition-colors cursor-pointer">
                  {streak.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="bg-gray-100">
                    {streak.category}
                  </Badge>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {streak.participant_count} participants
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {streak.description || 'Join others in this popular streak!'}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <User className="h-3 w-3" />
                    <span>by {streak.profiles.display_name || streak.profiles.username}</span>
                  </div>
                  
                  <motion.div className="mt-4 space-y-2">
                    {isOwner ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewStreak(streak.id)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Streak
                      </Button>
                    ) : streak.hasJoined ? (
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewStreak(streak.id)
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        View My Progress
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewStreak(streak.id)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleJoinStreak(streak.id)
                          }}
                          disabled={joiningStreak}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          {joiningStreak ? 'Joining...' : (isAuthenticated ? 'Join' : 'Sign In')}
                        </Button>
                      </div>
                    )}
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
      
      {/* Infinite scroll trigger and loading indicator */}
      {hasMore && (
        <div 
          ref={lastElementRef}
          className="col-span-full flex justify-center py-8"
        >
          {loadingMore ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading more streaks...</span>
            </div>
          ) : (
            <Button 
              variant="outline" 
              onClick={loadMore}
              className="text-sm"
            >
              Load More Streaks
            </Button>
          )}
        </div>
      )}
      
      {/* End of content indicator */}
      {!hasMore && streaks.length > 0 && (
        <div className="col-span-full text-center py-8">
          <p className="text-gray-500 text-sm">
            You've reached the end! No more public streaks to show.
          </p>
        </div>
      )}
    </div>
  )
}
