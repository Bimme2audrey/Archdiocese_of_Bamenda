import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { getRoleSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function AdpLayout({ children }: { children: React.ReactNode }) {
  const user = await getRoleSessionUser('ADP_ADMIN')
  if (!user || user.role !== 'ADP_ADMIN') redirect('/clergy-login')

  return (
    <AppShell user={{ name: user.name, email: user.email, role: 'ADP_ADMIN', tempPassword: user.tempPassword }}>
      {children}
    </AppShell>
  )
}