'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Flame, Users, Trophy, Calendar, Settings, Plus } from 'lucide-react'
import Link from 'next/link'
import { UserStreak, Streak } from '@/types/database'

export default function ProfilePage() {
  const [userStreaks, setUserStreaks] = useState<UserStreak[]>([])
  const [createdStreaks, setCreatedStreaks] = useState<Streak[]>([])
  const [loading, setLoading] = useState(true)

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockUserStreaks: UserStreak[] = [
      {
        id: '1',
        user_id: 'current_user',
        streak_id: 'streak_1',
        current_streak_days: 7,
        longest_streak_days: 15,
        last_checkin_date: '2024-01-07',
        joined_at: '2024-01-01T00:00:00Z',
        is_active: true,
        streaks: {
          id: 'streak_1',
          title: 'No Social Media',
          description: 'Stay focused by avoiding social media platforms',
          category: 'Productivity',
          is_public: true,
          created_by: 'user1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          tags: ['productivity', 'focus'],
          is_active: true
        }
      },
      {
        id: '2',
        user_id: 'current_user',
        streak_id: 'streak_2',
        current_streak_days: 3,
        longest_streak_days: 10,
        last_checkin_date: '2024-01-07',
        joined_at: '2024-01-05T00:00:00Z',
        is_active: true,
        streaks: {
          id: 'streak_2',
          title: 'Daily Exercise',
          description: 'Exercise for at least 30 minutes every day',
          category: 'Health & Fitness',
          is_public: true,
          created_by: 'user2',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          tags: ['fitness', 'health'],
          is_active: true
        }
      }
    ]

    const mockCreatedStreaks: Streak[] = [
      {
        id: 'streak_3',
        title: 'Read 1 Hour Daily',
        description: 'Read books for at least 1 hour every day',
        category: 'Learning & Education',
        is_public: true,
        created_by: 'current_user',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
        tags: ['reading', 'learning'],
        is_active: true,
        _count: { user_streaks: 45 }
      }
    ]

    setTimeout(() => {
      setUserStreaks(mockUserStreaks)
      setCreatedStreaks(mockCreatedStreaks)
      setLoading(false)
    }, 1000)
  }, [])

  const totalCurrentStreaks = userStreaks.reduce((sum, streak) => sum + streak.current_streak_days, 0)
  const totalLongestStreaks = userStreaks.reduce((sum, streak) => sum + streak.longest_streak_days, 0)
  const activeStreaks = userStreaks.filter(streak => streak.is_active).length

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      {/* Profile Header */}
      <div className="mb-8">
        <div className="flex items-center gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src="" />
            <AvatarFallback className="text-2xl">JD</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">John Doe</h1>
            <p className="text-gray-600 mb-4">@johndoe • Member since January 2024</p>
            <div className="flex gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Flame className="h-4 w-4 mr-1" />
                {activeStreaks} active streaks
              </div>
              <div className="flex items-center">
                <Trophy className="h-4 w-4 mr-1" />
                {createdStreaks.length} created
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/settings">
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
            <Link href="/create">
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create Streak
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <div className="text-2xl font-bold text-blue-600">{totalCurrentStreaks}</div>
                <div className="text-sm text-gray-600">Total Current Days</div>
              </div>
              <Flame className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <div className="text-2xl font-bold text-green-600">{totalLongestStreaks}</div>
                <div className="text-sm text-gray-600">Total Longest Days</div>
              </div>
              <Trophy className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <div className="text-2xl font-bold text-purple-600">{activeStreaks}</div>
                <div className="text-sm text-gray-600">Active Streaks</div>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <div className="text-2xl font-bold text-orange-600">{createdStreaks.length}</div>
                <div className="text-sm text-gray-600">Created Streaks</div>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="joined" className="space-y-6">
        <TabsList>
          <TabsTrigger value="joined">Joined Streaks</TabsTrigger>
          <TabsTrigger value="created">Created Streaks</TabsTrigger>
        </TabsList>

        <TabsContent value="joined" className="space-y-4">
          {userStreaks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Flame className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No streaks yet</h3>
                <p className="text-gray-600 mb-4">Start your journey by joining a streak!</p>
                <Link href="/explore">
                  <Button>
                    <Flame className="mr-2 h-4 w-4" />
                    Explore Streaks
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userStreaks.map((userStreak) => (
                <Card key={userStreak.id} className="hover:shadow-lg transition-shadow h-full flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{userStreak.streaks?.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {userStreak.streaks?.description}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {userStreak.streaks?.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1 flex flex-col justify-end">
                    <div className="flex justify-between text-sm">
                      <div>
                        <span className="text-gray-600">Current:</span>
                        <span className="ml-1 font-medium text-blue-600">
                          {userStreak.current_streak_days} days
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Longest:</span>
                        <span className="ml-1 font-medium text-green-600">
                          {userStreak.longest_streak_days} days
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/streaks/${userStreak.streak_id}`} className="flex-1">
                        <Button className="w-full">
                          <Flame className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="created" className="space-y-4">
          {createdStreaks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No streaks created yet</h3>
                <p className="text-gray-600 mb-4">Be the first to create a streak!</p>
                <Link href="/create">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Streak
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {createdStreaks.map((streak) => (
                <Card key={streak.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{streak.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {streak.description}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {streak.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-gray-400" />
                        {streak._count?.user_streaks || 0} participants
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {new Date(streak.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/streaks/${streak.id}`} className="flex-1">
                        <Button className="w-full">
                          <Flame className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
