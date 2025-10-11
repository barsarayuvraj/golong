import { formatDistanceToNow, parseISO } from 'date-fns'

/**
 * Formats a date string to Instagram-style relative time
 * Examples: "2 seconds ago", "5 minutes ago", "2 hours ago", "3 days ago"
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = parseISO(dateString)
    const now = new Date()
    
    // Calculate the difference in seconds
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    // Handle different time ranges
    if (diffInSeconds < 60) {
      return diffInSeconds <= 1 ? 'just now' : `${diffInSeconds} seconds ago`
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400)
      return days === 1 ? '1 day ago' : `${days} days ago`
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000)
      return months === 1 ? '1 month ago' : `${months} months ago`
    } else {
      const years = Math.floor(diffInSeconds / 31536000)
      return years === 1 ? '1 year ago' : `${years} years ago`
    }
  } catch (error) {
    console.error('Error formatting relative time:', error)
    return 'some time ago'
  }
}

/**
 * Alternative implementation using date-fns formatDistanceToNow
 * This provides more natural language formatting
 */
export function formatRelativeTimeNatural(dateString: string): string {
  try {
    const date = parseISO(dateString)
    return formatDistanceToNow(date, { addSuffix: true })
  } catch (error) {
    console.error('Error formatting relative time:', error)
    return 'some time ago'
  }
}
