'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Flag, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'

const REPORT_REASONS = [
  'Inappropriate content',
  'Spam or misleading',
  'Harassment or bullying',
  'Violence or harmful content',
  'Copyright violation',
  'Other'
]

interface ReportDialogProps {
  streakId: string
  streakTitle: string
}

export function ReportDialog({ streakId, streakTitle }: ReportDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const supabase = createClient()

  const handleSubmit = async () => {
    if (!reason) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          streak_id: streakId,
          reason,
          description: description || null,
          created_at: new Date().toISOString(),
        })

      if (error) throw error

      setSubmitted(true)
      setTimeout(() => {
        setOpen(false)
        setSubmitted(false)
        setReason('')
        setDescription('')
      }, 2000)
    } catch (error) {
      console.error('Error submitting report:', error)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-green-600" />
              Report Submitted
            </DialogTitle>
            <DialogDescription>
              Thank you for reporting this content. We'll review it and take appropriate action.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-600">
          <Flag className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Streak</DialogTitle>
          <DialogDescription>
            Report "{streakTitle}" for inappropriate content or violations of our community guidelines.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Reason for reporting</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((reportReason) => (
                  <SelectItem key={reportReason} value={reportReason}>
                    {reportReason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Additional details (optional)</label>
            <Textarea
              placeholder="Please provide any additional context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!reason || loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
