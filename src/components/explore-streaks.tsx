'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Flame, Users, Calendar, Search, Filter, MoreVertical, X, Star, TrendingUp, Clock, Target } from 'lucide-react'
import Link from 'next/link'
import { Streak } from '@/types/database'
import { ReportDialog } from './report-dialog'
import { StreakStats } from './likes-button'
import { QuickShareButtons } from './social-share'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

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
  { value: 'title', label: 'Alphabetical' },
]

export default function ExploreStreaks() {
  const [streaks, setStreaks] = useState<Streak[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('created_at')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [minParticipants, setMinParticipants] = useState([0])
  const [maxParticipants, setMaxParticipants] = useState([1000])
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all')
  const [difficultyLevel, setDifficultyLevel] = useState<'all' | 'easy' | 'medium' | 'hard'>('all')
  const [trendingOnly, setTrendingOnly] = useState(false)

  // Mock data for now - replace with actual API call
  useEffect(() => {
    const mockStreaks: Streak[] = [
      {
        id: '1',
        title: 'No Social Media',
        description: 'Stay focused by avoiding social media platforms',
        category: 'Productivity',
        is_public: true,
        created_by: 'user1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        tags: ['productivity', 'focus', 'digital-detox'],
        is_active: true,
        _count: { user_streaks: 1247 }
      },
      {
        id: '2',
        title: 'Daily Exercise',
        description: 'Exercise for at least 30 minutes every day',
        category: 'Health & Fitness',
        is_public: true,
        created_by: 'user2',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        tags: ['fitness', 'health', 'daily'],
        is_active: true,
        _count: { user_streaks: 892 }
      },
      {
        id: '3',
        title: 'Read 1 Hour Daily',
        description: 'Read books for at least 1 hour every day',
        category: 'Learning & Education',
        is_public: true,
        created_by: 'user3',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
        tags: ['reading', 'learning', 'daily'],
        is_active: true,
        _count: { user_streaks: 654 }
      },
      {
        id: '4',
        title: 'No Soda',
        description: 'Avoid drinking soda and sugary drinks',
        category: 'Health & Fitness',
        is_public: true,
        created_by: 'user4',
        created_at: '2024-01-04T00:00:00Z',
        updated_at: '2024-01-04T00:00:00Z',
        tags: ['health', 'no-sugar', 'hydration'],
        is_active: true,
        _count: { user_streaks: 432 }
      },
      {
        id: '5',
        title: 'Meditate Daily',
        description: 'Practice meditation for at least 10 minutes daily',
        category: 'Mindfulness & Wellness',
        is_public: true,
        created_by: 'user5',
        created_at: '2024-01-05T00:00:00Z',
        updated_at: '2024-01-05T00:00:00Z',
        tags: ['meditation', 'mindfulness', 'daily'],
        is_active: true,
        _count: { user_streaks: 789 }
      },
      {
        id: '6',
        title: 'Learn Spanish',
        description: 'Study Spanish for 30 minutes every day',
        category: 'Learning & Education',
        is_public: true,
        created_by: 'user6',
        created_at: '2024-01-06T00:00:00Z',
        updated_at: '2024-01-06T00:00:00Z',
        tags: ['language', 'spanish', 'learning'],
        is_active: true,
        _count: { user_streaks: 321 }
      },
    ]

    setTimeout(() => {
      setStreaks(mockStreaks)
      setLoading(false)
    }, 1000)
  }, [])

  // Get all unique tags from streaks
  const allTags = Array.from(new Set(streaks.flatMap(streak => streak.tags)))

  // Enhanced filtering logic
  const filteredStreaks = streaks.filter(streak => {
    // Search term filter
    const matchesSearch = searchTerm === '' || 
      streak.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      streak.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      streak.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // Category filter
    const matchesCategory = selectedCategory === 'All' || streak.category === selectedCategory
    
    // Tag filter
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => streak.tags.includes(tag))
    
    // Participant count filter
    const participantCount = streak._count?.user_streaks || 0
    const matchesParticipants = participantCount >= minParticipants[0] && 
      participantCount <= maxParticipants[0]
    
    // Date range filter
    const streakDate = new Date(streak.created_at)
    const now = new Date()
    let matchesDateRange = true
    
    switch (dateRange) {
      case 'today':
        matchesDateRange = streakDate.toDateString() === now.toDateString()
        break
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        matchesDateRange = streakDate >= weekAgo
        break
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        matchesDateRange = streakDate >= monthAgo
        break
      case 'year':
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        matchesDateRange = streakDate >= yearAgo
        break
    }
    
    // Difficulty level filter (based on streak duration or complexity)
    let matchesDifficulty = true
    if (difficultyLevel !== 'all') {
      const duration = streak.suggested_duration || 30
      switch (difficultyLevel) {
        case 'easy':
          matchesDifficulty = duration <= 7
          break
        case 'medium':
          matchesDifficulty = duration > 7 && duration <= 30
          break
        case 'hard':
          matchesDifficulty = duration > 30
          break
      }
    }
    
    // Trending filter (streaks with high growth rate)
    const matchesTrending = !trendingOnly || (streak._count?.user_streaks || 0) > 10
    
    return matchesSearch && matchesCategory && matchesTags && 
           matchesParticipants && matchesDateRange && 
           matchesDifficulty && matchesTrending
  })

  const sortedStreaks = [...filteredStreaks].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title)
      case 'popularity':
        return (b._count?.user_streaks || 0) - (a._count?.user_streaks || 0)
      case 'trending':
        // Sort by growth rate (recent activity)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'created_at':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  if (loading) {
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
                placeholder="Search streaks, tags, or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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

          <Select value={sortBy} onValueChange={setSortBy}>
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

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 rounded-lg p-4 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Tags Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Tags</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {allTags.slice(0, 10).map(tag => (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={tag}
                        checked={selectedTags.includes(tag)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTags([...selectedTags, tag])
                          } else {
                            setSelectedTags(selectedTags.filter(t => t !== tag))
                          }
                        }}
                      />
                      <label htmlFor={tag} className="text-sm">
                        #{tag}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedTags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTags([])}
                    className="mt-2 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear tags
                  </Button>
                )}
              </div>

              {/* Participant Count */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Participants: {minParticipants[0]} - {maxParticipants[0]}
                </label>
                <div className="space-y-2">
                  <Slider
                    value={minParticipants}
                    onValueChange={setMinParticipants}
                    max={1000}
                    step={10}
                    className="w-full"
                  />
                  <Slider
                    value={maxParticipants}
                    onValueChange={setMaxParticipants}
                    max={1000}
                    step={10}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="text-sm font-medium mb-2 block">Created</label>
                <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty Level */}
              <div>
                <label className="text-sm font-medium mb-2 block">Difficulty</label>
                <Select value={difficultyLevel} onValueChange={(value: any) => setDifficultyLevel(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="easy">Easy (≤7 days)</SelectItem>
                    <SelectItem value="medium">Medium (8-30 days)</SelectItem>
                    <SelectItem value="hard">Hard (30+ days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={trendingOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setTrendingOnly(!trendingOnly)}
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Trending Only
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('All')
                  setSelectedTags([])
                  setMinParticipants([0])
                  setMaxParticipants([1000])
                  setDateRange('all')
                  setDifficultyLevel('all')
                  setTrendingOnly(false)
                }}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear All
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Results */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {sortedStreaks.length} streak{sortedStreaks.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Streaks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedStreaks.map((streak) => (
          <Card key={streak.id} className="hover:shadow-lg transition-shadow">
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
            
            <CardContent>
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
                <StreakStats 
                  streakId={streak.id} 
                  participantCount={streak._count?.user_streaks || 0}
                />

                {/* Actions */}
                <div className="flex gap-2">
                  <Link href={`/streaks/${streak.id}`} className="flex-1">
                    <Button className="w-full">
                      <Flame className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm">
                    Join
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

      {sortedStreaks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Flame className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No streaks found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCategory !== 'All' 
              ? 'Try adjusting your search or filters'
              : 'Be the first to create a streak!'
            }
          </p>
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
