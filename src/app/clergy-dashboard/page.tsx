import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import RoleDashboard from '@/components/dashboards/RoleDashboard'
import { getRoleSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function ClergyDashboard() {
  const user = await getRoleSessionUser('ADP_ADMIN')
  if (!user || user.role !== 'ADP_ADMIN') redirect('/login')

  return (
    <AppShell user={{ name: user.name, email: user.email, role: user.role, tempPassword: user.tempPassword }}>
      <RoleDashboard user={{ id: user.id, role: user.role, name: user.name }} />
    </AppShell>
  )
}