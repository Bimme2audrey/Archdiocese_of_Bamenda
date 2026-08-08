import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { getRoleSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function ItLayout({ children }: { children: React.ReactNode }) {
  const user = await getRoleSessionUser('IT_ADMIN')
  if (!user || user.role !== 'IT_ADMIN') redirect('/admin-login')

  return (
    <AppShell user={{ name: user.name, email: user.email, role: 'IT_ADMIN', tempPassword: user.tempPassword }}>
      {children}
    </AppShell>
  )
}