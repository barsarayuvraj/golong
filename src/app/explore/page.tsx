import ProtectedLayout from '@/components/protected-layout'
import ExploreStreaks from '@/components/explore-streaks'

export default function ExplorePage() {
  return (
    <ProtectedLayout>
      <ExploreStreaks />
    </ProtectedLayout>
  )
}
