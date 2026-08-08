'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { PageHeader, SectionCard, StatusBadge, Spinner, EmptyState } from '@/components/ui'
import { UserRound, Search, ArrowRight, Download } from 'lucide-react'

interface PriestRow {
  id: string
  firstName: string | null
  lastName: string | null
  status: string
  updatedAt: string
  diocese: string | null
  user: { name: string | null; email: string }
  _count: { academicRecords: number; assignments: number }
}

const tabs = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending Review' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'DRAFT', label: 'Drafts' },
]

function PriestsList({ role }: { role: string }) {
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get('status') || 'ALL').toUpperCase()
  const [search, setSearch] = useState('')
  const [diocese, setDiocese] = useState('')
  const [profiles, setProfiles] = useState<PriestRow[]>([])
  const [loading, setLoading] = useState(true)

  async function load(status = activeTab) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status })
      if (search) params.set('search', search)
      if (diocese) params.set('diocese', diocese)
      const res = await fetch(`/api/admin/priests?${params}`, { headers: { 'x-role': role } })
      const data = await res.json()
      setProfiles(data.profiles || [])
    } catch {
      setProfiles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(activeTab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])
function exportCSV() {
    const rows = [
      ['First Name', 'Last Name', 'Diocese', 'Status', 'Email'],
      ...profiles.map((p) => [
        p.firstName || '',
        p.lastName || '',
        p.diocese || '',
        p.status,
        p.user?.email || '',
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

  return (
    <>
      <PageHeader
        title="Clergy Records"
        subtitle="All priest profiles across the Archdiocese."
      />

      <SectionCard>
        {/* Tabs + search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex gap-1 p-1 bg-sand/60 rounded-lg">
            {tabs.map((t) => (
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
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
            />
          </div>
<select
            className="input-base w-auto shrink-0"
            value={diocese}
            onChange={(e) => { setDiocese(e.target.value); load() }}
          >
            <option value="">All Dioceses</option>
            <option value="Nairobi">Nairobi</option>
            <option value="Kisumu">Kisumu</option>
            <option value="Mombasa">Mombasa</option>
            <option value="Eldoret">Eldoret</option>
            <option value="Nyeri">Nyeri</option>
            <option value="Machakos">Machakos</option>
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
                  <th className="table-header">Records</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Updated</th>
                  <th className="table-header"></th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-cream transition-colors">
                    <td className="table-cell">
                      <p className="font-medium">
                        {[p.firstName, p.lastName].filter(Boolean).join(' ') || p.user.name || 'Unnamed'}
                      </p>
                      <p className="text-xs text-stone-warm">{p.user.email}</p>
                    </td>
                    <td className="table-cell text-stone-warm">{p.diocese || '—'}</td>
                    <td className="table-cell text-stone-warm">
                      {p._count.academicRecords} academic · {p._count.assignments} posts
                    </td>
                    <td className="table-cell"><StatusBadge status={p.status} /></td>
                    <td className="table-cell text-stone-warm">{new Date(p.updatedAt).toLocaleDateString()}</td>
                    <td className="table-cell text-right">
                      <Link href={`/${role === 'IT_ADMIN' ? 'it' : 'adp'}/priests/${p.id}`} className="inline-flex items-center gap-1 text-burgundy font-medium text-sm hover:underline">
                        View <ArrowRight size={14} />
                      </Link>
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