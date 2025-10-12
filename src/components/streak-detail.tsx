'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Flame, Users, Calendar, CheckCircle, Plus, Trophy, Target, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'
import { Streak, UserStreak, LeaderboardEntry } from '@/types/database'
import { CommentsSection } from './comments-section'
import { NotesSection } from './notes-section'
import { SocialShare } from './social-share'
import { StreakCalendar } from './streak-calendar'
import { StreakInsights } from './streak-insights'
import { useStreak, useJoinStreak, useCreateCheckin, useCheckins, useLeaderboard, useStreakStats, useRecentActivity } from '@/hooks/useApi'
import { toast } from 'sonner'

export default function StreakDetailPage() {
  const params = useParams()
  const streakId = params.id as string
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [leavingStreak, setLeavingStreak] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingStreak, setDeletingStreak] = useState(false)
  
  // Use our custom hooks for API calls
  const { data: streakData, loading: streakLoading, error: streakError, refetch: refetchStreak } = useStreak(streakId)
  const { data: checkinsData, loading: checkinsLoading, refetch: refetchCheckins } = useCheckins({ streak_id: streakId })
  const { joinStreak, loading: joining } = useJoinStreak()
  const { createCheckin, loading: checkingIn } = useCreateCheckin()
  const { data: leaderboardData, loading: leaderboardLoading } = useLeaderboard(streakId)
  const { data: statsData, loading: statsLoading } = useStreakStats(streakId)
  const { data: recentActivityData, loading: recentActivityLoading, refetch: refetchRecentActivity } = useRecentActivity(streakId)
  
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
      refetchRecentActivity() // Update recent activity feed
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
      refetchRecentActivity() // Update recent activity feed
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

  const handleLeaveStreak = async () => {
    if (!userStreak) return
    
    setLeavingStreak(true)
    try {
      const response = await fetch(`/api/streaks/${streakId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to leave streak')
      }

      toast.success('You have successfully left the streak')
      setShowLeaveDialog(false)
      
      // Simple redirect with hard reload
      setTimeout(() => {
        window.location.href = '/my-streaks'
      }, 1000)
    } catch (error: any) {
      toast.error(error.message || 'Failed to leave streak. Please try again.')
      console.error('Failed to leave streak:', error)
    } finally {
      setLeavingStreak(false)
    }
  }

  const handleDeleteStreak = async () => {
    setDeletingStreak(true)
    try {
      const response = await fetch(`/api/streaks/${streakId}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete streak')
      }

      toast.success('Streak deleted successfully')
      setShowDeleteDialog(false)
      
      // Simple redirect with hard reload
      setTimeout(() => {
        window.location.href = '/my-streaks'
      }, 1000)
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete streak. Please try again.')
      console.error('Failed to delete streak:', error)
    } finally {
      setDeletingStreak(false)
    }
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
                {streak?.is_public ? (
                  statsLoading ? '... participants' : `${stats?.total_participants || 0} participants`
                ) : (
                  'Private'
                )}
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
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Target className="mr-2 h-5 w-5" />
                    Your Progress
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Settings className="h-4 w-4" />
                        <span className="sr-only">Streak options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!streak?.is_public && streak?.created_by === userStreak?.user_id ? (
                        <DropdownMenuItem 
                          onClick={() => setShowDeleteDialog(true)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Delete Streak
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          onClick={() => setShowLeaveDialog(true)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Leave Streak
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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

        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Leaderboard - Only show for public streaks */}
          {streak?.is_public && (
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
          )}

          {/* Streak Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Streak Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {streak?.is_public ? (
                // Public streak stats
                <>
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
                </>
              ) : (
                // Private streak stats (Progress Focus)
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Days Active</span>
                    <span className="font-medium">
                      {checkinsLoading ? '...' : (checkinsData?.checkins?.length || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Consistency Rate</span>
                    <span className="font-medium">
                      {checkinsLoading ? '...' : (
                        streak?.created_at ? 
                          `${Math.round(((checkinsData?.checkins?.length || 0) / Math.max(1, Math.ceil((new Date().getTime() - new Date(streak.created_at).getTime()) / (1000 * 60 * 60 * 24)))) * 100)}%` :
                          '0%'
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Current Streak</span>
                    <span className="font-medium">
                      {userStreak ? `${userStreak.current_streak_days} days` : '0 days'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Best Streak</span>
                    <span className="font-medium">
                      {userStreak ? `${userStreak.longest_streak_days} days` : '0 days'}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivityLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                  </div>
                ) : recentActivityData?.activities && recentActivityData.activities.length > 0 ? (
                  recentActivityData.activities.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 text-sm">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={activity.user.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {(activity.user.display_name || activity.user.username).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-gray-600 flex-1">
                        <span className="font-medium">{activity.user.display_name || activity.user.username}</span> {activity.action}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {new Date(activity.timestamp).toLocaleDateString() === new Date().toLocaleDateString() 
                          ? 'Today' 
                          : new Date(activity.timestamp).toLocaleDateString() === new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString()
                          ? 'Yesterday'
                          : new Date(activity.timestamp).toLocaleDateString()
                        }
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No recent activity yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comments/Notes Section */}
        <div className="lg:col-span-2">
          {streak?.is_public ? (
            <CommentsSection 
              streakId={streakId} 
              onCommentPosted={refetchRecentActivity}
            />
          ) : (
            <NotesSection 
              streakId={streakId} 
              onNotePosted={refetchRecentActivity}
            />
          )}
        </div>
      </div>

      {/* Leave Streak Confirmation Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Streak</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave this streak? You will lose all the progress you have made in this streak.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowLeaveDialog(false)}
              disabled={leavingStreak}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleLeaveStreak}
              disabled={leavingStreak}
            >
              {leavingStreak ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Leaving...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Leave Streak
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Streak Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Streak</DialogTitle>
            <DialogDescription className="text-red-700">
              ⚠️ <strong>Warning:</strong> This action cannot be undone. You are about to permanently delete this private streak and all associated data including your progress, notes, and check-ins.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={deletingStreak}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteStreak}
              disabled={deletingStreak}
            >
              {deletingStreak ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Delete Streak
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
