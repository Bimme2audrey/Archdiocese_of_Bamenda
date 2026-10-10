'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { roleLabel } from '@/lib/utils'
import ClergyAvatar from '@/components/ClergyAvatar'
import {
  LayoutDashboard,
  FileText,
  UserRound,
  Users,
  BarChart3,
  ShieldCheck,
  LogOut,
  Church,
  Megaphone,
  Menu,
  X,
  Calendar,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles: string[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['IT_ADMIN', 'ADP_ADMIN', 'PRIEST'] },
  { label: 'My Profile', href: '/questionnaire', icon: FileText, roles: ['PRIEST'] },
  { label: 'Invite Priests', href: '/invite', icon: Users, roles: ['ADP_ADMIN'] },
  { label: 'View Records', href: '/priests', icon: UserRound, roles: ['ADP_ADMIN'] },
  { label: 'Reports & Stats', href: '/reports', icon: BarChart3, roles: ['ADP_ADMIN'] },
  { label: 'Calendar', href: '/calendar', icon: Calendar, roles: ['ADP_ADMIN'] },
  { label: 'Announcements', href: '/announcements', icon: Megaphone, roles: ['ADP_ADMIN'] },
  { label: 'Manage Admins', href: '/admin', icon: ShieldCheck, roles: ['IT_ADMIN'] },
]

const roleDashboardHref: Record<string, string> = {
  IT_ADMIN: '/admin-dashboard',
  ADP_ADMIN: '/clergy-dashboard',
  PRIEST: '/priest-dashboard',
}

function resolveHref(item: NavItem, role: string): string {
  if (item.label === 'Dashboard') return roleDashboardHref[role] || item.href
  switch (item.label) {
    case 'My Profile': return '/priest/questionnaire'
    case 'Invite Priests': return role === 'IT_ADMIN' ? '/it/invite' : '/adp/invite'
    case 'View Records': return role === 'IT_ADMIN' ? '/it/priests' : '/adp/priests'
    case 'Reports & Stats': return role === 'IT_ADMIN' ? '/it/reports' : '/adp/reports'
    case 'Calendar': return role === 'IT_ADMIN' ? '/it/calendar' : '/adp/calendar'
    case 'Announcements': return role === 'IT_ADMIN' ? '/it/announcements' : '/adp/announcements'
    case 'Manage Admins': return '/it/admin'
    default: return item.href
  }
}

export default function Sidebar({ user }: { user: { name: string | null; email: string; role: string; photoUrl?: string | null } }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const items = navItems
    .filter((item) => item.roles.includes(user.role))
    .map((item) => ({ ...item, href: resolveHref(item, user.role) }))

  const nav = (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active ? 'bg-burgundy text-white shadow-sm' : 'text-ink/70 hover:bg-sand/60'
            )}
          >
            <item.icon size={17} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )

  const footer = (
    <div className="p-3 border-t border-sand">
      <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 mb-2 bg-cream">
        <ClergyAvatar
          photoUrl={user.photoUrl}
          fullName={user.name}
          size="sm"
          ecclesiasticalStatus={user.role === 'PRIEST' ? 'Active' : undefined}
        />
        <div className="leading-tight min-w-0">
          <p className="text-sm font-medium truncate">{user.name || 'User'}</p>
          <p className="text-[11px] text-stone-warm truncate">{user.email}</p>
        </div>
      </div>
      <button onClick={handleLogout} className="btn-ghost w-full text-left text-red-700 hover:bg-red-50">
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  )

  const brand = (
    <div className="px-5 py-5 flex items-center gap-3 border-b border-sand">
      <div className="w-9 h-9 rounded-lg bg-burgundy flex items-center justify-center text-gold-light">
        <Church size={18} />
      </div>
      <div className="leading-tight">
        <p className="font-semibold text-sm">ADP Clergy System</p>
        <p className="text-[11px] text-stone-warm">{roleLabel(user.role)}</p>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-white border-b border-sand px-4 py-3 print:hidden">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-burgundy flex items-center justify-center text-gold-light">
            <Church size={16} />
          </div>
          <p className="font-semibold text-sm">ADP Clergy</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-secondary px-3 py-1.5">
          <Menu size={18} />
        </button>
      </div>

      {/* Overlay on mobile */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar: sticky on desktop, drawer on mobile */}
      <aside
        className={cn(
          'w-60 shrink-0 bg-white border-r border-sand flex flex-col min-h-screen h-screen top-0',
          'fixed left-0 z-50 transition-transform lg:sticky lg:self-start lg:translate-x-0 print:hidden',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="lg:hidden flex justify-end p-3 border-b border-sand">
          <button onClick={() => setOpen(false)} className="btn-ghost"><X size={18} /></button>
        </div>
        {brand}
        {nav}
        {footer}
      </aside>
    </>
  )
}