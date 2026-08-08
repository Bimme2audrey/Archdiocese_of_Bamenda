'use client'

import { useEffect, useState } from 'react'
import { PageHeader, SectionCard, Spinner, EmptyState } from '@/components/ui'
import { BarChart3, UserRound, FileCheck2, Clock, Wrench } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Report {
  summary: { total: number; approved: number; pending: number; rejected: number; draft: number; users: number }
  diocese: Array<{ name: string; count: number }>
  ordinationDecades: Array<{ decade: string; count: number }>
  nationalities: Array<{ name: string; count: number }>
  recentReviews: Array<{ id: string; action: string; notes: string | null; createdAt: string; profile: { firstName: string | null; lastName: string | null }; reviewer: { name: string | null } }>
}

function SimpleBar({ items }: { items: Array<{ name: string; count: number }> }) {
  const max = Math.max(1, ...items.map((i) => i.count))
  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-sm text-stone-warm">No data yet.</p>
      ) : (
        items
          .filter((i) => i.count > 0)
          .sort((a, b) => b.count - a.count)
          .slice(0, 8)
          .map((i) => (
            <div key={i.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium truncate">{i.name}</span>
                <span className="text-stone-warm">{i.count}</span>
              </div>
              <div className="h-2.5 rounded-full bg-sand overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-burgundy to-gold" style={{ width: `${(i.count / max) * 100}%` }} />
              </div>
            </div>
          ))
      )}
    </div>
  )
}

export default function ReportsView({ role }: { role: string }) {
  const [data, setData] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/reports/summary', { headers: { 'x-role': role } })
        if (!res.ok) throw new Error('Failed')
        setData(await res.json())
      } catch {
        setError('Could not load report data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  if (error || !data) {
    return <PageHeader title="Reports &amp; Statistics" subtitle={error} />
  }

  const { summary } = data

  return (
    <>
      <PageHeader title="Reports &amp; Statistics" subtitle="Summaries of clergy records across the Archdiocese." />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[
          { label: 'Total', value: summary.total, color: 'text-burgundy bg-burgundy/10' },
          { label: 'Approved', value: summary.approved, color: 'text-green-700 bg-green-100' },
          { label: 'Pending', value: summary.pending, color: 'text-amber-700 bg-amber-100' },
          { label: 'Rejected', value: summary.rejected, color: 'text-red-700 bg-red-100' },
          { label: 'Drafts', value: summary.draft, color: 'text-slate-600 bg-slate-100' },
          { label: 'Users', value: summary.users, color: 'text-indigo-700 bg-indigo-100' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card card-shadow p-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color} mb-2`}>
              <BarChart3 size={15} />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-stone-warm mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title="Profiles by Diocese">
          <SimpleBar items={data.diocese} />
        </SectionCard>
        <SectionCard title="Ordination Decade">
          <SimpleBar items={data.ordinationDecades.map((d) => ({ name: d.decade, count: d.count }))} />
        </SectionCard>
        <SectionCard title="Nationalities">
          <SimpleBar items={data.nationalities} />
        </SectionCard>
        <SectionCard title="Recent Review Activity">
          {data.recentReviews.length === 0 ? (
            <EmptyState icon={Wrench} title="No reviews yet" desc="Review activity will appear here." />
          ) : (
            <div className="space-y-3">
              {data.recentReviews.map((r) => (
                <div key={r.id} className="flex items-start gap-3 text-sm">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${r.action === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    <FileCheck2 size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">
                      {[r.profile.firstName, r.profile.lastName].filter(Boolean).join(' ')}
                      <span className="text-stone-warm font-normal"> · {r.action === 'APPROVED' ? 'Approved' : 'Rejected'} by {r.reviewer.name || 'ADP'}</span>
                    </p>
                    <p className="text-xs text-stone-warm">{formatDate(r.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </>
  )
}