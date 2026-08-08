import LoginForm from '@/components/LoginForm'

export default function ClergyLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream">
      <LoginForm initialRole="ADP_ADMIN" />
    </div>
  )
}