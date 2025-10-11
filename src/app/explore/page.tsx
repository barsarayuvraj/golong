'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import ProtectedLayout from '@/components/protected-layout'
import ExploreStreaks from '@/components/explore-streaks'

export default function ExplorePage() {
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const supabase = createClient()
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id)
    }
    
    getUser()
  }, [])

  return (
    <ProtectedLayout>
      <ExploreStreaks currentUserId={currentUserId} />
    </ProtectedLayout>
  )
}
