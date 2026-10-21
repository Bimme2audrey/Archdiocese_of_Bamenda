'use client'

import { useEffect, useState } from 'react'
import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageHeader, StatusBadge, Spinner, SectionCard } from '@/components/ui'
import ClergyAvatar from '@/components/ClergyAvatar'
import { ArrowLeft, CheckCircle2, XCircle, GraduationCap, Church, Briefcase, HeartHandshake, Phone, MapPin, CalendarDays, Pencil, Heart, BookOpen, AlertTriangle, Globe, Shield, FileText, KeyRound, Copy, Download } from 'lucide-react'
import { formatDate, ecclesiasticalStatusLabel, ecclesiasticalStatusColor } from '@/lib/utils'

interface Profile {
  id: string; userId: string; status: string
  photoUrl: string | null
  firstName: string | null; middleName: string | null; lastName: string | null
  dateOfBirth: string | null; placeOfBirth: string | null; nationality: string | null
  diocese: string | null; phoneNumber: string | null
  dateOfOrdination: string | null; placeOfOrdination: string | null
  ordinationBishop: string | null; diaconate: string | null
  additionalNotes: string | null; submittedAt: string | null
  approvedAt: string | null; rejectedAt: string | null
  ecclesiasticalStatus: string | null; dateOfDeath: string | null
  restingPlace: string | null; necrologyNotes: string | null
  emergencyContactName: string | null; emergencyContactPhone: string | null
  emergencyContactRelationship: string | null
  baptismDate: string | null; baptismParish: string | null
  confirmationDate: string | null; confirmationParish: string | null
  religiousCongregation: string | null; skills: string[]
  bloodGroup: string | null; allergies: string | null; medicalConditions: string | null
  nextOfKinName: string | null; nextOfKinPhone: string | null
  biography: string | null
  user: { name: string | null; email: string; createdAt: string }
  academicRecords: Array<{ id?: string; level: string | null; institution: string; degree: string; fieldOfStudy: string | null; startYear: string | null; endYear: string | null; country: string | null }>
  assignments: Array<{ id?: string; parish: string; diocese: string | null; role: string; startDate: string | null; endDate: string | null; isCurrent: boolean }>
  ministries: Array<{ id?: string; title: string; organization: string | null; description: string | null; startDate: string | null; endDate: string | null }>
  languages: Array<{ id?: string; language: string; spoken: string; written: string }>
  documents: Array<{ id?: string; name: string; type: string; uploadDate: string; fileSize: string; originalName?: string | null; fileUrl?: string | null; contentData?: string | null }>
  reviews: Array<{ id: string; action: string; notes: string | null; createdAt: string; reviewer: { name: string | null } }>
}

