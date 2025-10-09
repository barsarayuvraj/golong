import ProtectedLayout from '@/components/protected-layout'
import ProfilePage from '@/components/profile-page'

export default function Profile() {
  return (
    <ProtectedLayout>
      <ProfilePage />
    </ProtectedLayout>
  )
}
