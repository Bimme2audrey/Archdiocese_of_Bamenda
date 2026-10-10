'use client'

import { useEffect, useState } from 'react'
import { PageHeader, StatusBadge, Spinner } from '@/components/ui'
import { ChevronLeft, ChevronRight, Save, Wifi, WifiOff, CheckCircle2, Send, GraduationCap, Briefcase, HeartHandshake, Plus, Trash2, UserRound } from 'lucide-react'
import { saveFormOffline, loadFormOffline, clearFormOffline } from '@/lib/offline'
import ClergyAvatar from '@/components/ClergyAvatar'

const steps = [
  { key: 'personal', label: 'Personal Info', icon: UserRound },
  { key: 'ordination', label: 'Ordination', icon: GraduationCap },
  { key: 'academic', label: 'Academic', icon: GraduationCap },
  { key: 'assignments', label: 'Assignments', icon: Briefcase },
  { key: 'ministries', label: 'Ministries', icon: HeartHandshake },
  { key: 'review', label: 'Review & Submit', icon: Send },
]

interface AcademicRecord { level: string; institution: string; degree: string; fieldOfStudy: string; startYear: string; endYear: string; country: string }
interface Assignment { parish: string; diocese: string; role: string; startDate: string; endDate: string; isCurrent: boolean }
interface Ministry { title: string; organization: string; description: string; startDate: string; endDate: string }

interface FormData {
  firstName: string; middleName: string; lastName: string
  dateOfBirth: string; placeOfBirth: string; nationality: string; diocese: string; phoneNumber: string
  photoUrl: string; baptismDate: string; baptismParish: string; confirmationDate: string; confirmationParish: string; religiousCongregation: string
  dateOfOrdination: string; placeOfOrdination: string; ordinationBishop: string; diaconate: string
  additionalNotes: string
  academicRecords: AcademicRecord[]
  assignments: Assignment[]
  ministries: Ministry[]
}

const emptyForm: FormData = {
  firstName: '', middleName: '', lastName: '',
  dateOfBirth: '', placeOfBirth: '', nationality: '', diocese: 'Archdiocese of Bamenda', phoneNumber: '',
  photoUrl: '', baptismDate: '', baptismParish: '', confirmationDate: '', confirmationParish: '', religiousCongregation: '',
  dateOfOrdination: '', placeOfOrdination: '', ordinationBishop: '', diaconate: '',
  additionalNotes: '',
  academicRecords: [{ level: '', institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '', country: '' }],
  assignments: [{ parish: '', diocese: '', role: '', startDate: '', endDate: '', isCurrent: false }],
  ministries: [{ title: '', organization: '', description: '', startDate: '', endDate: '' }],
}

