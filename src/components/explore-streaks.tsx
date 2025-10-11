'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Flame, Users, Calendar, Search, Filter, Loader2, Eye, UserPlus, User, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useInfinitePopularStreaks, useJoinStreak } from '@/hooks/useApi'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const STREAK_CATEGORIES = [
  'All',
  'Health & Fitness',
  'Learning & Education', 
  'Productivity',
  'Social & Relationships',
  'Creativity & Hobbies',
  'Finance & Career',
  'Mindfulness & Wellness',
  'Entertainment & Media',
  'Other'
]

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Newest' },
  { value: 'popularity', label: 'Most Popular' },
  { value: 'trending', label: 'Trending' },
  { value: 'title', label: 'Alphabetical' },
]

const colorClasses = [
  'bg-red-500',
  'bg-green-500', 
  'bg-blue-500',
  'bg-orange-500',
  'bg-purple-500',
  'bg-pink-500'
]

interface PopularStreak {
  id: string
  title: string
  description: string
  category: string
  created_at: string
  is_public: boolean
  tags: string[]
  participant_count: number
  hasJoined: boolean
  profiles: {
    id: string
    username: string
    display_name: string
    avatar_url?: string
  }
}

interface ExploreStreaksProps {
  currentUserId?: string
}

export default function ExploreStreaks({ currentUserId }: ExploreStreaksProps = {}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('created_at')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [showClosestMatches, setShowClosestMatches] = useState(false)
  const [joiningStreaks, setJoiningStreaks] = useState<Set<string>>(new Set())
  
  const router = useRouter()
  const observerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const isAuthenticated = !!currentUserId

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Memoize hook parameters to prevent unnecessary re-renders
  const hookParams = useMemo(() => ({
    search: debouncedSearchTerm,
    category: selectedCategory,
    sortBy: sortBy
  }), [debouncedSearchTerm, selectedCategory, sortBy])

  // Use the infinite popular streaks hook
  const { 
    streaks, 
    loading, 
    searchLoading,
    error, 
    hasMore, 
    loadMore,
    refetch
  } = useInfinitePopularStreaks(hookParams)

  // Use the join streak hook
  const { joinStreak } = useJoinStreak()

  // Intersection Observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loading, loadMore])

  // Handle view streak functionality
  const handleViewStreak = (streakId: string) => {
    router.push(`/streaks/${streakId}`)
  }

  // Handle join streak functionality
  const handleJoinStreak = useCallback(async (streakId: string) => {
    if (!isAuthenticated) {
      router.push('/auth')
      return
    }
    
    // Add this streak to the joining set
    setJoiningStreaks(prev => new Set(prev).add(streakId))
    
    try {
      await joinStreak(streakId)
      toast.success('Successfully joined the streak!')
      
      // Refresh the data to reflect the new join status
      await refetch()
    } catch (error) {
      console.error('Error joining streak:', error)
      toast.error('Failed to join streak. Please try again.')
    } finally {
      // Remove this streak from the joining set
      setJoiningStreaks(prev => {
        const newSet = new Set(prev)
        newSet.delete(streakId)
        return newSet
      })
    }
  }, [router, isAuthenticated, joinStreak, refetch])

  // Handle closest matches when no results found
  useEffect(() => {
    if (debouncedSearchTerm && streaks.length === 0 && !loading && !searchLoading) {
      setShowClosestMatches(true)
    } else {
      setShowClosestMatches(false)
    }
  }, [debouncedSearchTerm, streaks.length, loading, searchLoading])

  // Memoize search input handler
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [])

  // Memoize category change handler
  const handleCategoryChange = useCallback((value: string) => {
    setSelectedCategory(value)
  }, [])

  // Memoize sort change handler
  const handleSortChange = useCallback((value: string) => {
    setSortBy(value)
  }, [])

  // Show loading only for initial load, not for search/filter changes
  if (loading && streaks.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Streaks</h1>
        <p className="text-gray-600">Discover and join streaks created by the community</p>
      </div>

      {/* Enhanced Filters */}
      <div className="mb-6 space-y-4">
        {/* Main Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                ref={searchInputRef}
                placeholder="Search streaks, tags, or descriptions..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {STREAK_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Newest</SelectItem>
              <SelectItem value="popularity">Most Popular</SelectItem>
              <SelectItem value="trending">Trending</SelectItem>
              <SelectItem value="title">Alphabetical</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Advanced
          </Button>
        </div>

      </div>

      {/* Results */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {streaks.length} streak{streaks.length !== 1 ? 's' : ''} found
        </p>
        {searchLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Searching...</span>
          </div>
        )}
      </div>

      {/* Streaks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {streaks.map((streak: PopularStreak, index) => {
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
                            disabled={joiningStreaks.has(streak.id)}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            {joiningStreaks.has(streak.id) ? 'Joining...' : (isAuthenticated ? 'Join' : 'Sign In')}
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
      </div>

      {/* Infinite Scroll Loading */}
      {hasMore && (
        <div ref={observerRef} className="flex justify-center py-8">
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading more streaks...</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {streaks.length === 0 && !loading && !searchLoading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Flame className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {showClosestMatches ? 'No exact matches found' : 'No streaks found'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCategory !== 'All' 
              ? showClosestMatches 
                ? 'Try searching for something else or browse all categories'
                : 'Try adjusting your search or filters'
              : 'Be the first to create a streak!'
            }
          </p>
          {showClosestMatches && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Try these popular searches:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {['fitness', 'reading', 'meditation', 'coding', 'language'].map(term => (
                  <Button
                    key={term}
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchTerm(term)}
                    className="text-xs"
                  >
                    {term}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <Link href="/create">
            <Button>
              <Flame className="mr-2 h-4 w-4" />
              Create First Streak
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
