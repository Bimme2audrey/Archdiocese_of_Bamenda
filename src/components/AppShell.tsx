import { redirect } from 'next/navigation'
import Sidebar from './Sidebar'
import { getCurrentUser } from '@/lib/auth'

export default async function AppShell({
  children,
  user: propUser,
}: {
  children: React.ReactNode
  user?: { name: string | null; email: string; role: string; tempPassword?: boolean } | null
}) {
  const user = propUser ?? (await getCurrentUser())
  if (!user) redirect('/login')
  if (user.tempPassword) redirect('/change-password')

  return (
    <div className="min-h-screen bg-cream flex flex-col lg:flex-row">
      <Sidebar user={{ name: user.name, email: user.email, role: user.role }} />
      <main className="flex-1 min-w-0 p-6 lg:p-8">{children}</main>
    </div>
  )
}