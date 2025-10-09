'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { LogOut, User as UserIcon, Settings, Flame, Plus, Shield, Sparkles, BarChart3, Trophy, Calendar, Bell, Award, Users, Download, Code, Menu, X, Target, Zap } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { NotificationsDropdown } from './notifications-dropdown'

export default function Navbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userRole, setUserRole] = useState<string>('user')
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Fetch user profile to get role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        setUserRole(profile?.role || 'user')
      }
      
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: any, session: any) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  if (loading) {
    return (
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                GoLong
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>
    )
  }

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <motion.div 
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
          >
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                GoLong
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-2">
            {user ? (
              <>
                {/* My Streaks - New Primary Action */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/my-streaks">
                    <Button variant="ghost" size="sm" className="flex items-center gap-1 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 text-green-700 border border-green-200">
                      <Target className="h-4 w-4" />
                      <span className="hidden xl:inline">My Streaks</span>
                    </Button>
                  </Link>
                </motion.div>

                {/* Gamification Features */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/challenges">
                    <Button variant="ghost" size="sm" className="flex items-center gap-1 bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 text-orange-700 border border-orange-200">
                      <Trophy className="h-4 w-4" />
                      <span className="hidden xl:inline">Challenges</span>
                    </Button>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/groups">
                    <Button variant="ghost" size="sm" className="flex items-center gap-1 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 border border-blue-200">
                      <Users className="h-4 w-4" />
                      <span className="hidden xl:inline">Groups</span>
                    </Button>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/achievements">
                    <Button variant="ghost" size="sm" className="flex items-center gap-1 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-purple-700 border border-purple-200">
                      <Award className="h-4 w-4" />
                      <span className="hidden xl:inline">Achievements</span>
                    </Button>
                  </Link>
                </motion.div>

                {/* Primary Actions */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/explore">
                    <Button variant="ghost" size="sm" className="flex items-center gap-1">
                      <Flame className="h-4 w-4" />
                      <span className="hidden xl:inline">Explore</span>
                    </Button>
                  </Link>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/create">
                    <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center gap-1">
                      <Plus className="h-4 w-4" />
                      <span className="hidden xl:inline">Create</span>
                    </Button>
                  </Link>
                </motion.div>

                {/* Features Dropdown - Streamlined */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-1">
                      <Zap className="h-4 w-4" />
                      <span className="hidden xl:inline">Tools</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48" align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/templates" className="flex items-center">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Templates
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/analytics" className="flex items-center">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Analytics
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/calendar" className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        Calendar
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/reminders" className="flex items-center">
                        <Bell className="mr-2 h-4 w-4" />
                        Reminders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/export" className="flex items-center">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/widgets" className="flex items-center">
                        <Code className="mr-2 h-4 w-4" />
                        Widgets
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Notifications */}
                <NotificationsDropdown />

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.username} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                          {user.user_metadata?.username?.charAt(0)?.toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user.user_metadata?.username || user.email}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    {(userRole === 'admin' || userRole === 'moderator') && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex items-center">
                            <Shield className="mr-2 h-4 w-4" />
                            <span>Admin Dashboard</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth">
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-button"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-white/95 backdrop-blur-md">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {user ? (
                <>
                  {/* My Streaks - New Primary Action */}
                  <Link href="/my-streaks" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100 bg-green-50 border border-green-200">
                    <div className="flex items-center gap-2 text-green-700">
                      <Target className="h-4 w-4" />
                      My Streaks
                    </div>
                  </Link>

                  {/* Gamification Features */}
                  <Link href="/challenges" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100 bg-yellow-50 border border-yellow-200">
                    <div className="flex items-center gap-2 text-orange-700">
                      <Trophy className="h-4 w-4" />
                      Challenges
                    </div>
                  </Link>
                  <Link href="/groups" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100 bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-700">
                      <Users className="h-4 w-4" />
                      Groups
                    </div>
                  </Link>
                  <Link href="/achievements" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100 bg-purple-50 border border-purple-200">
                    <div className="flex items-center gap-2 text-purple-700">
                      <Award className="h-4 w-4" />
                      Achievements
                    </div>
                  </Link>

                  {/* Primary Actions */}
                  <Link href="/explore" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100">
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4" />
                      Explore
                    </div>
                  </Link>
                  <Link href="/create" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create Streak
                    </div>
                  </Link>
                  <div className="border-t pt-2 mt-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-1">Tools</div>
                    <Link href="/templates" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Templates
                      </div>
                    </Link>
                    <Link href="/analytics" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Analytics
                      </div>
                    </Link>
                    <Link href="/calendar" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Calendar
                      </div>
                    </Link>
                    <Link href="/reminders" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Reminders
                      </div>
                    </Link>
                    <Link href="/export" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100">
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Export
                      </div>
                    </Link>
                    <Link href="/widgets" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100">
                      <div className="flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        Widgets
                      </div>
                    </Link>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-1">Account</div>
                    <Link href="/profile" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        Profile
                      </div>
                    </Link>
                    <Link href="/settings" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                      </div>
                    </Link>
                    {(userRole === 'admin' || userRole === 'moderator') && (
                      <Link href="/admin" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Admin Dashboard
                        </div>
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        <LogOut className="h-4 w-4" />
                        Log out
                      </div>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/auth" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100">
                    Sign In
                  </Link>
                  <Link href="/auth" className="block px-3 py-2 rounded-md text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.nav>
  )
}