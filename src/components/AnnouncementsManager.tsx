'use client'

import { useEffect, useState } from 'react'
import { SectionCard, Spinner, EmptyState } from '@/components/ui'
import { Megaphone, Plus, Trash2, CheckCircle2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Announcement {
  id: string
  title: string
  body: string
  active: boolean
  createdAt: string
  author: { name: string | null }
}

export default function AnnouncementsManager({ role }: { role: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function load() {
    try {
      const res = await fetch('/api/announcements', { headers: { 'x-role': role } })
      const data = await res.json()
      setAnnouncements(data.announcements || [])
    } catch {
      setAnnouncements([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-role': role },
        body: JSON.stringify({ title, body }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to create' })
        setSaving(false)
        return
      }
      setTitle('')
      setBody('')
      setMessage({ type: 'success', text: 'Announcement published.' })
      await load()
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this announcement?')) return
    await fetch(`/api/admin/announcements/${id}`, {
      method: 'DELETE',
      headers: { 'x-role': role },
    })
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
              <div key={a.id} className="flex items-start justify-between gap-3 rounded-lg border border-sand p-4 bg-cream/50">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
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