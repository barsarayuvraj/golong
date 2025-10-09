'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Share2, 
  Twitter, 
  Facebook, 
  Instagram, 
  Link as LinkIcon, 
  Copy,
  Download,
  Image as ImageIcon,
  MessageCircle,
  Heart,
  Users,
  Calendar,
  Target
} from 'lucide-react'
import { motion } from 'framer-motion'

interface Streak {
  id: string
  name: string
  description: string
  category: string
  current_streak_count: number
  longest_streak_count: number
  created_at: string
  is_public: boolean
  user?: {
    username: string
    avatar_url?: string
  }
}

interface SocialShareProps {
  streak: Streak
  className?: string
}

export function SocialShare({ streak, className }: SocialShareProps) {
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [customMessage, setCustomMessage] = useState('')
  const [copied, setCopied] = useState(false)

  const generateShareText = (platform: string) => {
    const baseText = `🔥 I'm on a ${streak.current_streak_count}-day streak with "${streak.name}"! Join me on GoLong!`
    const hashtags = `#GoLong #Streak #${streak.category} #Habits`
    
    switch (platform) {
      case 'twitter':
        return `${baseText} ${hashtags}`
      case 'facebook':
        return `${baseText}\n\n${customMessage || 'Building better habits one day at a time!'}`
      case 'instagram':
        return `${baseText}\n\n${customMessage || 'Building better habits one day at a time!'}\n\n${hashtags}`
      default:
        return baseText
    }
  }

  const generateShareUrl = () => {
    return `${window.location.origin}/streaks/${streak.id}`
  }

  const handleShare = async (platform: string) => {
    const text = generateShareText(platform)
    const url = generateShareUrl()

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
        break
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank')
        break
      case 'instagram':
        // Instagram doesn't support direct sharing, so we copy to clipboard
        navigator.clipboard.writeText(`${text}\n\n${url}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        break
      case 'copy':
        navigator.clipboard.writeText(`${text}\n\n${url}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        break
    }
  }

  const generateShareImage = () => {
    // Create a canvas for generating share images
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    canvas.width = 1200
    canvas.height = 630

    if (!ctx) return

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#667eea')
    gradient.addColorStop(1, '#764ba2')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Title
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 48px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('🔥 GoLong Streak', canvas.width / 2, 150)

    // Streak name
    ctx.font = '36px Arial'
    ctx.fillText(`"${streak.name}"`, canvas.width / 2, 220)

    // Streak count
    ctx.font = 'bold 72px Arial'
    ctx.fillText(`${streak.current_streak_count}`, canvas.width / 2, 320)
    ctx.font = '24px Arial'
    ctx.fillText('days strong!', canvas.width / 2, 360)

    // Category
    ctx.font = '20px Arial'
    ctx.fillStyle = '#e0e0e0'
    ctx.fillText(streak.category, canvas.width / 2, 420)

    // URL
    ctx.font = '18px Arial'
    ctx.fillText('Join me on GoLong!', canvas.width / 2, 480)

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `golong-streak-${streak.name.replace(/\s+/g, '-').toLowerCase()}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    })
  }

  const shareButtons = [
    {
      platform: 'twitter',
      icon: Twitter,
      label: 'Twitter',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      platform: 'facebook',
      icon: Facebook,
      label: 'Facebook',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      platform: 'instagram',
      icon: Instagram,
      label: 'Instagram',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
    },
    {
      platform: 'copy',
      icon: copied ? Copy : LinkIcon,
      label: copied ? 'Copied!' : 'Copy Link',
      color: 'bg-gray-500 hover:bg-gray-600'
    }
  ]

  return (
    <div className={className}>
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Share Your Streak</DialogTitle>
            <DialogDescription>
              Share your amazing progress with friends and inspire others!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Streak Preview */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{streak.name}</CardTitle>
                    <CardDescription>{streak.category}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-500">{streak.current_streak_count}</div>
                    <div className="text-sm text-gray-600">Current Streak</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-500">{streak.longest_streak_count}</div>
                    <div className="text-sm text-gray-600">Longest Streak</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-500">
                      {Math.floor((new Date().getTime() - new Date(streak.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                    </div>
                    <div className="text-sm text-gray-600">Days Active</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Custom Message */}
            <div>
              <Label htmlFor="custom-message">Custom Message (Optional)</Label>
              <Textarea
                id="custom-message"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Add a personal message to your share..."
                rows={3}
                className="mt-1"
              />
            </div>

            {/* Share Buttons */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {shareButtons.map((button) => {
                  const Icon = button.icon
                  return (
                    <motion.div
                      key={button.platform}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={() => handleShare(button.platform)}
                        className={`${button.color} text-white flex items-center gap-2`}
                      >
                        <Icon className="h-4 w-4" />
                        {button.label}
                      </Button>
                    </motion.div>
                  )
                })}
              </div>

              {/* Additional Options */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={generateShareImage}
                  className="flex items-center gap-2"
                >
                  <ImageIcon className="h-4 w-4" />
                  Download Image
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigator.share?.({
                    title: `My ${streak.current_streak_count}-day streak: ${streak.name}`,
                    text: generateShareText('default'),
                    url: generateShareUrl()
                  })}
                  className="flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Native Share
                </Button>
              </div>
            </div>

            {/* Share Stats */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>Share with friends</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  <span>Inspire others</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>Build community</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Quick share buttons for streak cards
export function QuickShareButtons({ streak }: { streak: Streak }) {
  const handleQuickShare = (platform: string) => {
    const text = `🔥 I'm on a ${streak.current_streak_count}-day streak with "${streak.name}"! Join me on GoLong!`
    const url = `${window.location.origin}/streaks/${streak.id}`
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
        break
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
        break
      case 'copy':
        navigator.clipboard.writeText(`${text}\n\n${url}`)
        break
    }
  }

  return (
    <div className="flex gap-1">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => handleQuickShare('twitter')}
        className="h-8 w-8 p-0"
      >
        <Twitter className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => handleQuickShare('facebook')}
        className="h-8 w-8 p-0"
      >
        <Facebook className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => handleQuickShare('copy')}
        className="h-8 w-8 p-0"
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}
