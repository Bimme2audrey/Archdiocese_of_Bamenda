import { redirect } from 'next/navigation'
import { getRoleSessionUser, ROLE_DASHBOARDS } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Generic /dashboard just routes you to whichever role dashboard you're
// logged into (so legacy links and password-change redirects still work).
export default async function DashboardRedirect() {
  for (const role of ['IT_ADMIN', 'ADP_ADMIN', 'PRIEST'] as const) {
    const u = await getRoleSessionUser(role)
    if (u) redirect(ROLE_DASHBOARDS[role])
  }
  redirect('/login')
}