import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('Health check started')
    
    const supabase = await createClient()
    console.log('Supabase client created')
    
    // Simple query to test connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Database connection error:', error)
      return NextResponse.json({ 
        status: 'error',
        message: 'Database connection failed',
        error: error.message
      }, { status: 500 })
    }
    
    console.log('Database connection successful')
    
    return NextResponse.json({ 
      status: 'healthy',
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json({ 
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
