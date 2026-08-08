import { cn, statusColor, statusLabel } from '@/lib/utils'
import { Church } from 'lucide-react'

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-8 h-8 rounded-md',
    md: 'w-10 h-10 rounded-lg',
    lg: 'w-14 h-14 rounded-xl',
  }
  const iconSizes = { sm: 16, md: 20, lg: 28 }
  return (
    <div className={cn('bg-burgundy flex items-center justify-center text-gold-light shadow-sm', sizes[size])}>
      <Church size={iconSizes[size]} />
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusColor(status))}>
      {statusLabel(status)}
    </span>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        className
      )}
    />
  )
}

export function EmptyState({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-xl bg-sand flex items-center justify-center text-gold mb-4">
        <Icon size={26} />
      </div>
      <p className="font-semibold">{title}</p>
      {desc && <p className="text-sm text-stone-warm mt-1 max-w-sm">{desc}</p>}
    </div>
  )
}

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    IT_ADMIN: { label: 'IT Administrator', cls: 'bg-burgundy text-white' },
    ADP_ADMIN: { label: 'ADP Administrator', cls: 'bg-gold/20 text-burgundy border border-gold/40' },
    PRIEST: { label: 'Priest', cls: 'bg-sand text-ink' },
  }
  const { label, cls } = map[role] || { label: role, cls: 'bg-sand text-ink' }
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  )
}

export function SectionCard({
  title,
  children,
  action,
}: {
  title?: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="card card-shadow p-6">
      {(title || action) && (
        <div className="flex items-center justify-between mb-5">
          {title && <p className="font-semibold">{title}</p>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-stone-warm mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Field({ label, error, children, hint }: { label: string; error?: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-stone-warm mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}