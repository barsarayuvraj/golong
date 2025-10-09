import ProtectedLayout from '@/components/protected-layout'
import MyStreaksPage from '@/components/my-streaks-page'

export default function MyStreaks() {
  return (
    <ProtectedLayout>
      <MyStreaksPage />
    </ProtectedLayout>
  )
}
