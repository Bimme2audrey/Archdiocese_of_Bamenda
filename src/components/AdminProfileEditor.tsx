'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SectionCard, Spinner, StatusBadge } from '@/components/ui'
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react'

interface ARow { institution: string; degree: string; fieldOfStudy: string; startYear: string; endYear: string; country: string }
interface ARow2 { parish: string; diocese: string; role: string; startDate: string; endDate: string; isCurrent: boolean }
interface MRow { title: string; organization: string; description: string; startDate: string; endDate: string }

interface Form {
  firstName: string; middleName: string; lastName: string
  dateOfBirth: string; placeOfBirth: string; nationality: string; diocese: string; phoneNumber: string
  dateOfOrdination: string; placeOfOrdination: string; ordinationBishop: string; diaconate: string
  additionalNotes: string
  academicRecords: ARow[]; assignments: ARow2[]; ministries: MRow[]
}

export default function AdminProfileEditor({ role }: { role: string }) {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [form, setForm] = useState<Form | null>(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/priests/${id}`, { headers: { 'x-role': role } })
        const data = await res.json()
        const p = data.profile
        if (p) {
          setStatus(p.status)
          setForm({
            firstName: p.firstName || '', middleName: p.middleName || '', lastName: p.lastName || '',
            dateOfBirth: p.dateOfBirth || '', placeOfBirth: p.placeOfBirth || '', nationality: p.nationality || '',
            diocese: p.diocese || '', phoneNumber: p.phoneNumber || '',
            dateOfOrdination: p.dateOfOrdination || '', placeOfOrdination: p.placeOfOrdination || '',
            ordinationBishop: p.ordinationBishop || '', diaconate: p.diaconate || '',
            additionalNotes: p.additionalNotes || '',
            academicRecords: p.academicRecords?.length ? p.academicRecords.map((r: any) => ({ institution: r.institution || '', degree: r.degree || '', fieldOfStudy: r.fieldOfStudy || '', startYear: r.startYear || '', endYear: r.endYear || '', country: r.country || '' })) : [{ institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '', country: '' }],
            assignments: p.assignments?.length ? p.assignments.map((a: any) => ({ parish: a.parish || '', diocese: a.diocese || '', role: a.role || '', startDate: a.startDate || '', endDate: a.endDate || '', isCurrent: a.isCurrent })) : [{ parish: '', diocese: '', role: '', startDate: '', endDate: '', isCurrent: false }],
            ministries: p.ministries?.length ? p.ministries.map((m: any) => ({ title: m.title || '', organization: m.organization || '', description: m.description || '', startDate: m.startDate || '', endDate: m.endDate || '' })) : [{ title: '', organization: '', description: '', startDate: '', endDate: '' }],
          })
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f))
  }

  function setArr(key: 'academicRecords' | 'assignments' | 'ministries', i: number, patch: any) {
    setForm((f) => {
      if (!f) return f
      const arr = [...(f[key] as any[])]
      arr[i] = { ...arr[i], ...patch }
      return { ...f, [key]: arr }
    })
  }

  function addRow(key: 'academicRecords' | 'assignments' | 'ministries') {
    const row =
      key === 'academicRecords' ? { institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '', country: '' }
      : key === 'assignments' ? { parish: '', diocese: '', role: '', startDate: '', endDate: '', isCurrent: false }
      : { title: '', organization: '', description: '', startDate: '', endDate: '' }
    setForm((f) => (f ? { ...f, [key]: [...(f[key] as any[]), row] } : f))
  }

  function removeRow(key: 'academicRecords' | 'assignments' | 'ministries', i: number) {
    setForm((f) => {
      if (!f) return f
      const arr = [...(f[key] as any[])]
      if (arr.length === 1) return f
      arr.splice(i, 1)
      return { ...f, [key]: arr }
    })
  }

  async function save() {
    if (!form) return
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch(`/api/admin/priests/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-role': role },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data.error || 'Failed to save')
      } else {
        setMessage('Record updated successfully.')
      }
    } catch {
      setMessage('Network error')
    } finally {
      setSaving(false)
    }
  }
