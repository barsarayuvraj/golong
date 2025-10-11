'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Flame, Users, Calendar, CheckCircle, Plus, Trophy, Target } from 'lucide-react'
import Link from 'next/link'
import { Streak, UserStreak, LeaderboardEntry } from '@/types/database'
import { CommentsSection } from './comments-section'
import { SocialShare } from './social-share'
import { StreakCalendar } from './streak-calendar'
import { StreakInsights } from './streak-insights'
import { useStreak, useJoinStreak, useCreateCheckin, useCheckins, useLeaderboard, useStreakStats } from '@/hooks/useApi'
import { toast } from 'sonner'

export default function StreakDetailPage() {
  const params = useParams()
  const streakId = params.id as string
  
  // Use our custom hooks for API calls
  const { data: streakData, loading: streakLoading, error: streakError, refetch: refetchStreak } = useStreak(streakId)
  const { data: checkinsData, loading: checkinsLoading, refetch: refetchCheckins } = useCheckins({ streak_id: streakId })
  const { joinStreak, loading: joining } = useJoinStreak()
  const { createCheckin, loading: checkingIn } = useCreateCheckin()
  const { data: leaderboardData, loading: leaderboardLoading } = useLeaderboard(streakId)
  const { data: statsData, loading: statsLoading } = useStreakStats(streakId)
  
  // Extract streak and user streak data
  const streak = streakData?.streak || null
  const userStreak = streakData?.user_streak || null

  // Extract leaderboard and stats data
  const leaderboard = leaderboardData?.leaderboard || []
  const stats = statsData?.stats || null

  const handleJoinStreak = async () => {
    try {
      await joinStreak(streakId)
      toast.success('Successfully joined the streak!')
      // Refetch streak data to get updated user_streak information
      await refetchStreak()
      await refetchCheckins()
    } catch (error) {
      toast.error('Failed to join streak. Please try again.')
      console.error('Failed to join streak:', error)
    }
  }

  const handleCheckIn = async () => {
    if (!userStreak) return
    
    try {
      await createCheckin({
        user_streak_id: userStreak.id,
        checkin_date: new Date().toISOString().split('T')[0]
      })
      
      toast.success('Check-in successful!')
      // Refetch checkins and streak data
      refetchCheckins()
    } catch (error: any) {
      // Handle specific error cases
      if (error.message?.includes('Checkin already exists for this date')) {
        toast.error('You have already checked in today!')
        // Refetch data to update UI state
        refetchCheckins()
      } else {
        toast.error('Failed to check in. Please try again.')
        console.error('Failed to check in:', error)
      }
    }
  }

  const canCheckIn = () => {
    if (!userStreak) return false
    const today = new Date().toISOString().split('T')[0]
    
    // Check if user already checked in today (from userStreak.last_checkin_date)
    if (userStreak.last_checkin_date === today) return false
    
    // Also check if there's a check-in for today in the checkins data
    const todayCheckin = checkinsData?.checkins?.find(
      checkin => checkin.checkin_date === today
    )
    if (todayCheckin) return false
    
    return true
  }

  if (streakLoading) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  if (streakError) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error loading streak</h1>
          <p className="text-gray-600 mb-4">Load failed</p>
          <div className="text-sm text-gray-500 mb-4">
            <p>Streak ID: {streakId}</p>
            <p>Error: {streakError}</p>
            <p>Please check the browser console for more details.</p>
          </div>
          <Link href="/explore">
            <Button>Back to Explore</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!streak) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Streak not found</h1>
          <Link href="/explore">
            <Button>Back to Explore</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{streak.title}</h1>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">{streak.category}</Badge>
              <span className="text-sm text-gray-600">
                Created by {streak.profiles?.display_name || streak.profiles?.username}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SocialShare streak={streak} />
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {statsLoading ? '... participants' : `${stats?.total_participants || 0} participants`}
              </span>
            </div>
          </div>
        </div>

        <p className="text-gray-700 mb-6">{streak.description}</p>

        <div className="flex flex-wrap gap-2 mb-6">
          {streak.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              #{tag}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Progress */}
          {userStreak && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="mr-2 h-5 w-5" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{userStreak.current_streak_days}</div>
                    <div className="text-sm text-gray-600">Current Streak</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{userStreak.longest_streak_days}</div>
                    <div className="text-sm text-gray-600">Longest Streak</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress to 30 days</span>
                    <span>{Math.min(100, (userStreak.current_streak_days / 30) * 100)}%</span>
                  </div>
                  <Progress value={Math.min(100, (userStreak.current_streak_days / 30) * 100)} />
                </div>

                {canCheckIn() && (
                  <Button onClick={handleCheckIn} disabled={checkingIn} className="w-full">
                    {checkingIn ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Checking in...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Check In Today
                      </>
                    )}
                  </Button>
                )}

                {!canCheckIn() && userStreak && (
                  <div className="text-center">
                    <Button disabled className="w-full bg-gray-100 text-gray-500 cursor-not-allowed">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Already Checked In Today
                    </Button>
                    <p className="text-green-600 text-sm mt-2">✅ Great job! Come back tomorrow.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Join Streak */}
          {!userStreak && (
            <Card>
              <CardHeader>
                <CardTitle>Join This Streak</CardTitle>
                <CardDescription>
                  Start your journey and track your progress alongside others
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleJoinStreak} disabled={joining} className="w-full">
                  {joining ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Joining...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Join Streak
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Activity Calendar */}
          <StreakCalendar 
            checkins={checkinsData?.checkins || []} 
            userStreakStartDate={userStreak?.joined_at ? userStreak.joined_at.split('T')[0] : undefined}
          />

          {/* Streak Insights */}
          {userStreak && (
            <StreakInsights 
              checkins={checkinsData?.checkins || []} 
              userStreak={userStreak}
            />
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { user: 'streak_master', action: 'checked in', time: '2 hours ago' },
                  { user: 'focused_user', action: 'joined the streak', time: '1 day ago' },
                  { user: 'digital_detoxer', action: 'checked in', time: '1 day ago' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {activity.user.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-gray-600">
                      <span className="font-medium">{activity.user}</span> {activity.action}
                    </span>
                    <span className="text-gray-400 ml-auto">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="mr-2 h-5 w-5" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <div key={entry.user_id} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-medium">
                      {index + 1}
                    </div>
                    {entry.user_id.startsWith('placeholder_') ? (
                      <>
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xs text-gray-400">-</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-400">-</div>
                          <div className="text-xs text-gray-400">- days</div>
                        </div>
                        <Flame className="h-4 w-4 text-gray-300" />
                      </>
                    ) : (
                      <>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {entry.display_name?.charAt(0) || entry.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {entry.display_name || entry.username}
                          </div>
                          <div className="text-xs text-gray-500">
                            {entry.current_streak_days} days
                          </div>
                        </div>
                        <Flame className="h-4 w-4 text-orange-500" />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Streak Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Streak Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Participants</span>
                <span className="font-medium">
                  {statsLoading ? '...' : (stats?.total_participants || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Average Streak</span>
                <span className="font-medium">
                  {statsLoading ? '...' : `${stats?.average_streak || 0} days`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Longest Streak</span>
                <span className="font-medium">
                  {statsLoading ? '...' : `${stats?.longest_streak || 0} days`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Created</span>
                <span className="font-medium">
                  {statsLoading ? '...' : (
                    stats?.created_at ? new Date(stats.created_at).toLocaleDateString() : 
                    streak?.created_at ? new Date(streak.created_at).toLocaleDateString() : 
                    '-'
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comments Section */}
        <div className="mt-8">
          <CommentsSection streakId={streakId} />
        </div>
      </div>
    </div>
  )
}
