import LoginForm from '@/components/LoginForm'

export default function PriestLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream">
      <LoginForm initialRole="PRIEST" />
    </div>
  )
}