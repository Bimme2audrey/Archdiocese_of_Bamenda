import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function roleLabel(role: string): string {
  switch (role) {
    case 'IT_ADMIN': return 'IT Administrator'
    case 'ADP_ADMIN': return 'ADP Administrator'
    case 'PRIEST': return 'Priest'
    default: return role
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case 'APPROVED': return 'text-green-700 bg-green-100'
    case 'REJECTED': return 'text-red-700 bg-red-100'
    case 'PENDING': return 'text-amber-700 bg-amber-100'
    case 'DRAFT': return 'text-slate-600 bg-slate-100'
    default: return 'text-slate-600 bg-slate-100'
  }
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'APPROVED': return 'Approved'
    case 'REJECTED': return 'Rejected'
    case 'PENDING': return 'Pending Review'
    case 'DRAFT': return 'Draft'
    default: return status
  }
}
