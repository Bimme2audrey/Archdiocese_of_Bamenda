'use client'

import { useEffect, useState } from 'react'
import { SectionCard, Spinner, EmptyState } from '@/components/ui'
import { Megaphone, Plus, Trash2, CheckCircle2, Pin, PinOff } from 'lucide-react'
import { formatDate, announcementCategoryColor } from '@/lib/utils'

const CATEGORIES = ['Chancery Notice', 'ADP Executive', 'Urgent', 'Liturgical', 'Assembly']
const AUDIENCES = ['', 'All Clergy & Deans', 'ADP Executive', 'Public Directory']

interface Announcement {
  id: string; title: string; body: string; active: boolean
  category: string; isPinned: boolean; targetAudience: string | null
  createdAt: string; author: { name: string | null }
}

export default function AnnouncementsManager({ role }: { role: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('Chancery Notice')
  const [isPinned, setIsPinned] = useState(false)
  const [targetAudience, setTargetAudience] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function load() {
    try {
      const res = await fetch('/api/announcements', { headers: { 'x-role': role } })
      const data = await res.json()
      setAnnouncements(data.announcements || [])
    } catch { setAnnouncements([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMessage(null)
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-role': role },
        body: JSON.stringify({ title, body, category, isPinned, targetAudience: targetAudience || null }),
      })
      const data = await res.json()
      if (!res.ok) { setMessage({ type: 'error', text: data.error || 'Failed to create' }); setSaving(false); return }
      setTitle(''); setBody(''); setCategory('Chancery Notice'); setIsPinned(false); setTargetAudience('')
      setMessage({ type: 'success', text: 'Announcement published.' })
      await load()
    } catch { setMessage({ type: 'error', text: 'Network error' }) }
    finally { setSaving(false) }
  }

  async function remove(id: string) {
    if (!confirm('Delete this announcement?')) return
    await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE', headers: { 'x-role': role } })
    await load()
  }

  return (
    <div className="space-y-6">
      <SectionCard title="New Announcement">
        <form onSubmit={create} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Title</label>
            <input className="input-base" placeholder="e.g. Clergy Assembly Meeting" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Category</label>
              <select className="input-base" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Target Audience</label>
              <select className="input-base" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)}>
                <option value="">All Users</option>
                {AUDIENCES.filter(Boolean).map((a) => (<option key={a} value={a}>{a}</option>))}
              </select>
            </div>
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} className="rounded border-sand" />
                <span className="text-sm font-medium flex items-center gap-1"><Pin size={13} /> Pin</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Message</label>
            <textarea className="input-base min-h-24" placeholder="Write the announcement..." value={body} onChange={(e) => setBody(e.target.value)} required />
          </div>
          {message && (
            <div className={`rounded-lg border px-4 py-3 text-sm ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
              {message.text}
            </div>
          )}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Spinner /> : <><Plus size={16} /> Publish Announcement</>}
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Published Announcements">
        {loading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : announcements.length === 0 ? (
          <EmptyState icon={Megaphone} title="No announcements yet" desc="Publish your first announcement above." />
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className={`flex items-start justify-between gap-3 rounded-lg border p-4 ${a.isPinned ? 'bg-gold/5 border-gold/30' : 'border-sand bg-cream/50'}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${announcementCategoryColor(a.category)}`}>{a.category}</span>
                    {a.isPinned && <PinOff size={13} className="text-gold" />}
                    {a.targetAudience && <span className="text-xs text-stone-warm font-mono">→ {a.targetAudience}</span>}
                    <p className="font-semibold">{a.title}</p>
                    {a.active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium"><CheckCircle2 size={11} /> Active</span>
                    ) : (
                      <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-xs font-medium">Hidden</span>
                    )}
                  </div>
                  <p className="text-sm text-stone-warm mt-1 whitespace-pre-wrap">{a.body}</p>
                  <p className="text-xs text-stone-warm mt-2">{formatDate(a.createdAt)} · by {a.author?.name || 'ADP'}</p>
                </div>
                <button onClick={() => remove(a.id)} className="text-red-500 hover:text-red-700 shrink-0" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}