'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { PageHeader, SectionCard, StatusBadge, Spinner, EmptyState } from '@/components/ui'
import ClergyAvatar from '@/components/ClergyAvatar'
import { UserRound, Search, ArrowRight, Download, Filter, Trash2 } from 'lucide-react'
import { ecclesiasticalStatusLabel, ecclesiasticalStatusColor, calculateAge } from '@/lib/utils'

interface PriestRow {
  id: string
  firstName: string | null; lastName: string | null
  photoUrl: string | null
  status: string; updatedAt: string; diocese: string | null
  dateOfBirth: string | null; ecclesiasticalStatus: string | null
  user: { name: string | null; email: string }
  _count: { academicRecords: number; assignments: number }
}

const profileTabs = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending Review' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'DRAFT', label: 'Drafts' },
]

const ecclStatuses = [
  { value: '', label: 'All Statuses' },
  { value: 'active_under_70', label: 'Active <70' },
  { value: 'near_retirement', label: 'Near Retirement 70-74' },
  { value: 'retirement_eligible', label: 'Retirement Eligible 75+' },
  { value: 'Deceased', label: 'Deceased (Necrology)' },
]

function PriestsList({ role }: { role: string }) {
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get('status') || 'ALL').toUpperCase()
  const [search, setSearch] = useState('')
  const [diocese, setDiocese] = useState('')
  const [ecclesiastical, setEcclesiastical] = useState('')
  const [profiles, setProfiles] = useState<PriestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load(status = activeTab) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status })
      if (search) params.set('search', search)
      if (diocese) params.set('diocese', diocese)
      // Age-based filters need client-side; Deceased uses API
      if (ecclesiastical === 'Deceased') params.set('ecclesiastical', 'Deceased')
      const res = await fetch(`/api/admin/priests?${params}`, { headers: { 'x-role': role } })
      const data = await res.json()
      let results = data.profiles || []
      // Client-side age filtering for non-Deceased options
      if (ecclesiastical && ecclesiastical !== 'Deceased') {
        results = results.filter((p: PriestRow) => {
          if (p.ecclesiasticalStatus === 'Deceased') return false
          const age = calculateAge(p.dateOfBirth)
          if (ecclesiastical === 'active_under_70') return age < 70
          if (ecclesiastical === 'near_retirement') return age >= 70 && age < 75
          if (ecclesiastical === 'retirement_eligible') return age >= 75
          return true
        })
      }
      setProfiles(results)
    } catch { setProfiles([]) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    load(activeTab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])
function exportCSV() {
    const rows = [
      ['First Name', 'Last Name', 'Diocese', 'Profile Status', 'Ecclesiastical Status', 'Age', 'Email'],
      ...profiles.map((p) => [
        p.firstName || '', p.lastName || '', p.diocese || '', p.status,
        p.ecclesiasticalStatus || 'Active', calculateAge(p.dateOfBirth), p.user?.email || '',
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'clergy-records.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function deletePriest(profile: PriestRow) {
    const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.user.name || 'this priest'
    if (!window.confirm(`Permanently delete ${name}'s account and clergy record? This cannot be undone.`)) return
    setError('')
    const res = await fetch(`/api/admin/priests/${profile.id}`, {
      method: 'DELETE',
      headers: { 'x-role': role },
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Could not delete this record')
      return
    }
    setProfiles((current) => current.filter((item) => item.id !== profile.id))
  }

  return (
    <>
      <PageHeader
        title="Clergy Records"
        subtitle="All priest profiles across the Archdiocese."
      />

      <SectionCard>
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {/* Tabs + search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex gap-1 p-1 bg-sand/60 rounded-lg">
            {profileTabs.map((t) => (
              <Link
                key={t.key}
                href={`${role === 'IT_ADMIN' ? '/it' : '/adp'}/priests?status=${t.key}`}
                className={
                  activeTab === t.key
                    ? 'px-3 py-1.5 rounded-md text-sm font-medium bg-white shadow-sm'
                    : 'px-3 py-1.5 rounded-md text-sm text-stone-warm hover:text-ink'
                }
              >
                {t.label}
              </Link>
            ))}
          </div>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-warm" />
            <input
              className="input-base pl-9"
              placeholder="Search name, email, or parish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
            />
          </div>
          <select className="input-base w-auto shrink-0" value={ecclesiastical} onChange={(e) => { setEcclesiastical(e.target.value); load() }}>
            {ecclStatuses.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
          </select>
<select
            className="input-base w-auto shrink-0"
            value={diocese}
            onChange={(e) => { setDiocese(e.target.value); load() }}
          >
            <option value="">Archdiocese of Bamenda</option>
          </select>
<button onClick={exportCSV} disabled={profiles.length === 0} className="btn-secondary shrink-0">
            <Download size={15} /> Export CSV
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : profiles.length === 0 ? (
          <EmptyState icon={UserRound} title="No records found" desc="Try a different filter or invite a priest to begin." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Priest</th>
                  <th className="table-header">Diocese</th>
                  <th className="table-header">Eccl. Status</th>
                  <th className="table-header">Records</th>
                  <th className="table-header">Profile</th>
                  <th className="table-header"></th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-cream transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <ClergyAvatar firstName={p.firstName} lastName={p.lastName} photoUrl={p.photoUrl} size="sm" ecclesiasticalStatus={p.ecclesiasticalStatus} />
                        <div>
                          <p className="font-medium">{[p.firstName, p.lastName].filter(Boolean).join(' ') || p.user.name || 'Unnamed'}</p>
                          <p className="text-xs text-stone-warm">{p.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-stone-warm">{p.diocese || '—'}</td>
                    <td className="table-cell">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ecclesiasticalStatusColor(p.ecclesiasticalStatus)}`}>
                        {ecclesiasticalStatusLabel(p.ecclesiasticalStatus)}
                      </span>
                      {p.dateOfBirth && <p className="text-xs text-stone-warm mt-1">Age: {calculateAge(p.dateOfBirth)}</p>}
                    </td>
                    <td className="table-cell text-stone-warm">{p._count.academicRecords} acad · {p._count.assignments} posts</td>
                    <td className="table-cell"><StatusBadge status={p.status} /></td>
                    <td className="table-cell text-right">
                      <Link href={`/${role === 'IT_ADMIN' ? 'it' : 'adp'}/priests/${p.id}`} className="inline-flex items-center gap-1 text-burgundy font-medium text-sm hover:underline">
                        View <ArrowRight size={14} />
                      </Link>
                      <button type="button" onClick={() => deletePriest(p)} className="ml-3 inline-flex items-center justify-center p-2 text-red-700 hover:bg-red-50 rounded-md" aria-label={`Delete ${[p.firstName, p.lastName].filter(Boolean).join(' ') || 'priest'} record`} title="Delete priest record">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </>
  )
}

export default function PriestsBrowser({ role }: { role: string }) {
  return (
    <Suspense>
      <PriestsList role={role} />
    </Suspense>
  )
}