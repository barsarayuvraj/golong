'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Flame, Users, Calendar, Search, Filter, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { ReportDialog } from './report-dialog'
import { QuickShareButtons } from './social-share'
import { useInfinitePopularStreaks } from '@/hooks/useApi'
import { useRouter } from 'next/navigation'

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

export default function ExploreStreaks() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('created_at')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [showClosestMatches, setShowClosestMatches] = useState(false)
  
  const router = useRouter()
  const observerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

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
    loadMore 
  } = useInfinitePopularStreaks(hookParams)

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

  // Handle join streak functionality
  const handleJoinStreak = useCallback(async (streakId: string) => {
    try {
      router.push(`/streaks/${streakId}`)
    } catch (error) {
      console.error('Error joining streak:', error)
    }
  }, [router])

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
        {streaks.map((streak: PopularStreak) => (
          <Card key={streak.id} className="hover:shadow-lg transition-shadow h-full flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-1">{streak.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {streak.description}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Badge variant="secondary">
                    {streak.category}
                  </Badge>
                  <ReportDialog streakId={streak.id} streakTitle={streak.title} />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col justify-end">
              <div className="space-y-3">
                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {streak.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                  {streak.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{streak.tags.length - 3} more
                    </Badge>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{streak.participant_count} participants</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(streak.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link href={`/streaks/${streak.id}`} className="flex-1">
                    <Button className="w-full">
                      <Flame className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleJoinStreak(streak.id)
                    }}
                  >
                    {streak.hasJoined ? 'View Progress' : 'Join'}
                  </Button>
                </div>

                {/* Social Share */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-gray-500">Share this streak:</span>
                  <QuickShareButtons streak={streak} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
