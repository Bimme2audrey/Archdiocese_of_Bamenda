import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { getRoleSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function PriestLayout({ children }: { children: React.ReactNode }) {
  const user = await getRoleSessionUser('PRIEST')
  if (!user || user.role !== 'PRIEST') redirect('/priest-login')

  return (
    <AppShell user={{ name: user.name, email: user.email, role: 'PRIEST', tempPassword: user.tempPassword }}>
      {children}
    </AppShell>
  )
}