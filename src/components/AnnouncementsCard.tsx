'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SectionCard, Spinner } from '@/components/ui'
import { Megaphone, ArrowRight, Pin } from 'lucide-react'
import { formatDate, announcementCategoryColor } from '@/lib/utils'

interface Announcement {
  id: string
  title: string
  body: string
  active: boolean
  category: string
  isPinned: boolean
  targetAudience: string | null
  createdAt: string
  author: { name: string | null }
}

export default function AnnouncementsCard({ role }: { role: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/announcements', { headers: { 'x-role': role } })
      .then((r) => r.json())
      .then((d) => setAnnouncements((d.announcements || []).slice(0, 3)))
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false))
  }, [role])

  const isAdmin = role === 'IT_ADMIN' || role === 'ADP_ADMIN'

  return (
    <SectionCard
      title="Announcements"
      action={
        isAdmin ? (
          <Link href={role === 'IT_ADMIN' ? '/it/announcements' : '/adp/announcements'} className="inline-flex items-center gap-1 text-xs text-burgundy font-medium hover:underline">
            Manage <ArrowRight size={12} />
          </Link>
        ) : undefined
      }
    >
      {loading ? (
        <div className="flex justify-center py-6"><Spinner /></div>
      ) : announcements.length === 0 ? (
        <div className="flex items-center gap-3 py-4 text-stone-warm">
          <Megaphone size={18} />
          <p className="text-sm">No announcements right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className={`rounded-lg border p-3 ${a.isPinned ? 'bg-gold/5 border-gold/30' : 'border-sand bg-cream/50'}`}>
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${announcementCategoryColor(a.category)}`}>
                  {a.category}
                </span>
                {a.isPinned && <Pin size={11} className="text-gold" />}
              </div>
              <p className="font-medium text-sm">{a.title}</p>
              <p className="text-sm text-stone-warm mt-1 line-clamp-2">{a.body}</p>
              <p className="text-xs text-stone-warm mt-2">{formatDate(a.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}