'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Code, 
  Copy, 
  ExternalLink, 
  Palette, 
  Settings,
  Flame,
  Target,
  Calendar,
  Users,
  BarChart3,
  Share2,
  Eye,
  Download
} from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { motion } from 'framer-motion'

interface WidgetConfig {
  type: 'streak-counter' | 'progress-bar' | 'calendar-view' | 'leaderboard' | 'mini-chart'
  theme: 'light' | 'dark' | 'auto'
  size: 'small' | 'medium' | 'large'
  showTitle: boolean
  showDescription: boolean
  showStats: boolean
  customColors: {
    primary: string
    secondary: string
    background: string
    text: string
  }
}

interface StreakWidget {
  id: string
  name: string
  config: WidgetConfig
  embedCode: string
  previewUrl: string
  created_at: string
}

export function StreakWidgets() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userStreaks, setUserStreaks] = useState<any[]>([])
  const [selectedStreak, setSelectedStreak] = useState<string>('')
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>({
    type: 'streak-counter',
    theme: 'light',
    size: 'medium',
    showTitle: true,
    showDescription: false,
    showStats: true,
    customColors: {
      primary: '#3b82f6',
      secondary: '#1e40af',
      background: '#ffffff',
      text: '#000000'
    }
  })
  const [generatedCode, setGeneratedCode] = useState('')
  const [copied, setCopied] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchUserStreaks()
    }
  }, [user])

  useEffect(() => {
    if (selectedStreak && userStreaks.length > 0) {
      generateEmbedCode()
    }
  }, [selectedStreak, widgetConfig, userStreaks])

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchUserStreaks = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_streaks')
        .select(`
          *,
          streak:streaks (
            id,
            title,
            description,
            category,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .gt('current_streak_count', 0)

      if (error) throw error
      setUserStreaks(data || [])
      
      if (data && data.length > 0) {
        setSelectedStreak(data[0].streak_id)
      }
    } catch (error) {
      console.error('Error fetching user streaks:', error)
    }
  }

  const generateEmbedCode = () => {
    const streak = userStreaks.find(s => s.streak_id === selectedStreak)
    if (!streak) return

    const baseUrl = window.location.origin
    const widgetUrl = `${baseUrl}/widget/${streak.streak_id}`
    
    const config = {
      type: widgetConfig.type,
      theme: widgetConfig.theme,
      size: widgetConfig.size,
      showTitle: widgetConfig.showTitle,
      showDescription: widgetConfig.showDescription,
      showStats: widgetConfig.showStats,
      colors: widgetConfig.customColors
    }

    const embedCode = `
<!-- GoLong Streak Widget -->
<div id="golong-widget-${streak.streak_id}" 
     data-streak-id="${streak.streak_id}"
     data-config='${JSON.stringify(config)}'
     style="width: ${widgetConfig.size === 'small' ? '200px' : widgetConfig.size === 'medium' ? '300px' : '400px'}; height: auto;">
  <script>
    (function() {
      const widget = document.getElementById('golong-widget-${streak.streak_id}');
      const config = JSON.parse(widget.dataset.config);
      
      // Create iframe for security
      const iframe = document.createElement('iframe');
      iframe.src = '${widgetUrl}?embed=true&config=' + encodeURIComponent(JSON.stringify(config));
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '8px';
      
      widget.appendChild(iframe);
    })();
  </script>
</div>
<!-- End GoLong Widget -->`

    setGeneratedCode(embedCode)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const getWidgetPreview = () => {
    const streak = userStreaks.find(s => s.streak_id === selectedStreak)
    if (!streak) return null

    const styles = {
      backgroundColor: widgetConfig.customColors.background,
      color: widgetConfig.customColors.text,
      border: `2px solid ${widgetConfig.customColors.primary}`,
      borderRadius: '8px',
      padding: '16px',
      width: widgetConfig.size === 'small' ? '200px' : widgetConfig.size === 'medium' ? '300px' : '400px',
      fontFamily: 'Arial, sans-serif'
    }

    return (
      <div style={styles}>
        {widgetConfig.showTitle && (
          <h3 style={{ color: widgetConfig.customColors.primary, margin: '0 0 8px 0', fontSize: '18px' }}>
            {streak.streak.title}
          </h3>
        )}
        
        {widgetConfig.showDescription && (
          <p style={{ margin: '0 0 12px 0', fontSize: '14px', opacity: 0.8 }}>
            {streak.streak.description}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            backgroundColor: widgetConfig.customColors.primary, 
            color: 'white', 
            padding: '8px 12px', 
            borderRadius: '6px',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            {streak.current_streak_count}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Current Streak</div>
            {widgetConfig.showStats && (
              <div style={{ fontSize: '12px', opacity: 0.7 }}>
                Longest: {streak.longest_streak_count} days
              </div>
            )}
          </div>
        </div>

        <div style={{ 
          marginTop: '12px', 
          fontSize: '12px', 
          opacity: 0.6,
          textAlign: 'center'
        }}>
          Powered by GoLong
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <Code className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold mb-2">Login Required</h3>
        <p className="text-gray-600">Please log in to create streak widgets</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Streak Widgets</h2>
          <p className="text-gray-600">Create embeddable widgets to showcase your streaks</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Widget Configuration</CardTitle>
            <CardDescription>Customize your streak widget</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Streak Selection */}
            <div>
              <Label htmlFor="streak">Select Streak</Label>
              <Select value={selectedStreak} onValueChange={setSelectedStreak}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a streak" />
                </SelectTrigger>
                <SelectContent>
                  {userStreaks.map(streak => (
                    <SelectItem key={streak.streak_id} value={streak.streak_id}>
                      {streak.streak.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Widget Type */}
            <div>
              <Label htmlFor="type">Widget Type</Label>
              <Select value={widgetConfig.type} onValueChange={(value: any) => setWidgetConfig({ ...widgetConfig, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="streak-counter">Streak Counter</SelectItem>
                  <SelectItem value="progress-bar">Progress Bar</SelectItem>
                  <SelectItem value="calendar-view">Calendar View</SelectItem>
                  <SelectItem value="leaderboard">Leaderboard</SelectItem>
                  <SelectItem value="mini-chart">Mini Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Theme */}
            <div>
              <Label htmlFor="theme">Theme</Label>
              <Select value={widgetConfig.theme} onValueChange={(value: any) => setWidgetConfig({ ...widgetConfig, theme: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Size */}
            <div>
              <Label htmlFor="size">Size</Label>
              <Select value={widgetConfig.size} onValueChange={(value: any) => setWidgetConfig({ ...widgetConfig, size: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (200px)</SelectItem>
                  <SelectItem value="medium">Medium (300px)</SelectItem>
                  <SelectItem value="large">Large (400px)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Display Options */}
            <div>
              <Label>Display Options</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showTitle"
                    checked={widgetConfig.showTitle}
                    onChange={(e) => setWidgetConfig({ ...widgetConfig, showTitle: e.target.checked })}
                  />
                  <label htmlFor="showTitle" className="text-sm">Show Title</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showDescription"
                    checked={widgetConfig.showDescription}
                    onChange={(e) => setWidgetConfig({ ...widgetConfig, showDescription: e.target.checked })}
                  />
                  <label htmlFor="showDescription" className="text-sm">Show Description</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showStats"
                    checked={widgetConfig.showStats}
                    onChange={(e) => setWidgetConfig({ ...widgetConfig, showStats: e.target.checked })}
                  />
                  <label htmlFor="showStats" className="text-sm">Show Stats</label>
                </div>
              </div>
            </div>

            {/* Custom Colors */}
            <div>
              <Label>Custom Colors</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <Label htmlFor="primary" className="text-xs">Primary</Label>
                  <Input
                    id="primary"
                    type="color"
                    value={widgetConfig.customColors.primary}
                    onChange={(e) => setWidgetConfig({
                      ...widgetConfig,
                      customColors: { ...widgetConfig.customColors, primary: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="secondary" className="text-xs">Secondary</Label>
                  <Input
                    id="secondary"
                    type="color"
                    value={widgetConfig.customColors.secondary}
                    onChange={(e) => setWidgetConfig({
                      ...widgetConfig,
                      customColors: { ...widgetConfig.customColors, secondary: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="background" className="text-xs">Background</Label>
                  <Input
                    id="background"
                    type="color"
                    value={widgetConfig.customColors.background}
                    onChange={(e) => setWidgetConfig({
                      ...widgetConfig,
                      customColors: { ...widgetConfig.customColors, background: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="text" className="text-xs">Text</Label>
                  <Input
                    id="text"
                    type="color"
                    value={widgetConfig.customColors.text}
                    onChange={(e) => setWidgetConfig({
                      ...widgetConfig,
                      customColors: { ...widgetConfig.customColors, text: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview and Code */}
        <div className="space-y-6">
          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>How your widget will look</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                {getWidgetPreview()}
              </div>
            </CardContent>
          </Card>

          {/* Embed Code */}
          <Card>
            <CardHeader>
              <CardTitle>Embed Code</CardTitle>
              <CardDescription>Copy this code to embed your widget</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    value={generatedCode}
                    readOnly
                    className="w-full h-32 p-3 bg-gray-100 rounded-lg font-mono text-sm resize-none"
                  />
                  <Button
                    size="sm"
                    onClick={copyToClipboard}
                    className="absolute top-2 right-2"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>• Paste this code into your website's HTML</p>
                  <p>• The widget will automatically update with your streak progress</p>
                  <p>• No JavaScript framework required</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Widget Types Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Widget Types
          </CardTitle>
          <CardDescription>
            Choose the perfect widget for your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium">Streak Counter</h4>
              <p className="text-sm text-gray-600">Simple number display</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium">Progress Bar</h4>
              <p className="text-sm text-gray-600">Visual progress indicator</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-medium">Calendar View</h4>
              <p className="text-sm text-gray-600">Monthly activity calendar</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <h4 className="font-medium">Leaderboard</h4>
              <p className="text-sm text-gray-600">Ranking display</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Flame className="h-6 w-6 text-pink-600" />
              </div>
              <h4 className="font-medium">Mini Chart</h4>
              <p className="text-sm text-gray-600">Trend visualization</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
