'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader, SectionCard, Spinner, EmptyState } from '@/components/ui'
import { ShieldCheck, Users, Plus, KeyRound, Power } from 'lucide-react'
import { roleLabel } from '@/lib/utils'

interface UserRow {
  id: string
  email: string
  name: string | null
  role: string
  isActive: boolean
}

export default function AdminUsersPanel({ role }: { role: string }) {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', email: '' })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [reveal, setReveal] = useState<{ userId: string; password: string } | null>(null)
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", { headers: { 'x-role': role } })
        const data = await res.json()
        if (data.user && data.user.role === "IT_ADMIN") {
          setAuthorized(true)
          load()
        } else {
          router.replace("/admin-dashboard")
        }
      } catch {
        router.replace("/login")
      }
    }
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    try {
      const res = await fetch('/api/admin/users', { headers: { 'x-role': role } })
      const data = await res.json()
      setUsers(data.users || [])
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  async function createAdmin(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError('')
    setMessage(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-role': role },
        body: JSON.stringify({ ...form, role: 'ADP_ADMIN' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed')
        setCreating(false)
        return
      }
      setMessage({ type: 'success', text: 'ADP Administrator created.' })
      setForm({ name: '', email: '' })
      setReveal({ userId: 'new', password: data.tempPassword })
      await load()
    } catch {
      setError('Network error')
    } finally {
      setCreating(false)
    }
  }

  async function userAction(id: string, action: string) {
    setMessage(null)
    setReveal(null)
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-role': role },
      body: JSON.stringify({ action }),
    })
    const data = await res.json()
    if (!res.ok) {
      setMessage({ type: 'error', text: data.error || 'Action failed' })
      return
    }
    if (action === 'RESET_PASSWORD') {
      setReveal({ userId: id, password: data.tempPassword })
      setMessage({ type: 'success', text: 'Password reset. New temporary passcode generated.' })
    } else {
      setMessage({ type: 'success', text: 'Updated successfully.' })
    }
    await load()
  }

  return (
    <>
      <PageHeader
        title="Manage Administrators"
        subtitle="IT Administrator control panel - create admins and manage credentials."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Create admin */}
        <div>
          <SectionCard title="Create ADP Administrator">
            <form onSubmit={createAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Name</label>
                <input className="input-base" placeholder="e.g. Rev. Joseph Kimani" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input type="email" required className="input-base" placeholder="admin@adpclergy.org" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>}
              <button type="submit" disabled={creating} className="btn-primary w-full">
                {creating ? <Spinner /> : <><Plus size={16} /> Create Administrator</>}
              </button>
            </form>
          </SectionCard>

          <div className="card card-shadow p-4 mt-4">
            <div className="flex items-center gap-2 text-sm font-medium text-burgundy mb-2">
              <ShieldCheck size={16} /> IT Backdoor Access
            </div>
            <p className="text-xs text-stone-warm leading-relaxed">
              The IT backdoor (<code className="text-burgundy">/it-login</code>) uses a recoverable master code for system recovery when other access is lost.
            </p>
          </div>
        </div>

        {/* Users list */}
        <div className="lg:col-span-2">
          <SectionCard title="All User Accounts">
            {message && (
              <div className={`rounded-lg border px-4 py-3 text-sm mb-4 ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
                {message.text}
              </div>
            )}

            {reveal && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 mb-4">
                {reveal.userId === 'new' ? 'New temporary passcode: ' : 'Temporary passcode: '}
                <span className="font-mono font-semibold">{reveal.password}</span>
                <p className="text-xs mt-1">Share this privately. The user will be prompted to set their own password.</p>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : users.length === 0 ? (
              <EmptyState icon={Users} title="No users" desc="Create your first administrator." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="table-header">User</th>
                      <th className="table-header">Role</th>
                      <th className="table-header">Status</th>
                      <th className="table-header">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="table-cell">
                          <p className="font-medium">{u.name || '-'}</p>
                          <p className="text-xs text-stone-warm">{u.email}</p>
                        </td>
                        <td className="table-cell">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${u.role === 'IT_ADMIN' ? 'bg-burgundy text-white' : u.role === 'ADP_ADMIN' ? 'bg-gold/20 text-burgundy' : 'bg-sand text-ink'}`}>
                            {roleLabel(u.role)}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                            <Power size={11} /> {u.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="table-cell">
                          {u.role === 'IT_ADMIN' ? (
                            <p className="text-xs text-stone-warm">Master account</p>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button onClick={() => userAction(u.id, 'RESET_PASSWORD')} className="inline-flex items-center gap-1 rounded-md bg-burgundy/10 text-burgundy px-2.5 py-1.5 text-xs font-medium hover:bg-burgundy/20">
                                <KeyRound size={12} /> Reset
                              </button>
                              <button onClick={() => userAction(u.id, 'TOGGLE_ACTIVE')} className="inline-flex items-center gap-1 rounded-md bg-sand text-ink px-2.5 py-1.5 text-xs font-medium hover:bg-sand/80">
                                <Power size={12} /> {u.isActive ? 'Suspend' : 'Activate'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </>
  )
}
