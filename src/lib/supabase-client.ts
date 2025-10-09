import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Use mock client if Supabase URL is not configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_project_url') {
    const { createClient: createMockClient } = require('./supabase-mock')
    return createMockClient()
  }
  
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
