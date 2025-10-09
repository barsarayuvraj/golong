'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

export default function AuthCallback() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/auth?error=auth_failed')
          return
        }

        if (data.session?.user) {
          // Check if profile exists, create if not
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single()

          if (profileError && profileError.code === 'PGRST116') {
            // Profile doesn't exist, create it
            const { error: createError } = await supabase
              .from('profiles')
              .insert({
                id: data.session.user.id,
                username: data.session.user.user_metadata?.username || 
                         data.session.user.user_metadata?.full_name?.toLowerCase().replace(/\s+/g, '_') ||
                         data.session.user.email?.split('@')[0] || 'user',
                display_name: data.session.user.user_metadata?.full_name || 
                             data.session.user.user_metadata?.name ||
                             data.session.user.email?.split('@')[0] || 'User',
                avatar_url: data.session.user.user_metadata?.avatar_url,
              })

            if (createError) {
              console.error('Error creating profile:', createError)
            }
          }

          router.push('/')
        } else {
          router.push('/auth')
        }
      } catch (error) {
        console.error('Unexpected error:', error)
        router.push('/auth?error=unexpected_error')
      }
    }

    handleAuthCallback()
  }, [supabase, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  )
}