if (loading) return <div className="flex justify-center py-20"><Spinner /></div>
  if (!form) return <p className="text-stone-warm">Could not load this record.</p>

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-stone-warm hover:text-ink">
          <ArrowLeft size={15} /> Back to record
        </button>
        <StatusBadge status={status} />
      </div>

      {message && <div className="rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3">{message}</div>}

      <SectionCard title="Personal Information">
        <div className="grid sm:grid-cols-3 gap-4">
          <div><label className="block text-sm font-medium mb-1.5">First Name</label><input className="input-base" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} /></div>
          <div><label className="block text-sm font-medium mb-1.5">Middle Name</label><input className="input-base" value={form.middleName} onChange={(e) => set('middleName', e.target.value)} /></div>
          <div><label className="block text-sm font-medium mb-1.5">Last Name</label><input className="input-base" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} /></div>
          <div><label className="block text-sm font-medium mb-1.5">Date of Birth</label><input type="date" className="input-base" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} /></div>
          <div><label className="block text-sm font-medium mb-1.5">Place of Birth</label><input className="input-base" value={form.placeOfBirth} onChange={(e) => set('placeOfBirth', e.target.value)} /></div>
          <div><label className="block text-sm font-medium mb-1.5">Nationality</label><input className="input-base" value={form.nationality} onChange={(e) => set('nationality', e.target.value)} /></div>
          <div><label className="block text-sm font-medium mb-1.5">Diocese</label><input className="input-base bg-sand/30 text-stone-warm cursor-not-allowed" value="Archdiocese of Bamenda" readOnly /></div>
          <div><label className="block text-sm font-medium mb-1.5">Phone</label><input className="input-base" value={form.phoneNumber} onChange={(e) => set('phoneNumber', e.target.value)} /></div>
        </div>
      </SectionCard>

      <SectionCard title="Ordination">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1.5">Date of Ordination</label><input type="date" className="input-base" value={form.dateOfOrdination} onChange={(e) => set('dateOfOrdination', e.target.value)} /></div>
          <div><label className="block text-sm font-medium mb-1.5">Place of Ordination</label><input className="input-base" value={form.placeOfOrdination} onChange={(e) => set('placeOfOrdination', e.target.value)} /></div>
          <div><label className="block text-sm font-medium mb-1.5">Ordaining Bishop</label><input className="input-base" value={form.ordinationBishop} onChange={(e) => set('ordinationBishop', e.target.value)} /></div>
          <div><label className="block text-sm font-medium mb-1.5">Diaconate</label><input type="date" className="input-base" value={form.diaconate} onChange={(e) => set('diaconate', e.target.value)} /></div>
        </div>
      </SectionCard>

      <SectionCard title="Additional Notes">
        <textarea className="input-base min-h-24" value={form.additionalNotes} onChange={(e) => set('additionalNotes', e.target.value)} />
      </SectionCard>
<SectionCard title="Academic Records" action={<button onClick={() => addRow('academicRecords')} className="btn-ghost text-burgundy"><Plus size={15} /> Add</button>}>
        {form.academicRecords.map((r, i) => (
          <div key={i} className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-3 items-center">
            <input className="input-base sm:col-span-2" placeholder="Institution" value={r.institution} onChange={(e) => setArr('academicRecords', i, { institution: e.target.value })} />
            <input className="input-base" placeholder="Degree" value={r.degree} onChange={(e) => setArr('academicRecords', i, { degree: e.target.value })} />
            <input className="input-base" placeholder="Field" value={r.fieldOfStudy} onChange={(e) => setArr('academicRecords', i, { fieldOfStudy: e.target.value })} />
            <input className="input-base" placeholder="Start" value={r.startYear} onChange={(e) => setArr('academicRecords', i, { startYear: e.target.value })} />
            <input className="input-base" placeholder="End" value={r.endYear} onChange={(e) => setArr('academicRecords', i, { endYear: e.target.value })} />
            <button onClick={() => removeRow('academicRecords', i)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
          </div>
        ))}
      </SectionCard>

      <SectionCard title="Pastoral Assignments" action={<button onClick={() => addRow('assignments')} className="btn-ghost text-burgundy"><Plus size={15} /> Add</button>}>
        {form.assignments.map((a, i) => (
          <div key={i} className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-3 items-center">
            <input className="input-base sm:col-span-2" placeholder="Parish" value={a.parish} onChange={(e) => setArr('assignments', i, { parish: e.target.value })} />
            <input className="input-base" placeholder="Role" value={a.role} onChange={(e) => setArr('assignments', i, { role: e.target.value })} />
            <input className="input-base" placeholder="Start" value={a.startDate} onChange={(e) => setArr('assignments', i, { startDate: e.target.value })} />
            <input className="input-base" placeholder="End" value={a.endDate} onChange={(e) => setArr('assignments', i, { endDate: e.target.value })} />
            <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" className="accent-burgundy" checked={a.isCurrent} onChange={(e) => setArr('assignments', i, { isCurrent: e.target.checked })} /> Current</label>
            <button onClick={() => removeRow('assignments', i)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
          </div>
        ))}
      </SectionCard>

      <SectionCard title="Other Ministries" action={<button onClick={() => addRow('ministries')} className="btn-ghost text-burgundy"><Plus size={15} /> Add</button>}>
        {form.ministries.map((m, i) => (
          <div key={i} className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3 items-center">
            <input className="input-base sm:col-span-2" placeholder="Title" value={m.title} onChange={(e) => setArr('ministries', i, { title: e.target.value })} />
            <input className="input-base" placeholder="Organization" value={m.organization} onChange={(e) => setArr('ministries', i, { organization: e.target.value })} />
            <input className="input-base" placeholder="Start" value={m.startDate} onChange={(e) => setArr('ministries', i, { startDate: e.target.value })} />
            <input className="input-base" placeholder="End" value={m.endDate} onChange={(e) => setArr('ministries', i, { endDate: e.target.value })} />
            <button onClick={() => removeRow('ministries', i)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
          </div>
        ))}
      </SectionCard>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? <Spinner /> : <><Save size={16} /> Save Changes</>}
        </button>
      </div>
    </div>
  )
}