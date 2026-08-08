'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageHeader, StatusBadge, Spinner, SectionCard } from '@/components/ui'
import { ArrowLeft, CheckCircle2, XCircle, GraduationCap, Church, Briefcase, HeartHandshake, Phone, MapPin, CalendarDays, Pencil } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Profile {
  id: string
  status: string
  firstName: string | null
  middleName: string | null
  lastName: string | null
  dateOfBirth: string | null
  placeOfBirth: string | null
  nationality: string | null
  diocese: string | null
  phoneNumber: string | null
  dateOfOrdination: string | null
  placeOfOrdination: string | null
  ordinationBishop: string | null
  diaconate: string | null
  additionalNotes: string | null
  submittedAt: string | null
  approvedAt: string | null
  rejectedAt: string | null
  user: { name: string | null; email: string; createdAt: string }
  academicRecords: Array<{ id: string; institution: string; degree: string; fieldOfStudy: string | null; startYear: string | null; endYear: string | null; country: string | null }>
  assignments: Array<{ id: string; parish: string; diocese: string | null; role: string; startDate: string | null; endDate: string | null; isCurrent: boolean }>
  ministries: Array<{ id: string; title: string; organization: string | null; description: string | null; startDate: string | null; endDate: string | null }>
  reviews: Array<{ id: string; action: string; notes: string | null; createdAt: string; reviewer: { name: string | null } }>
}

function InfoItem({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: React.ElementType }) {
  return (
    <div>
      <p className="text-xs text-stone-warm mb-0.5 flex items-center gap-1">
        {Icon && <Icon size={12} />} {label}
      </p>
      <p className="font-medium text-sm">{value || '—'}</p>
    </div>
  )
}

