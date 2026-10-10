'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SectionCard, Spinner, StatusBadge } from '@/components/ui'
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react'
import ClergyAvatar from '@/components/ClergyAvatar'

interface ARow { level: string; institution: string; degree: string; fieldOfStudy: string; startYear: string; endYear: string; country: string }
interface ARow2 { parish: string; diocese: string; role: string; startDate: string; endDate: string; isCurrent: boolean }
interface MRow { title: string; organization: string; description: string; startDate: string; endDate: string }
interface LRow { language: string; spoken: string; written: string }
interface DRow { name: string; type: string; uploadDate: string; fileSize: string }

interface Form {
  accountName: string; accountEmail: string
  firstName: string; middleName: string; lastName: string
  dateOfBirth: string; placeOfBirth: string; nationality: string; diocese: string; phoneNumber: string
  photoUrl: string
  dateOfOrdination: string; placeOfOrdination: string; ordinationBishop: string; diaconate: string
  additionalNotes: string; ecclesiasticalStatus: string; dateOfDeath: string; restingPlace: string; necrologyNotes: string
  emergencyContactName: string; emergencyContactPhone: string; emergencyContactRelationship: string
  baptismDate: string; baptismParish: string; confirmationDate: string; confirmationParish: string; religiousCongregation: string
  skills: string[]; bloodGroup: string; allergies: string; medicalConditions: string; nextOfKinName: string; nextOfKinPhone: string
  biography: string
  academicRecords: ARow[]; assignments: ARow2[]; ministries: MRow[]; languages: LRow[]; documents: DRow[]
}

type TextFieldName = Exclude<keyof Form, 'skills' | 'academicRecords' | 'assignments' | 'ministries' | 'languages' | 'documents'>

