'use client'

import { useEffect, useState } from 'react'
import { PageHeader, SectionCard, Spinner, EmptyState } from '@/components/ui'
import { Users, Send, CheckCircle2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Invitation {
  id: string
  email: string
  sentAt: string
  expiresAt: string
  usedAt: string | null
  user: { name: string | null; priestProfile: { status: string } | null } | null
}

export default function InvitePanel({ role }: { role: string }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resultPassword, setResultPassword] = useState('')

  async function loadInvitations() {
    try {
      const res = await fetch('/api/admin/invitations', { headers: { 'x-role': role } })
      const data = await res.json()
      setInvitations(data.invitations || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvitations()
  }, [])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setResultPassword('')
    setSending(true)
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-role': role },
        body: JSON.stringify({ name, email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send invitation')
        setSending(false)
        return
      }
      setSuccess('Invitation created. A user account with a temporary passcode was created.')
      setResultPassword(data.tempPassword)
      setEmail('')
      setName('')
      await loadInvitations()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const pending = invitations.filter((i) => !i.usedAt)

  return (
    <>
      <PageHeader
        title="Invite Priests"
        subtitle="Send an invitation that automatically creates a user account and temporary passcode."
      />

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <SectionCard title="New Invitation">
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Priest Full Name</label>
                <input className="input-base" placeholder="Rev. Jane Smith" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email Address</label>
                <input type="email" required className="input-base" placeholder="priest@archdiocese.org" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>}

              {success && (
                <div className="rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                  <div>
                    <p>{success}</p>
                    {resultPassword && (
                      <p className="mt-1 text-xs">
                        Temporary passcode: <span className="font-mono font-semibold">{resultPassword}</span>
                      </p>
                    )}
                    <p className="mt-1 text-xs text-stone-warm">
                      If email is not configured, share this passcode and the invitation link with the priest directly.
                    </p>
                  </div>
                </div>
              )}

              <button type="submit" disabled={sending} className="btn-primary w-full">
                {sending ? <Spinner /> : <><Send size={16} /> Send Invitation</>}
              </button>
              <div className="text-xs text-stone-warm">
                The priest uses the temporary passcode and the invitation link to set up their account.
              </div>
            </form>
          </SectionCard>
        </div>

        <div className="lg:col-span-3">
          <SectionCard title="Sent Invitations" action={<span className="text-xs text-stone-warm">{pending.length} pending</span>}>
            {loading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : invitations.length === 0 ? (
              <EmptyState icon={Users} title="No invitations yet" desc="Send your first invitation to begin building the clergy records." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="table-header">Email</th>
                      <th className="table-header">Status</th>
                      <th className="table-header">Sent</th>
                      <th className="table-header">Expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map((inv) => (
                      <tr key={inv.id}>
                        <td className="table-cell">
                          <p className="font-medium">{inv.user?.name || inv.email}</p>
                          <p className="text-xs text-stone-warm">{inv.email}</p>
                        </td>
                        <td className="table-cell">
                          {inv.usedAt ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-xs font-medium">
                              <CheckCircle2 size={12} /> Accepted
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2.5 py-0.5 text-xs font-medium">Pending</span>
                          )}
                        </td>
                        <td className="table-cell text-stone-warm">{formatDate(inv.sentAt)}</td>
                        <td className="table-cell text-stone-warm">{formatDate(inv.expiresAt)}</td>
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