export default function PriestProfileView({ role }: { role: string }) {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function load() {
    try {
      const res = await fetch(`/api/admin/priests/${id}`, { headers: { 'x-role': role } })
      const data = await res.json()
      setProfile(data.profile)
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  async function review(action: 'APPROVED' | 'REJECTED') {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/priests/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-role': role },
        body: JSON.stringify({ action, notes }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Action failed')
      } else {
        setNotes('')
        await load()
      }
    } catch {
      setError('Network error')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner /></div>
  }

  if (!profile) {
    return (
      <PageHeader title="Profile not found" subtitle="This clergy record does not exist or was removed." />
    )
  }

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.user.name || 'Unnamed'

  return (
    <>
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-stone-warm hover:text-ink mb-4">
        <ArrowLeft size={15} /> Back to records
      </button>

      <PageHeader title={fullName} subtitle={profile.diocese || 'Clergy Profile'} action={<StatusBadge status={profile.status} />} />

      {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-4">{error}</div>}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <SectionCard title="Personal Information">
            <div className="grid sm:grid-cols-2 gap-4">
              <InfoItem label="Full Name" value={fullName} />
              <InfoItem label="Date of Birth" value={profile.dateOfBirth} icon={CalendarDays} />
              <InfoItem label="Place of Birth" value={profile.placeOfBirth} icon={MapPin} />
              <InfoItem label="Nationality" value={profile.nationality} />
              <InfoItem label="Diocese" value={profile.diocese} icon={Church} />
              <InfoItem label="Phone" value={profile.phoneNumber} icon={Phone} />
            </div>
          </SectionCard>

          {/* Ordination */}
          <SectionCard title="Ordination">
            <div className="grid sm:grid-cols-2 gap-4">
              <InfoItem label="Date of Ordination" value={profile.dateOfOrdination} icon={CalendarDays} />
              <InfoItem label="Place of Ordination" value={profile.placeOfOrdination} icon={MapPin} />
              <InfoItem label="Ordaining Bishop" value={profile.ordinationBishop} />
              <InfoItem label="Diaconate" value={profile.diaconate} />
            </div>
          </SectionCard>

          {/* Academic Records */}
          <SectionCard title="Academic Formation">
            {profile.academicRecords.length === 0 ? (
              <p className="text-sm text-stone-warm">No academic records yet.</p>
            ) : (
              <div className="space-y-4">
                {profile.academicRecords.map((r) => (
                  <div key={r.id} className="flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gold/15 text-gold flex items-center justify-center shrink-0"><GraduationCap size={17} /></div>
                    <div>
                      <p className="font-medium text-sm">{r.degree}</p>
                      <p className="text-sm text-stone-warm">{r.institution} · {r.country || '—'}</p>
                      <p className="text-xs text-stone-warm">{r.startYear || ''} – {r.endYear || ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Pastoral Assignments */}
          <SectionCard title="Pastoral Assignments">
            {profile.assignments.length === 0 ? (
              <p className="text-sm text-stone-warm">No pastoral assignments yet.</p>
            ) : (
              <div className="space-y-4">
                {profile.assignments.map((a) => (
                  <div key={a.id} className="flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-burgundy/10 text-burgundy flex items-center justify-center shrink-0"><Briefcase size={17} /></div>
                    <div>
                      <p className="font-medium text-sm">{a.role} {a.isCurrent && <span className="ml-1 rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs">Current</span>}</p>
                      <p className="text-sm text-stone-warm">{a.parish} {a.diocese && `· ${a.diocese}`}</p>
                      <p className="text-xs text-stone-warm">{a.startDate || ''} – {a.endDate || 'Present'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Other Ministries */}
          <SectionCard title="Other Ministry Work">
            {profile.ministries.length === 0 ? (
              <p className="text-sm text-stone-warm">No additional ministry records.</p>
            ) : (
              <div className="space-y-4">
                {profile.ministries.map((m) => (
                  <div key={m.id} className="flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gold/15 text-gold flex items-center justify-center shrink-0"><HeartHandshake size={17} /></div>
                    <div>
                      <p className="font-medium text-sm">{m.title}</p>
                      {(m.organization || m.startDate) && <p className="text-sm text-stone-warm">{m.organization}{m.startDate && ` · ${m.startDate}`}{m.endDate && ` – ${m.endDate}`}</p>}
                      {m.description && <p className="text-xs text-stone-warm mt-0.5">{m.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {profile.additionalNotes && (
            <SectionCard title="Additional Notes">
              <p className="text-sm text-stone-warm leading-relaxed whitespace-pre-wrap">{profile.additionalNotes}</p>
            </SectionCard>
          )}
        </div>

        {/* Sidebar: review */}
        <div className="space-y-6">
          <SectionCard title="Review & Approval">
            <p className="text-sm text-stone-warm mb-4">
              Current status: <StatusBadge status={profile.status} />
            </p>
<Link href={`/${role === 'IT_ADMIN' ? 'it' : 'adp'}/priests/${id}/edit`} className="btn-primary w-full mb-4 bg-gold hover:bg-gold-light">
              <Pencil size={16} /> Edit This Record
            </Link>

            {profile.reviews.length > 0 && (
              <div className="mb-4 px-3 py-2 bg-cream rounded-lg space-y-2 border border-sand">
                {profile.reviews.slice(0, 3).map((r) => (
                  <div key={r.id} className="text-sm">
                    <p className="text-xs text-stone-warm">{formatDate(r.createdAt)} · by {r.reviewer.name || 'ADP'}</p>
                    <p className="font-medium text-sm text-burgundy">{r.action === 'APPROVED' ? 'Approved' : 'Rejected'} {r.notes && <span className="text-stone-warm font-normal">— {r.notes}</span>}</p>
                  </div>
                ))}
              </div>
            )}

            <label className="block text-sm font-medium mb-1.5">Review Notes (optional)</label>
            <textarea className="input-base min-h-24" placeholder="Add notes about this profile..." value={notes} onChange={(e) => setNotes(e.target.value)} />

            <div className="flex flex-col gap-2 mt-4">
              <button onClick={() => review('APPROVED')} disabled={busy} className="btn-primary w-full bg-green-700 hover:bg-green-800">
                {busy ? <Spinner /> : <><CheckCircle2 size={16} /> Approve Profile</>}
              </button>
              <button onClick={() => review('REJECTED')} disabled={busy} className="btn-secondary w-full border-red-200 text-red-700 hover:bg-red-50">
                {busy ? <Spinner /> : <><XCircle size={16} /> Reject Profile</>}
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Account">
            <p className="text-sm text-stone-warm">{profile.user.email}</p>
            <p className="text-xs text-stone-warm mt-1">Account created {formatDate(profile.user.createdAt)}</p>
          </SectionCard>
        </div>
      </div>
    </>
  )
}
