import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Validation schemas
const exportRequestSchema = z.object({
  export_type: z.enum(['streaks', 'checkins', 'analytics', 'all']),
  format: z.enum(['csv', 'json', 'pdf']).default('json'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

// GET /api/export - Get export jobs status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const job_id = searchParams.get('job_id')

    if (job_id) {
      // Get specific export job
      const { data: job, error } = await supabase
        .from('export_jobs')
        .select('*')
        .eq('id', job_id)
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error fetching export job:', error)
        return NextResponse.json({ error: 'Export job not found' }, { status: 404 })
      }

      return NextResponse.json({ job })
    } else {
      // Get user's export jobs
      const { data: jobs, error } = await supabase
        .from('export_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Error fetching export jobs:', error)
        return NextResponse.json({ error: 'Failed to fetch export jobs' }, { status: 500 })
      }

      return NextResponse.json({ jobs })
    }
  } catch (error) {
    console.error('Export GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/export - Create a new export job
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = exportRequestSchema.parse(body)

    // Create export job
    const { data: job, error } = await supabase
      .from('export_jobs')
      .insert({
        user_id: user.id,
        export_type: validatedData.export_type,
        format: validatedData.format,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating export job:', error)
      return NextResponse.json({ error: 'Failed to create export job' }, { status: 500 })
    }

    // Start processing in background (in a real app, you'd use a queue system)
    processExportJob(supabase, job.id, user.id, validatedData)

    return NextResponse.json({ job }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Export POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/export - Cancel an export job
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('job_id')

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    // Update job status to cancelled
    const { error } = await supabase
      .from('export_jobs')
      .update({ 
        status: 'failed',
        error_message: 'Cancelled by user'
      })
      .eq('id', jobId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error cancelling export job:', error)
      return NextResponse.json({ error: 'Failed to cancel export job' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Export job cancelled' })
  } catch (error) {
    console.error('Export DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Background function to process export jobs
async function processExportJob(supabase: any, jobId: string, userId: string, exportData: any) {
  try {
    // Update job status to processing
    await supabase
      .from('export_jobs')
      .update({ status: 'processing' })
      .eq('id', jobId)

    let exportData_result: any = {}

    // Fetch data based on export type
    if (exportData.export_type === 'streaks' || exportData.export_type === 'all') {
      const { data: streaks } = await supabase
        .from('user_streaks')
        .select(`
          *,
          streaks(*)
        `)
        .eq('user_id', userId)

      exportData_result.streaks = streaks || []
    }

    if (exportData.export_type === 'checkins' || exportData.export_type === 'all') {
      let query = supabase
        .from('checkins')
        .select(`
          *,
          user_streaks!inner(
            *,
            streaks(*)
          )
        `)
        .eq('user_streaks.user_id', userId)

      if (exportData.start_date) {
        query = query.gte('checkin_date', exportData.start_date)
      }
      if (exportData.end_date) {
        query = query.lte('checkin_date', exportData.end_date)
      }

      const { data: checkins } = await query
      exportData_result.checkins = checkins || []
    }

    if (exportData.export_type === 'analytics' || exportData.export_type === 'all') {
      const { data: analytics } = await supabase
        .from('analytics_data')
        .select('*')
        .eq('user_id', userId)

      exportData_result.analytics = analytics || []
    }

    // Generate file based on format
    let fileContent: string
    let fileName: string
    let mimeType: string

    if (exportData.format === 'json') {
      fileContent = JSON.stringify(exportData_result, null, 2)
      fileName = `golong-export-${exportData.export_type}-${Date.now()}.json`
      mimeType = 'application/json'
    } else if (exportData.format === 'csv') {
      fileContent = convertToCSV(exportData_result)
      fileName = `golong-export-${exportData.export_type}-${Date.now()}.csv`
      mimeType = 'text/csv'
    } else {
      // For PDF, we'd need a PDF generation library
      fileContent = JSON.stringify(exportData_result, null, 2)
      fileName = `golong-export-${exportData.export_type}-${Date.now()}.txt`
      mimeType = 'text/plain'
    }

    // In a real application, you would:
    // 1. Upload the file to a cloud storage service (S3, etc.)
    // 2. Generate a signed URL for download
    // 3. Store the file URL in the database

    // For now, we'll simulate a file URL
    const fileUrl = `https://example.com/exports/${fileName}`

    // Update job with completion
    await supabase
      .from('export_jobs')
      .update({
        status: 'completed',
        file_url: fileUrl,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId)

    // Create notification for user
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'milestone',
        title: 'Export Ready',
        message: `Your ${exportData.export_type} export is ready for download`,
        data: { export_job_id: jobId, file_url: fileUrl }
      })

  } catch (error) {
    console.error('Error processing export job:', error)
    
    // Update job with error
    await supabase
      .from('export_jobs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('id', jobId)
  }
}

// Helper function to convert data to CSV format
function convertToCSV(data: any): string {
  const lines: string[] = []
  
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value) && value.length > 0) {
      // Add section header
      lines.push(`\n# ${key.toUpperCase()}\n`)
      
      // Get headers from first object
      const headers = Object.keys(value[0])
      lines.push(headers.join(','))
      
      // Add data rows
      value.forEach((item: any) => {
        const row = headers.map(header => {
          const val = item[header]
          // Escape commas and quotes in CSV
          if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
            return `"${val.replace(/"/g, '""')}"`
          }
          return val || ''
        })
        lines.push(row.join(','))
      })
    }
  }
  
  return lines.join('\n')
}

// GET /api/export/download - Download exported file
export async function DOWNLOAD_EXPORT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('job_id')

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    // Get the export job
    const { data: job, error: jobError } = await supabase
      .from('export_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Export job not found' }, { status: 404 })
    }

    if (job.status !== 'completed') {
      return NextResponse.json({ error: 'Export job is not completed yet' }, { status: 400 })
    }

    if (!job.file_url) {
      return NextResponse.json({ error: 'File URL not available' }, { status: 404 })
    }

    // In a real application, you would:
    // 1. Generate a signed URL for the file
    // 2. Redirect to the download URL
    // 3. Or stream the file content directly

    return NextResponse.json({ 
      download_url: job.file_url,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    })
  } catch (error) {
    console.error('Download export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}