export default function QuestionnaireForm({ role }: { role: string }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [status, setStatus] = useState('DRAFT')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [online, setOnline] = useState(true)
  const [offlineSaved, setOfflineSaved] = useState(false)

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    setOnline(navigator.onLine)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/profile', { headers: { 'x-role': role } })
        if (res.ok) {
          const { profile } = await res.json()
          if (profile) {
            setStatus(profile.status)
            if (profile.firstName || profile.lastName) {
              setForm({
                firstName: profile.firstName || '', middleName: profile.middleName || '', lastName: profile.lastName || '',
                dateOfBirth: profile.dateOfBirth || '', placeOfBirth: profile.placeOfBirth || '', nationality: profile.nationality || '',
                diocese: 'Archdiocese of Bamenda', phoneNumber: profile.phoneNumber || '',
                photoUrl: profile.photoUrl || '', baptismDate: profile.baptismDate || '', baptismParish: profile.baptismParish || '',
                confirmationDate: profile.confirmationDate || '', confirmationParish: profile.confirmationParish || '',
                religiousCongregation: profile.religiousCongregation || '',
                dateOfOrdination: profile.dateOfOrdination || '', placeOfOrdination: profile.placeOfOrdination || '',
                ordinationBishop: profile.ordinationBishop || '', diaconate: profile.diaconate || '',
                additionalNotes: profile.additionalNotes || '',
                academicRecords: profile.academicRecords?.length ? profile.academicRecords.map((r: any) => ({ level: r.level || '', institution: r.institution, degree: r.degree, fieldOfStudy: r.fieldOfStudy || '', startYear: r.startYear || '', endYear: r.endYear || '', country: r.country || '' })) : [{ level: '', institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '', country: '' }],
                assignments: profile.assignments?.length ? profile.assignments.map((a: any) => ({ parish: a.parish, diocese: a.diocese || '', role: a.role, startDate: a.startDate || '', endDate: a.endDate || '', isCurrent: a.isCurrent })) : [{ parish: '', diocese: '', role: '', startDate: '', endDate: '', isCurrent: false }],
                ministries: profile.ministries?.length ? profile.ministries.map((m: any) => ({ title: m.title, organization: m.organization || '', description: m.description || '', startDate: m.startDate || '', endDate: m.endDate || '' })) : [{ title: '', organization: '', description: '', startDate: '', endDate: '' }],
              })
            }
          }
        }
      } catch {
        const offline = await loadFormOffline('questionnaire')
        if (offline) {
          setForm({ ...emptyForm, ...offline.data })
          setOfflineSaved(true)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function updateField(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Choose an image smaller than 5 MB.' })
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        const scale = Math.min(1, 512 / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(image.width * scale)
        canvas.height = Math.round(image.height * scale)
        const context = canvas.getContext('2d')
        if (context) {
          context.drawImage(image, 0, 0, canvas.width, canvas.height)
          updateField('photoUrl', canvas.toDataURL('image/jpeg', 0.8))
        }
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  function updateArray<K extends 'academicRecords' | 'assignments' | 'ministries'>(key: K, index: number, patch: Partial<FormData[K][number]>) {
    setForm((f) => {
      const arr = [...(f[key] as any[])]
      arr[index] = { ...arr[index], ...patch }
      return { ...f, [key]: arr }
    })
  }

  function addRow(key: 'academicRecords' | 'assignments' | 'ministries') {
    setForm((f) => {
      const row =
        key === 'academicRecords' ? { level: '', institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '', country: '' }
        : key === 'assignments' ? { parish: '', diocese: '', role: '', startDate: '', endDate: '', isCurrent: false }
        : { title: '', organization: '', description: '', startDate: '', endDate: '' }
      return { ...f, [key]: [...(f[key] as any[]), row] }
    })
  }

  function removeRow(key: 'academicRecords' | 'assignments' | 'ministries', index: number) {
    setForm((f) => {
      const arr = [...(f[key] as any[])]
      if (arr.length === 1) return f
      arr.splice(index, 1)
      return { ...f, [key]: arr }
    })
  }

  async function saveDraft() {
    setMessage(null)
    setSaving(true)
    await saveFormOffline('questionnaire', form as unknown as Record<string, unknown>, step)
    setOfflineSaved(true)

    if (!online) {
      setMessage({ type: 'success', text: 'Saved offline. Will sync automatically when you are back online.' })
      setSaving(false)
      return
    }

    try {
      const res = await fetch('/api/profile/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-role': role },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to save draft' })
        setSaving(false)
        return
      }
      await clearFormOffline('questionnaire')
      setOfflineSaved(false)
      setMessage({ type: 'success', text: 'Draft saved successfully' })
    } catch {
      setMessage({ type: 'success', text: 'Saved offline. Will sync when you are back online.' })
    } finally {
      setSaving(false)
    }
  }

  async function submitProfile() {
    if (!form.firstName || !form.lastName || !form.dateOfOrdination) {
      setMessage({ type: 'error', text: 'Please complete at least your full name and date of ordination before submitting.' })
      setStep(0)
      return
    }
    setMessage(null)
    setSubmitting(true)

    if (!online) {
      await saveFormOffline('questionnaire', form as unknown as Record<string, unknown>, step)
      setMessage({ type: 'error', text: 'You are offline. Submit again once connected to the internet.' })
      setSubmitting(false)
      return
    }

    try {
      await fetch('/api/profile/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const res = await fetch('/api/profile/submit', { method: 'POST', headers: { 'x-role': role } })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Submission failed' })
      } else {
        setStatus('PENDING')
        await clearFormOffline('questionnaire')
        setOfflineSaved(false)
        setMessage({ type: 'success', text: 'Profile submitted! It will become active after ADP administration review and approval.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error during submission.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner /></div>
  }

  return (
    <>
      <PageHeader
        title="Clergy Questionnaire"
        subtitle="Complete your structured clergy profile. Data is saved locally even while offline."
        action={
          <div className="flex items-center gap-3">
            <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${online ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {online ? <Wifi size={13} /> : <WifiOff size={13} />}
              {online ? 'Online' : 'Offline'}
            </div>
            <StatusBadge status={status} />
          </div>
        }
      />

      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
        {steps.map((s, i) => (
          <button
            key={s.key}
            onClick={() => setStep(i)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              i === step ? 'bg-burgundy text-white' : i < step ? 'bg-sand/70 text-ink hover:bg-sand' : 'text-stone-warm'
            }`}
          >
            <s.icon size={14} />
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        ))}
      </div>

      {message && (
        <div className={`rounded-lg border px-4 py-3 text-sm mb-4 ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {offlineSaved && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 mb-4 flex items-center gap-2">
          <WifiOff size={15} /> You have unsynchronized offline data. When online, click Save Draft to sync.
        </div>
      )}

      <div className="card card-shadow p-6 lg:p-8">
        {step === 0 && (
          <div className="space-y-5">
            <p className="section-title">Personal Information</p>
            <div className="flex items-center gap-4">
              <ClergyAvatar firstName={form.firstName} lastName={form.lastName} photoUrl={form.photoUrl} size="lg" />
              <div className="space-y-2">
                <label className="btn-secondary cursor-pointer">
                  <UserRound size={15} /> {form.photoUrl ? 'Change profile photo' : 'Upload profile photo'}
                  <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
                </label>
                <p className="text-xs text-stone-warm">Image is resized before it is saved.</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">First Name *</label>
                <input className="input-base" value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Middle Name</label>
                <input className="input-base" value={form.middleName} onChange={(e) => updateField('middleName', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Last Name *</label>
                <input className="input-base" value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} />
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Date of Birth</label>
                <input type="date" className="input-base" value={form.dateOfBirth} onChange={(e) => updateField('dateOfBirth', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Place of Birth</label>
                <input className="input-base" value={form.placeOfBirth} onChange={(e) => updateField('placeOfBirth', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Nationality</label>
                <input className="input-base" value={form.nationality} onChange={(e) => updateField('nationality', e.target.value)} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Diocese / Archdiocese</label>
                <input className="input-base bg-sand/30 text-stone-warm cursor-not-allowed" value="Archdiocese of Bamenda" readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Phone Number</label>
                <input className="input-base" value={form.phoneNumber} onChange={(e) => updateField('phoneNumber', e.target.value)} />
              </div>
            </div>
            <div className="border-t border-sand pt-5 space-y-4">
              <p className="text-sm font-semibold">Sacramental Information</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Baptism Date</label>
                  <input type="date" className="input-base" value={form.baptismDate} onChange={(e) => updateField('baptismDate', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Baptism Parish</label>
                  <input className="input-base" value={form.baptismParish} onChange={(e) => updateField('baptismParish', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Confirmation Date</label>
                  <input type="date" className="input-base" value={form.confirmationDate} onChange={(e) => updateField('confirmationDate', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Confirmation Parish</label>
                  <input className="input-base" value={form.confirmationParish} onChange={(e) => updateField('confirmationParish', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Religious Congregation, if applicable</label>
                  <input className="input-base" value={form.religiousCongregation} onChange={(e) => updateField('religiousCongregation', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <p className="section-title">Ordination &amp; Diaconate</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Date of Ordination *</label>
                <input type="date" className="input-base" value={form.dateOfOrdination} onChange={(e) => updateField('dateOfOrdination', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Place of Ordination</label>
                <input className="input-base" value={form.placeOfOrdination} onChange={(e) => updateField('placeOfOrdination', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Ordaining Bishop</label>
                <input className="input-base" value={form.ordinationBishop} onChange={(e) => updateField('ordinationBishop', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Date of Diaconate</label>
                <input type="date" className="input-base" value={form.diaconate} onChange={(e) => updateField('diaconate', e.target.value)} />
              </div>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="section-title">Academic Formation</p>
              <button type="button" onClick={() => addRow('academicRecords')} className="btn-ghost text-burgundy"><Plus size={15} /> Add Record</button>
            </div>
            {form.academicRecords.map((r, i) => (
              <div key={i} className="rounded-lg border border-sand p-4 bg-cream/50 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-warm">Record {i + 1}</p>
                  <button type="button" onClick={() => removeRow('academicRecords', i)} className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <select className="input-base" value={r.level} onChange={(e) => updateArray('academicRecords', i, { level: e.target.value })}>
                    <option value="">Education stage</option>
                    <option value="PRIMARY">Primary school</option>
                    <option value="SECONDARY">Secondary school</option>
                    <option value="PHILOSOPHY">Philosophy</option>
                    <option value="THEOLOGY">Theology</option>
                    <option value="SEMINARY">Seminary / formation</option>
                    <option value="UNIVERSITY">University / college</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <input className="input-base" placeholder="Institution / Seminary" value={r.institution} onChange={(e) => updateArray('academicRecords', i, { institution: e.target.value })} />
                  <input className="input-base" placeholder="Degree / Diploma" value={r.degree} onChange={(e) => updateArray('academicRecords', i, { degree: e.target.value })} />
                  <input className="input-base" placeholder="Field of Study" value={r.fieldOfStudy} onChange={(e) => updateArray('academicRecords', i, { fieldOfStudy: e.target.value })} />
                  <input className="input-base" placeholder="Country" value={r.country} onChange={(e) => updateArray('academicRecords', i, { country: e.target.value })} />
                  <input className="input-base" placeholder="Start Year" value={r.startYear} onChange={(e) => updateArray('academicRecords', i, { startYear: e.target.value })} />
                  <input className="input-base" placeholder="End Year" value={r.endYear} onChange={(e) => updateArray('academicRecords', i, { endYear: e.target.value })} />
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="section-title">Pastoral Assignments</p>
              <button type="button" onClick={() => addRow('assignments')} className="btn-ghost text-burgundy"><Plus size={15} /> Add Assignment</button>
            </div>
            {form.assignments.map((a, i) => (
              <div key={i} className="rounded-lg border border-sand p-4 bg-cream/50 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-warm">Assignment {i + 1}</p>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-stone-warm">
                      <input type="checkbox" className="accent-burgundy" checked={a.isCurrent} onChange={(e) => updateArray('assignments', i, { isCurrent: e.target.checked })} />
                      Current
                    </label>
                    <button type="button" onClick={() => removeRow('assignments', i)} className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input className="input-base" placeholder="Parish / Institution" value={a.parish} onChange={(e) => updateArray('assignments', i, { parish: e.target.value })} />
                  <input className="input-base" placeholder="Role (e.g. Parish Priest)" value={a.role} onChange={(e) => updateArray('assignments', i, { role: e.target.value })} />
                  <input className="input-base" placeholder="Diocese" value={a.diocese} onChange={(e) => updateArray('assignments', i, { diocese: e.target.value })} />
                  <div className="grid grid-cols-2 gap-3">
                    <input className="input-base" placeholder="Start" value={a.startDate} onChange={(e) => updateArray('assignments', i, { startDate: e.target.value })} />
                    <input className="input-base" placeholder="End" value={a.endDate} onChange={(e) => updateArray('assignments', i, { endDate: e.target.value })} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {step === 4 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="section-title">Other Ministry Work</p>
              <button type="button" onClick={() => addRow('ministries')} className="btn-ghost text-burgundy"><Plus size={15} /> Add Ministry</button>
            </div>
            {form.ministries.map((m, i) => (
              <div key={i} className="rounded-lg border border-sand p-4 bg-cream/50 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-warm">Ministry {i + 1}</p>
                  <button type="button" onClick={() => removeRow('ministries', i)} className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input className="input-base" placeholder="Title / Role" value={m.title} onChange={(e) => updateArray('ministries', i, { title: e.target.value })} />
                  <input className="input-base" placeholder="Organization" value={m.organization} onChange={(e) => updateArray('ministries', i, { organization: e.target.value })} />
                  <input className="input-base" placeholder="Start" value={m.startDate} onChange={(e) => updateArray('ministries', i, { startDate: e.target.value })} />
                  <input className="input-base" placeholder="End" value={m.endDate} onChange={(e) => updateArray('ministries', i, { endDate: e.target.value })} />
                </div>
                <textarea className="input-base min-h-16" placeholder="Description of responsibilities..." value={m.description} onChange={(e) => updateArray('ministries', i, { description: e.target.value })} />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium mb-1.5">Additional Notes</label>
              <textarea className="input-base min-h-24" placeholder="Any other relevant information..." value={form.additionalNotes} onChange={(e) => updateField('additionalNotes', e.target.value)} />
            </div>
          </div>
        )}
        {step === 5 && (
          <div className="space-y-6">
            <p className="section-title">Review &amp; Submit</p>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-lg border border-sand bg-cream/50">
                <p className="text-xs text-stone-warm mb-2">Personal</p>
                <p className="font-medium">{form.firstName} {form.middleName} {form.lastName}</p>
                <p className="text-stone-warm">{form.dateOfBirth && `Born ${form.dateOfBirth}`}{form.placeOfBirth && ` · ${form.placeOfBirth}`}</p>
              </div>
              <div className="p-4 rounded-lg border border-sand bg-cream/50">
                <p className="text-xs text-stone-warm mb-2">Ordination</p>
                <p className="font-medium">{form.dateOfOrdination || 'Not set'}</p>
                <p className="text-stone-warm">{form.placeOfOrdination}</p>
                <p className="text-stone-warm">{form.ordinationBishop}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-warm">Academic Records ({form.academicRecords.filter((r) => r.institution).length})</p>
              <div className="flex flex-wrap gap-2">
                {form.academicRecords.filter((r) => r.institution).map((r, i) => (
                  <span key={i} className="rounded-full bg-gold/15 text-burgundy px-3 py-1 text-xs font-medium">{r.degree} · {r.institution}</span>
                ))}
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-warm pt-3">Pastoral Assignments ({form.assignments.filter((a) => a.parish).length})</p>
              <div className="flex flex-wrap gap-2">
                {form.assignments.filter((a) => a.parish).map((a, i) => (
                  <span key={i} className="rounded-full bg-burgundy/10 text-burgundy px-3 py-1 text-xs font-medium">{(a.role || 'Priest')} · {a.parish}{a.isCurrent && ' (Current)'}</span>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              Your profile becomes fully active only after review and approval by ADP administrators.
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-sand">
          <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="btn-secondary disabled:opacity-40">
            <ChevronLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-3">
            <button type="button" onClick={saveDraft} disabled={saving} className="btn-ghost">
              {saving ? <Spinner /> : <><Save size={16} /> Save Draft</>}
            </button>
            {step < steps.length - 1 ? (
              <button type="button" onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))} className="btn-primary">
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button type="button" onClick={submitProfile} disabled={submitting} className="btn-primary bg-green-700 hover:bg-green-800">
                {submitting ? <Spinner /> : <><Send size={16} /> Submit for Review</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
