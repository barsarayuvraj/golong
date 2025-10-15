import { useState, useEffect } from 'react'
import { formatRelativeTime } from '@/lib/time-utils'

/**
 * Hook that provides real-time updating relative time formatting
 * Updates every minute to keep the time display current
 */
export function useRelativeTime(dateString: string | null | undefined): string {
  const [relativeTime, setRelativeTime] = useState(() => formatRelativeTime(dateString))

  useEffect(() => {
    // Update immediately
    setRelativeTime(formatRelativeTime(dateString))

    // Set up interval to update every minute
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(dateString))
    }, 60000) // Update every 60 seconds

    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, [dateString])

  return relativeTime
}