function TextField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input type={type} className="input-base" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
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
            accountName: p.user?.name || '', accountEmail: p.user?.email || '',
            firstName: p.firstName || '', middleName: p.middleName || '', lastName: p.lastName || '',
            dateOfBirth: p.dateOfBirth || '', placeOfBirth: p.placeOfBirth || '', nationality: p.nationality || '',
            diocese: p.diocese || '', phoneNumber: p.phoneNumber || '', photoUrl: p.photoUrl || '',
            dateOfOrdination: p.dateOfOrdination || '', placeOfOrdination: p.placeOfOrdination || '',
            ordinationBishop: p.ordinationBishop || '', diaconate: p.diaconate || '',
            additionalNotes: p.additionalNotes || '', ecclesiasticalStatus: p.ecclesiasticalStatus || 'Active',
            dateOfDeath: p.dateOfDeath || '', restingPlace: p.restingPlace || '', necrologyNotes: p.necrologyNotes || '',
            emergencyContactName: p.emergencyContactName || '', emergencyContactPhone: p.emergencyContactPhone || '',
            emergencyContactRelationship: p.emergencyContactRelationship || '',
            baptismDate: p.baptismDate || '', baptismParish: p.baptismParish || '', confirmationDate: p.confirmationDate || '',
            confirmationParish: p.confirmationParish || '', religiousCongregation: p.religiousCongregation || '',
            skills: p.skills || [], bloodGroup: p.bloodGroup || '', allergies: p.allergies || '',
            medicalConditions: p.medicalConditions || '', nextOfKinName: p.nextOfKinName || '', nextOfKinPhone: p.nextOfKinPhone || '',
            biography: p.biography || '',
            academicRecords: p.academicRecords?.length ? p.academicRecords.map((r: any) => ({ level: r.level || '', institution: r.institution || '', degree: r.degree || '', fieldOfStudy: r.fieldOfStudy || '', startYear: r.startYear || '', endYear: r.endYear || '', country: r.country || '' })) : [{ level: '', institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '', country: '' }],
            assignments: p.assignments?.length ? p.assignments.map((a: any) => ({ parish: a.parish || '', diocese: a.diocese || '', role: a.role || '', startDate: a.startDate || '', endDate: a.endDate || '', isCurrent: a.isCurrent })) : [{ parish: '', diocese: '', role: '', startDate: '', endDate: '', isCurrent: false }],
            ministries: p.ministries?.length ? p.ministries.map((m: any) => ({ title: m.title || '', organization: m.organization || '', description: m.description || '', startDate: m.startDate || '', endDate: m.endDate || '' })) : [{ title: '', organization: '', description: '', startDate: '', endDate: '' }],
            languages: p.languages?.map((l: any) => ({ language: l.language || '', spoken: l.spoken || '', written: l.written || '' })) || [],
            documents: p.documents?.map((d: any) => ({ name: d.name || '', type: d.type || '', uploadDate: d.uploadDate || '', fileSize: d.fileSize || '' })) || [],
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

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setMessage('Choose an image smaller than 5 MB.')
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
        context?.drawImage(image, 0, 0, canvas.width, canvas.height)
        if (context) set('photoUrl', canvas.toDataURL('image/jpeg', 0.8))
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  function setArr(key: 'academicRecords' | 'assignments' | 'ministries' | 'languages' | 'documents', i: number, patch: any) {
    setForm((f) => {
      if (!f) return f
      const arr = [...(f[key] as any[])]
      arr[i] = { ...arr[i], ...patch }
      return { ...f, [key]: arr }
    })
  }

  function addRow(key: 'academicRecords' | 'assignments' | 'ministries' | 'languages' | 'documents') {
    const row =
      key === 'academicRecords' ? { level: '', institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '', country: '' }
      : key === 'assignments' ? { parish: '', diocese: '', role: '', startDate: '', endDate: '', isCurrent: false }
      : key === 'ministries' ? { title: '', organization: '', description: '', startDate: '', endDate: '' }
      : key === 'languages' ? { language: '', spoken: '', written: '' }
      : { name: '', type: '', uploadDate: new Date().toISOString().slice(0, 10), fileSize: '' }
    setForm((f) => (f ? { ...f, [key]: [...(f[key] as any[]), row] } : f))
  }

  function removeRow(key: 'academicRecords' | 'assignments' | 'ministries' | 'languages' | 'documents', i: number) {
    setForm((f) => {
      if (!f) return f
      const arr = [...(f[key] as any[])]
      if (arr.length === 1 && key !== 'languages' && key !== 'documents') return f
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

  const statusOptions = ['Active', 'Retired', 'Deceased', 'On Leave', 'Suspended']

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-stone-warm hover:text-ink">
          <ArrowLeft size={15} /> Back to record
        </button>
        <StatusBadge status={status} />
      </div>

      {message && <div className="rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3">{message}</div>}

      <SectionCard title="Account Access">
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField label="Account Name" value={form.accountName} onChange={(value) => set('accountName', value)} />
          <TextField label="Login Email" type="email" value={form.accountEmail} onChange={(value) => set('accountEmail', value)} />
        </div>
      </SectionCard>

      <SectionCard title="Personal Information">
        <div className="flex items-center gap-4 mb-5">
          <ClergyAvatar firstName={form.firstName} lastName={form.lastName} photoUrl={form.photoUrl} size="lg" ecclesiasticalStatus={form.ecclesiasticalStatus} />
          <label className="btn-secondary cursor-pointer">
            {form.photoUrl ? 'Change profile photo' : 'Upload profile photo'}
            <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
          </label>
          {form.photoUrl && <button type="button" onClick={() => set('photoUrl', '')} className="btn-ghost text-red-700">Remove photo</button>}
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div><label className="block text-sm font-medium mb-1.5">First Name</label><input className="input-base" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} /></div>
          <div><label className="block text-sm font-medium mb-1.5">Middle Name</label><input className="input-base" value={form.middleName} onChange={(e) => set('middleName', e.target.value)} /></div>
          <div><label className="block text-sm font-medium mb-1.5">Last Name</label><input className="input-base" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} /></div>
          <div><label className="block text-sm font-medium mb-1.5">Date of Birth</label><input type="date" className="input-base" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} /></div>
          <div><label className="block text-sm font-medium mb-1.5">Place of Birth</label><input className="input-base" value={form.placeOfBirth} onChange={(e) => set('placeOfBirth', e.target.value)} /></div>
          <div><label className="block text-sm font-medium mb-1.5">Nationality</label><input className="input-base" value={form.nationality} onChange={(e) => set('nationality', e.target.value)} /></div>
          <div><label className="block text-sm font-medium mb-1.5">Diocese</label><input className="input-base" value={form.diocese} onChange={(e) => set('diocese', e.target.value)} /></div>
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

      <SectionCard title="Ecclesiastical Status & Necrology">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Status</label>
            <select className="input-base" value={form.ecclesiasticalStatus} onChange={(e) => set('ecclesiasticalStatus', e.target.value)}>
              {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <TextField label="Date of Death" type="date" value={form.dateOfDeath} onChange={(value) => set('dateOfDeath', value)} />
          <TextField label="Resting Place" value={form.restingPlace} onChange={(value) => set('restingPlace', value)} />
          <TextField label="Necrology Notes" value={form.necrologyNotes} onChange={(value) => set('necrologyNotes', value)} />
        </div>
      </SectionCard>

      <SectionCard title="Sacramental Information">
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField label="Baptism Date" type="date" value={form.baptismDate} onChange={(value) => set('baptismDate', value)} />
          <TextField label="Baptism Parish" value={form.baptismParish} onChange={(value) => set('baptismParish', value)} />
          <TextField label="Confirmation Date" type="date" value={form.confirmationDate} onChange={(value) => set('confirmationDate', value)} />
          <TextField label="Confirmation Parish" value={form.confirmationParish} onChange={(value) => set('confirmationParish', value)} />
          <TextField label="Religious Congregation" value={form.religiousCongregation} onChange={(value) => set('religiousCongregation', value)} />
        </div>
      </SectionCard>

      <SectionCard title="Emergency Contact">
        <div className="grid sm:grid-cols-3 gap-4">
          <TextField label="Contact Name" value={form.emergencyContactName} onChange={(value) => set('emergencyContactName', value)} />
          <TextField label="Contact Phone" value={form.emergencyContactPhone} onChange={(value) => set('emergencyContactPhone', value)} />
          <TextField label="Relationship" value={form.emergencyContactRelationship} onChange={(value) => set('emergencyContactRelationship', value)} />
        </div>
      </SectionCard>

      <SectionCard title="Health & Next of Kin">
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField label="Blood Group" value={form.bloodGroup} onChange={(value) => set('bloodGroup', value)} />
          <TextField label="Allergies" value={form.allergies} onChange={(value) => set('allergies', value)} />
          <TextField label="Medical Conditions" value={form.medicalConditions} onChange={(value) => set('medicalConditions', value)} />
          <TextField label="Next of Kin Name" value={form.nextOfKinName} onChange={(value) => set('nextOfKinName', value)} />
          <TextField label="Next of Kin Phone" value={form.nextOfKinPhone} onChange={(value) => set('nextOfKinPhone', value)} />
        </div>
      </SectionCard>

      <SectionCard title="Additional Notes">
        <textarea className="input-base min-h-24" value={form.additionalNotes} onChange={(e) => set('additionalNotes', e.target.value)} />
      </SectionCard>
<SectionCard title="Academic Records" action={<button onClick={() => addRow('academicRecords')} className="btn-ghost text-burgundy"><Plus size={15} /> Add</button>}>
        {form.academicRecords.map((r, i) => (
          <div key={i} className="grid grid-cols-2 sm:grid-cols-7 gap-2 mb-3 items-center">
            <select className="input-base" value={r.level} onChange={(e) => setArr('academicRecords', i, { level: e.target.value })}>
              <option value="">Stage</option><option value="PRIMARY">Primary</option><option value="SECONDARY">Secondary</option>
              <option value="PHILOSOPHY">Philosophy</option><option value="THEOLOGY">Theology</option><option value="SEMINARY">Seminary</option>
              <option value="UNIVERSITY">University</option><option value="OTHER">Other</option>
            </select>
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

      <SectionCard title="Languages" action={<button onClick={() => addRow('languages')} className="btn-ghost text-burgundy"><Plus size={15} /> Add</button>}>
        {form.languages.length === 0 && <p className="text-sm text-stone-warm mb-3">No languages recorded.</p>}
        {form.languages.map((language, i) => (
          <div key={i} className="grid sm:grid-cols-4 gap-2 mb-3 items-center">
            <input className="input-base" placeholder="Language" value={language.language} onChange={(e) => setArr('languages', i, { language: e.target.value })} />
            <select className="input-base" value={language.spoken} onChange={(e) => setArr('languages', i, { spoken: e.target.value })}><option value="">Spoken level</option><option>Basic</option><option>Conversational</option><option>Fluent</option><option>Native</option></select>
            <select className="input-base" value={language.written} onChange={(e) => setArr('languages', i, { written: e.target.value })}><option value="">Written level</option><option>Basic</option><option>Conversational</option><option>Fluent</option><option>Native</option></select>
            <button type="button" onClick={() => removeRow('languages', i)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
          </div>
        ))}
      </SectionCard>

      <SectionCard title="Documents" action={<button onClick={() => addRow('documents')} className="btn-ghost text-burgundy"><Plus size={15} /> Add</button>}>
        {form.documents.length === 0 && <p className="text-sm text-stone-warm mb-3">No documents recorded.</p>}
        {form.documents.map((document, i) => (
          <div key={i} className="grid sm:grid-cols-5 gap-2 mb-3 items-center">
            <input className="input-base" placeholder="Document name" value={document.name} onChange={(e) => setArr('documents', i, { name: e.target.value })} />
            <select className="input-base" value={document.type} onChange={(e) => setArr('documents', i, { type: e.target.value })}><option value="">Document type</option><option>Ordination Certificate</option><option>Academic Certificate</option><option>ID Document</option><option>CV</option><option>Other</option></select>
            <input className="input-base" type="date" aria-label="Upload date" value={document.uploadDate} onChange={(e) => setArr('documents', i, { uploadDate: e.target.value })} />
            <input className="input-base" placeholder="File size" value={document.fileSize} onChange={(e) => setArr('documents', i, { fileSize: e.target.value })} />
            <button type="button" onClick={() => removeRow('documents', i)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
          </div>
        ))}
      </SectionCard>

      <SectionCard title="Skills & Biography">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Skills (comma separated)</label>
            <input className="input-base" value={form.skills.join(', ')} onChange={(e) => set('skills', e.target.value.split(',').map((skill) => skill.trim()).filter(Boolean))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Biography</label>
            <textarea className="input-base min-h-32" value={form.biography} onChange={(e) => set('biography', e.target.value)} />
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? <Spinner /> : <><Save size={16} /> Save Changes</>}
        </button>
      </div>
    </div>
  )
}