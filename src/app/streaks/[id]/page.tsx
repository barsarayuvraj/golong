import ProtectedLayout from '@/components/protected-layout'
import StreakDetail from '@/components/streak-detail'

export default function StreakDetailPage() {
  return (
    <ProtectedLayout>
      <StreakDetail />
    </ProtectedLayout>
  )
}