function InfoItem({ label, value, icon: Icon }: { label: string; value?: React.ReactNode | string | null; icon?: React.ElementType }) {
  return (
    <div>
      <p className="text-xs text-stone-warm mb-0.5 flex items-center gap-1">
        {Icon && <Icon size={12} />} {label}
      </p>
      <div className="font-medium text-sm">{value || '—'}</div>
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
  const [passwordReset, setPasswordReset] = useState('')

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

  async function resetPriestPassword() {
    if (!profile || !window.confirm(`Reset the password for ${fullName}? The priest will need to set a new password at next sign-in.`)) return
    setBusy(true)
    setError('')
    setPasswordReset('')
    try {
      const res = await fetch(`/api/admin/users/${profile.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-role': role },
        body: JSON.stringify({ action: 'RESET_PASSWORD' }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error || 'Could not reset password')
      else setPasswordReset(data.tempPassword)
    } catch {
      setError('Network error while resetting password')
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
          <SectionCard>
            <div className="flex items-center gap-4">
              <ClergyAvatar firstName={profile.firstName} lastName={profile.lastName} photoUrl={profile.photoUrl} size="lg" ecclesiasticalStatus={profile.ecclesiasticalStatus} />
              <div>
                <p className="font-semibold">{fullName}</p>
                <p className="text-sm text-stone-warm">Ordained {profile.dateOfOrdination || 'date not recorded'}</p>
              </div>
            </div>
          </SectionCard>
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

          {/* Sacramental Information */}
          {(profile.baptismDate || profile.confirmationDate || profile.religiousCongregation) && (
            <SectionCard title="Sacramental Information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profile.baptismDate && <InfoItem label="Baptism Date" value={profile.baptismDate} />}
                {profile.baptismParish && <InfoItem label="Baptism Parish" value={profile.baptismParish} />}
                {profile.confirmationDate && <InfoItem label="Confirmation Date" value={profile.confirmationDate} />}
                {profile.confirmationParish && <InfoItem label="Confirmation Parish" value={profile.confirmationParish} />}
                {profile.religiousCongregation && <InfoItem label="Religious Congregation" value={profile.religiousCongregation} icon={Church} />}
              </div>
            </SectionCard>
          )}

          {/* Academic Records */}
          <SectionCard title="Education & Formation">
            {profile.academicRecords.length === 0 ? (
              <p className="text-sm text-stone-warm">No academic records yet.</p>
            ) : (
              <div className="space-y-4">
                {profile.academicRecords.map((r, i) => (
                  <div key={r.id || i} className="flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gold/15 text-gold flex items-center justify-center shrink-0"><GraduationCap size={17} /></div>
                    <div>
                      <p className="font-medium text-sm">{r.degree}</p>
                      {r.level && <p className="text-xs font-medium uppercase text-burgundy">{r.level.replaceAll('_', ' ')}</p>}
                      <p className="text-sm text-stone-warm">{r.institution} · {r.country || '—'}</p>
                      <p className="text-xs text-stone-warm">{r.startYear || ''} – {r.endYear || ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Ordination */}
          <SectionCard title="Diaconate & Ordination">
            <div className="grid sm:grid-cols-2 gap-4">
              <InfoItem label="Date of Diaconate" value={profile.diaconate} icon={CalendarDays} />
              <InfoItem label="Date of Ordination" value={profile.dateOfOrdination} icon={CalendarDays} />
              <InfoItem label="Place of Ordination" value={profile.placeOfOrdination} icon={MapPin} />
              <InfoItem label="Ordaining Bishop" value={profile.ordinationBishop} />
            </div>
          </SectionCard>

          {/* Pastoral Assignments */}
          <SectionCard title="Pastoral Assignments">
            {profile.assignments.length === 0 ? (
              <p className="text-sm text-stone-warm">No pastoral assignments yet.</p>
            ) : (
              <div className="space-y-4">
                {profile.assignments.map((a, i) => (
                  <div key={a.id || i} className="flex gap-3">
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
                {profile.ministries.map((m, i) => (
                  <div key={m.id || i} className="flex gap-3">
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

          {/* Ecclesiastical Status & Necrology */}
          <SectionCard title="Ecclesiastical Status">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoItem label="Status" value={
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ecclesiasticalStatusColor(profile.ecclesiasticalStatus)}`}>
                  {ecclesiasticalStatusLabel(profile.ecclesiasticalStatus)}
                </span>
              } icon={Shield} />
              {profile.ecclesiasticalStatus === 'Deceased' && (
                <>
                  <InfoItem label="Date of Death" value={profile.dateOfDeath} icon={CalendarDays} />
                  <InfoItem label="Resting Place" value={profile.restingPlace} icon={MapPin} />
                </>
              )}
            </div>
            {profile.necrologyNotes && <p className="text-sm text-stone-warm mt-3 italic">"{profile.necrologyNotes}"</p>}
          </SectionCard>

          {/* Biography */}
          {profile.biography && (
            <SectionCard title="Biography">
              <p className="text-sm text-stone-warm leading-relaxed whitespace-pre-wrap">{profile.biography}</p>
            </SectionCard>
          )}

          {/* Skills & Languages */}
          <SectionCard title="Skills & Languages">
            {profile.skills && profile.skills.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-stone-warm mb-2 font-medium">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((s, i) => (<span key={i} className="inline-flex rounded-full bg-gold/10 text-gold border border-gold/20 px-2.5 py-0.5 text-xs font-medium">{s}</span>))}
                </div>
              </div>
            )}
            {profile.languages && profile.languages.length > 0 && (
              <div>
                <p className="text-xs text-stone-warm mb-2 font-medium">Languages</p>
                <div className="space-y-1.5">
                  {profile.languages.map((l, i) => (<div key={l.id || i} className="flex items-center justify-between text-sm"><span className="font-medium">{l.language}</span><span className="text-xs text-stone-warm">Spoken: {l.spoken} · Written: {l.written}</span></div>))}
                </div>
              </div>
            )}
            {(!profile.skills || profile.skills.length === 0) && (!profile.languages || profile.languages.length === 0) && (
              <p className="text-sm text-stone-warm">No skills or languages recorded.</p>
            )}
          </SectionCard>

          {/* Health Information */}
          {(profile.bloodGroup || profile.allergies || profile.medicalConditions) && (
            <SectionCard title="Health Information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profile.bloodGroup && <InfoItem label="Blood Group" value={profile.bloodGroup} icon={Heart} />}
                {profile.allergies && <InfoItem label="Allergies" value={profile.allergies} icon={AlertTriangle} />}
                {profile.medicalConditions && <InfoItem label="Medical Conditions" value={profile.medicalConditions} icon={AlertTriangle} />}
                {profile.nextOfKinName && <InfoItem label="Next of Kin" value={profile.nextOfKinName} />}
                {profile.nextOfKinPhone && <InfoItem label="Next of Kin Phone" value={profile.nextOfKinPhone} />}
              </div>
            </SectionCard>
          )}

          {/* Emergency Contact */}
          {(profile.emergencyContactName || profile.emergencyContactPhone) && (
            <SectionCard title="Emergency Contact">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoItem label="Contact Name" value={profile.emergencyContactName} icon={Phone} />
                <InfoItem label="Phone" value={profile.emergencyContactPhone} icon={Phone} />
                {profile.emergencyContactRelationship && <InfoItem label="Relationship" value={profile.emergencyContactRelationship} icon={Heart} />}
              </div>
            </SectionCard>
          )}

          {/* Documents */}
          {profile.documents && profile.documents.length > 0 && (
            <SectionCard title="Documents">
              <div className="space-y-2">
                {profile.documents.map((d, i) => (
                  <div key={d.id || i} className="flex items-center gap-3 p-2.5 rounded-lg border border-sand bg-cream/50">
                    <FileText size={16} className="text-stone-warm shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-stone-warm">{d.type} · {d.fileSize} · {d.uploadDate}</p>
                    </div>
                    {(d.fileUrl || d.contentData) && (
                      <a href={d.fileUrl || d.contentData!} target="_blank" rel="noopener noreferrer" download={d.originalName || d.name} className="btn-secondary shrink-0" aria-label={`Download ${d.name}`}>
                        <Download size={14} /> Download
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

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
            <button onClick={resetPriestPassword} disabled={busy} className="btn-secondary w-full mt-4">
              {busy ? <Spinner /> : <><KeyRound size={15} /> Reset Priest Password</>}
            </button>
            {passwordReset && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <p>Share this temporary passcode privately. It is shown only now.</p>
                <div className="mt-2 flex items-center justify-between gap-2 font-mono font-semibold">
                  <span>{passwordReset}</span>
                  <button type="button" onClick={() => navigator.clipboard.writeText(passwordReset)} className="btn-ghost" aria-label="Copy temporary passcode"><Copy size={15} /></button>
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </>
  )
}
