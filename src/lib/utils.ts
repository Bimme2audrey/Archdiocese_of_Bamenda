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
  const cleaned = name
    .replace(/Rev\.\s*Fr\.\s*|Rev\.\s*Monsignor\s*|Monsignor\s*|Fr\.\s*|Most\s*Rev\.\s*|Bishop\s*/i, '')
    .trim()
  return cleaned
    .split(/\s+/)
    .filter(Boolean)
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

export function ecclesiasticalStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'Active': return 'Active'
    case 'Deceased': return 'Deceased'
    case 'Retired': return 'Retired'
    case 'Absent': return 'Absent'
    case 'Pending Approval': return 'Pending Approval'
    default: return status || 'Active'
  }
}

export function ecclesiasticalStatusColor(status: string | null | undefined): string {
  switch (status) {
    case 'Active': return 'text-emerald-700 bg-emerald-100'
    case 'Deceased': return 'text-purple-700 bg-purple-100'
    case 'Retired': return 'text-slate-600 bg-slate-100'
    case 'Absent': return 'text-amber-700 bg-amber-100'
    case 'Pending Approval': return 'text-blue-700 bg-blue-100'
    default: return 'text-slate-600 bg-slate-100'
  }
}

export function announcementCategoryColor(category: string): string {
  switch (category) {
    case 'Urgent': return 'bg-red-100 text-red-700 border-red-200'
    case 'ADP Executive': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'Liturgical': return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'Assembly': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'Chancery Notice':
    default: return 'bg-amber-100 text-amber-700 border-amber-200'
  }
}

export function calculateAge(dobString: string | null | undefined, baseOnDeathDate = false, deathDateString?: string | null): number {
  if (!dobString) return 0
  const birthDate = new Date(dobString)
  const endDate = baseOnDeathDate && deathDateString ? new Date(deathDateString) : new Date()
  let age = endDate.getFullYear() - birthDate.getFullYear()
  const m = endDate.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && endDate.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

export function parseDateParts(dStr: string | null | undefined): { year: number; month: number; day: number } | null {
  if (!dStr) return null
  const parts = dStr.split('-')
  if (parts.length >= 3) {
    return { year: parseInt(parts[0]), month: parseInt(parts[1]) - 1, day: parseInt(parts[2]) }
  }
  return null
}

export function getJubileeLabel(ordinationDateStr: string | null | undefined): string | null {
  if (!ordinationDateStr) return null
  const d = parseDateParts(ordinationDateStr)
  if (!d) return null
  const years = new Date().getFullYear() - d.year
  if (years === 25) return 'Silver Jubilee (25 Yrs)'
  if (years === 50) return 'Golden Jubilee (50 Yrs)'
  if (years === 60) return 'Diamond Jubilee (60 Yrs)'
  if (years >= 50) return `Venerable (${years} Yrs)`
  if (years > 0) return `${years} Years Priestly Service`
  return null
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
