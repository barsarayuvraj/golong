'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, Eye, EyeOff, CheckCircle, XCircle, Flag } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Report {
  id: string
  streak_id: string
  reason: string
  description?: string
  created_at: string
  streak: {
    id: string
    title: string
    description?: string
    is_public: boolean
    created_by: string
  }
}

export default function AdminDashboard() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          streak:streaks (
            id,
            title,
            description,
            is_public,
            created_by
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReports(data || [])
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (reportId: string, action: 'dismiss' | 'hide_streak') => {
    setActionLoading(true)
    try {
      if (action === 'hide_streak') {
        const report = reports.find(r => r.id === reportId)
        if (report) {
          // Hide the streak by making it private
          const { error } = await supabase
            .from('streaks')
            .update({ is_public: false })
            .eq('id', report.streak_id)

          if (error) throw error
        }
      }

      // Remove the report
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId)

      if (error) throw error

      // Refresh reports
      await fetchReports()
      setSelectedReport(null)
    } catch (error) {
      console.error('Error handling report:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'Inappropriate content':
      case 'Harassment or bullying':
      case 'Violence or harmful content':
        return 'bg-red-100 text-red-800'
      case 'Spam or misleading':
        return 'bg-yellow-100 text-yellow-800'
      case 'Copyright violation':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage reports and moderate content</p>
      </div>

      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Reports ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reports</h3>
                <p className="text-gray-600">All clear! No content reports to review.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          Report for: {report.streak.title}
                        </CardTitle>
                        <CardDescription className="mb-3">
                          {report.streak.description}
                        </CardDescription>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={getReasonColor(report.reason)}>
                            {report.reason}
                          </Badge>
                          <Badge variant="outline">
                            {new Date(report.created_at).toLocaleDateString()}
                          </Badge>
                        </div>
                        {report.description && (
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                            <strong>Additional details:</strong> {report.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReport(report)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Platform usage and moderation statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Analytics dashboard coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Review Report
            </DialogTitle>
            <DialogDescription>
              Review the reported content and take appropriate action
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Reported Streak:</h4>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="font-medium">{selectedReport.streak.title}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedReport.streak.description}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Report Details:</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getReasonColor(selectedReport.reason)}>
                      {selectedReport.reason}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {new Date(selectedReport.created_at).toLocaleString()}
                    </span>
                  </div>
                  {selectedReport.description && (
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      {selectedReport.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => handleAction(selectedReport!.id, 'dismiss')}
              disabled={actionLoading}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Dismiss Report
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleAction(selectedReport!.id, 'hide_streak')}
              disabled={actionLoading}
            >
              <EyeOff className="h-4 w-4 mr-1" />
              Hide Streak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
