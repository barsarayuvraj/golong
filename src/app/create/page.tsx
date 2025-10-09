import ProtectedLayout from '@/components/protected-layout'
import CreateStreakForm from '@/components/create-streak-form'

export default function CreateStreakPage() {
  return (
    <ProtectedLayout>
      <CreateStreakForm />
    </ProtectedLayout>
  )
}
