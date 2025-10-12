'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

const createStreakSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  category: z.string().optional(),
  is_public: z.boolean(),
  tags: z.array(z.string()),
  set_duration: z.boolean().default(false),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  duration: z.string().optional(),
}).refine((data) => {
  if (!data.set_duration) return true
  
  if (data.duration && !data.start_date && !data.end_date) return true
  
  if (data.start_date && data.end_date) {
    const startDate = new Date(data.start_date)
    const endDate = new Date(data.end_date)
    return endDate >= startDate
  }
  
  return true
}, {
  message: "End date must be same as or after start date",
  path: ["end_date"]
})

type CreateStreakForm = z.infer<typeof createStreakSchema>

const STREAK_CATEGORIES = [
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

const POPULAR_TAGS = [
  'daily', 'weekly', 'monthly', 'yearly',
  'fitness', 'reading', 'coding', 'meditation',
  'no-social-media', 'no-smoking', 'no-drinking',
  'exercise', 'writing', 'learning', 'cooking',
  'art', 'music', 'language', 'business'
]

const DURATION_OPTIONS = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '365', label: '1 year' },
]

export default function CreateStreakForm() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [newTag, setNewTag] = useState('')
  const router = useRouter()

  const form = useForm<CreateStreakForm>({
    resolver: zodResolver(createStreakSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      is_public: true,
      tags: [],
      set_duration: false,
      start_date: '',
      end_date: '',
      duration: '30',
    },
  })

  const watchedTags = form.watch('tags')

  const addTag = (tag: string) => {
    const currentTags = form.getValues('tags')
    if (!currentTags.includes(tag) && currentTags.length < 10) {
      form.setValue('tags', [...currentTags, tag])
    }
  }

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags')
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove))
  }

  const handleAddCustomTag = () => {
    if (newTag.trim() && !watchedTags.includes(newTag.trim())) {
      addTag(newTag.trim())
      setNewTag('')
    }
  }

  const onSubmit = async (data: CreateStreakForm) => {
    setLoading(true)
    setMessage('')

    try {
      // Mock API call - replace with actual Supabase call later
      const response = await fetch('/api/streaks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create streak')
      }

      const result = await response.json()
      console.log('Streak creation result:', result)
      setMessage('Streak created successfully!')
      
      // Redirect to the new streak page
      setTimeout(() => {
        console.log('Redirecting to streak:', result.id)
        router.push(`/streaks/${result.id}`)
      }, 1000)

    } catch (error: any) {
      setMessage(error.message || 'Failed to create streak')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="mr-2 h-5 w-5" />
            Create New Streak
          </CardTitle>
          <CardDescription>
            Start a new streak and invite others to join your journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Streak Title *</Label>
              <Input
                id="title"
                placeholder="e.g., No YouTube for 30 days"
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your streak goal and motivation..."
                rows={3}
                {...form.register('description')}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={(value) => form.setValue('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {STREAK_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration Selection */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="set_duration" 
                  checked={form.watch('set_duration')}
                  onCheckedChange={(checked) => {
                    form.setValue('set_duration', checked as boolean)
                    if (checked) {
                      // Set default start date to today and end date to 30 days from now
                      const today = new Date().toISOString().split('T')[0]
                      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                      form.setValue('start_date', today)
                      form.setValue('end_date', thirtyDaysFromNow)
                    } else {
                      form.setValue('start_date', '')
                      form.setValue('end_date', '')
                    }
                  }}
                />
                <Label htmlFor="set_duration" className="text-sm font-medium">
                  Set streak duration
                </Label>
              </div>

              {form.watch('set_duration') && (
                <div className="ml-6 space-y-4 border-l-2 border-gray-200 pl-4">
                  {/* Duration Preset */}
                  <div className="space-y-2">
                    <Label>Quick Duration</Label>
                    <Select 
                      value={form.watch('duration')} 
                      onValueChange={(value) => {
                        form.setValue('duration', value)
                        const days = parseInt(value)
                        const startDate = form.getValues('start_date') || new Date().toISOString().split('T')[0]
                        const endDate = new Date(new Date(startDate).getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                        form.setValue('end_date', endDate)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={form.watch('start_date')}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          form.setValue('start_date', e.target.value)
                          // If duration is set, update end date
                          const duration = form.getValues('duration')
                          if (duration && e.target.value) {
                            const days = parseInt(duration)
                            const endDate = new Date(new Date(e.target.value).getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                            form.setValue('end_date', endDate)
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={form.watch('end_date')}
                        min={form.watch('start_date') || new Date().toISOString().split('T')[0]}
                        onChange={(e) => form.setValue('end_date', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {watchedTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTag())}
                  />
                  <Button type="button" onClick={handleAddCustomTag} disabled={!newTag.trim()}>
                    Add
                  </Button>
                </div>
                
                <div className="text-sm text-gray-600">
                  Popular tags: {POPULAR_TAGS.slice(0, 8).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
                      className="mr-2 text-blue-600 hover:underline"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Public/Private */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_public"
                checked={form.watch('is_public')}
                onCheckedChange={(checked) => form.setValue('is_public', checked as boolean)}
              />
              <Label htmlFor="is_public" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Make this streak public (others can join)
              </Label>
            </div>

            {message && (
              <div className={`text-sm ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Streak
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
