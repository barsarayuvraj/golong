'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, Clock, Users, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface StreakTemplate {
  id: string
  name: string
  description: string
  category: string
  suggested_duration?: number
  tags: string[]
  is_popular: boolean
}

const TEMPLATE_CATEGORIES = [
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

export function StreakTemplates() {
  const [templates, setTemplates] = useState<StreakTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Mock data for now - replace with actual API call
  useEffect(() => {
    const mockTemplates: StreakTemplate[] = [
      {
        id: '1',
        name: '30-Day Fitness Challenge',
        description: 'Complete a 30-minute workout every day for 30 days',
        category: 'Health & Fitness',
        suggested_duration: 30,
        tags: ['fitness', 'workout', 'health', 'challenge'],
        is_popular: true
      },
      {
        id: '2',
        name: 'Daily Reading Habit',
        description: 'Read for at least 30 minutes every day',
        category: 'Learning & Education',
        suggested_duration: 365,
        tags: ['reading', 'learning', 'books', 'knowledge'],
        is_popular: true
      },
      {
        id: '3',
        name: 'No Social Media',
        description: 'Avoid social media platforms to improve focus and productivity',
        category: 'Productivity',
        suggested_duration: 30,
        tags: ['productivity', 'focus', 'digital-detox', 'mindfulness'],
        is_popular: true
      },
      {
        id: '4',
        name: 'Daily Meditation',
        description: 'Practice meditation for 10-20 minutes every day',
        category: 'Mindfulness & Wellness',
        suggested_duration: 100,
        tags: ['meditation', 'mindfulness', 'wellness', 'stress-relief'],
        is_popular: false
      },
      {
        id: '5',
        name: 'Learn a New Language',
        description: 'Study a new language for 30 minutes daily',
        category: 'Learning & Education',
        suggested_duration: 90,
        tags: ['language', 'learning', 'skill-building', 'communication'],
        is_popular: false
      },
      {
        id: '6',
        name: 'Daily Gratitude Journal',
        description: 'Write down three things you\'re grateful for each day',
        category: 'Mindfulness & Wellness',
        suggested_duration: 365,
        tags: ['gratitude', 'journaling', 'mindfulness', 'positivity'],
        is_popular: false
      },
      {
        id: '7',
        name: 'No Soda Challenge',
        description: 'Avoid drinking soda and sugary drinks',
        category: 'Health & Fitness',
        suggested_duration: 60,
        tags: ['health', 'nutrition', 'hydration', 'sugar-free'],
        is_popular: false
      },
      {
        id: '8',
        name: 'Daily Coding Practice',
        description: 'Code for at least 1 hour every day',
        category: 'Learning & Education',
        suggested_duration: 100,
        tags: ['coding', 'programming', 'skill-building', 'technology'],
        is_popular: false
      }
    ]

    setTimeout(() => {
      setTemplates(mockTemplates)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const popularTemplates = filteredTemplates.filter(t => t.is_popular)
  const otherTemplates = filteredTemplates.filter(t => !t.is_popular)

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Streak Templates</h1>
          <p className="text-gray-600">Get inspired by popular streak ideas and start your journey</p>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Popular Templates */}
        {popularTemplates.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <h2 className="text-xl font-bold text-gray-900">Popular Templates</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularTemplates.map((template, index) => (
                <TemplateCard key={template.id} template={template} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* Other Templates */}
        {otherTemplates.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-blue-500" />
              <h2 className="text-xl font-bold text-gray-900">More Templates</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherTemplates.map((template, index) => (
                <TemplateCard key={template.id} template={template} index={index} />
              ))}
            </div>
          </div>
        )}

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Sparkles className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or create your own custom streak!
            </p>
            <Link href="/create">
              <Button>
                <Sparkles className="mr-2 h-4 w-4" />
                Create Custom Streak
              </Button>
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  )
}

function TemplateCard({ template, index }: { template: StreakTemplate; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5 }}
    >
      <Card className="h-full hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-1">{template.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {template.description}
              </CardDescription>
            </div>
            {template.is_popular && (
              <Badge className="bg-orange-100 text-orange-800">
                Popular
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{template.tags.length - 3} more
              </Badge>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {template.suggested_duration} days
            </div>
            <Badge variant="secondary">{template.category}</Badge>
          </div>

          {/* Action */}
          <Link href={`/create?template=${template.id}`} className="block">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Use This Template
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  )
}
