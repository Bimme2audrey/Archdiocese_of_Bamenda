'use client'

import { useEffect, useState } from 'react'
import { PageHeader, SectionCard, Spinner, EmptyState } from '@/components/ui'
import { Users, Send, CheckCircle2, Edit3, UserPlus, Copy, Mail } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

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
  const [sendEmail, setSendEmail] = useState(true)
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resultPassword, setResultPassword] = useState('')
  const [resultProfileId, setResultProfileId] = useState('')
  const [resultInviteUrl, setResultInviteUrl] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [copied, setCopied] = useState('')

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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setResultPassword('')
    setResultInviteUrl('')
    setCopied('')
    setSending(true)
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-role': role },
        body: JSON.stringify({ name, email, sendEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create account')
        setSending(false)
        return
      }
      const wasEmailSent = data.emailSent !== false
      setEmailSent(wasEmailSent)
      setResultPassword(data.tempPassword)
      setResultProfileId(data.profileId || '')
      setResultInviteUrl(data.inviteUrl || '')
      setEmail('')
      setName('')
      setSuccess(wasEmailSent
        ? 'Invitation email sent! The priest has been notified.'
        : 'Account created — no email was sent. Share the credentials below with the priest directly.')
      await loadInvitations()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 2000)
  }

  const pending = invitations.filter((i) => !i.usedAt)

  return (
    <>
      <PageHeader
        title="Priest Accounts"
        subtitle="Create a priest account & profile. Send an email invitation or create silently and share credentials manually."
      />

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <SectionCard title="New Account">
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Priest Full Name</label>
                <input className="input-base" placeholder="Rev. Jane Smith" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email Address</label>
                <input type="email" required className="input-base" placeholder="priest@archdiocese.org" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              {/* Mode Toggle */}
              <div className="rounded-lg border border-sand p-4 space-y-3 bg-cream/50">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${sendEmail ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                    {sendEmail ? <Mail size={18} /> : <UserPlus size={18} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{sendEmail ? 'Send Email Invitation' : 'Create Without Email'}</p>
                    <p className="text-xs text-stone-warm">
                      {sendEmail
                        ? 'The priest receives credentials and a direct link via email.'
                        : 'Account is created silently. You share the credentials yourself.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSendEmail(!sendEmail)}
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${sendEmail ? 'bg-burgundy' : 'bg-stone-300'}`}
                  >
                    <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${sendEmail ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>}

              {success && (
                <div className={`rounded-lg border text-sm px-4 py-3 flex items-start gap-2 ${emailSent ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                  <div className="space-y-2 w-full min-w-0">
                    <p>{success}</p>
                    <div className="rounded-md bg-white/70 border border-sand p-3 space-y-1.5">
                      <p className="text-xs font-semibold text-stone-warm uppercase tracking-wide">Login Credentials</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs"><span className="text-stone-warm">Email:</span> <span className="font-mono font-medium">{email || '—'}</span></p>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs"><span className="text-stone-warm">Passcode:</span> <span className="font-mono font-semibold text-burgundy">{resultPassword}</span></p>
                        <button type="button" onClick={() => copyToClipboard(resultPassword, 'passcode')} className="text-xs text-burgundy hover:underline shrink-0 flex items-center gap-1">
                          <Copy size={11} /> {copied === 'passcode' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      {resultInviteUrl && (
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-sand/50">
                          <p className="text-xs truncate text-stone-warm">Link: <span className="font-mono">{resultInviteUrl}</span></p>
                          <button type="button" onClick={() => copyToClipboard(resultInviteUrl, 'link')} className="text-xs text-burgundy hover:underline shrink-0 flex items-center gap-1">
                            <Copy size={11} /> {copied === 'link' ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      )}
                    </div>
                    {resultProfileId && role === 'ADP_ADMIN' && (
                      <Link href={`/adp/priests/${resultProfileId}`} className="inline-flex items-center gap-1.5 rounded-md bg-burgundy text-white px-3 py-1.5 text-xs font-medium hover:bg-burgundy/90 transition">
                        <Edit3 size={13} /> Fill In Priest Profile Now
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <button type="submit" disabled={sending} className={`btn-primary w-full ${!sendEmail ? 'bg-amber-700 hover:bg-amber-800' : ''}`}>
                {sending ? <Spinner /> : sendEmail ? <><Send size={16} /> Create Account & Send Email</> : <><UserPlus size={16} /> Create Account Only</>}
              </button>
            </form>
          </SectionCard>
        </div>

        <div className="lg:col-span-3">
          <SectionCard title="Sent Invitations" action={<span className="text-xs text-stone-warm">{pending.length} pending</span>}>
            {loading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : invitations.length === 0 ? (
              <EmptyState icon={Users} title="No invitations yet" desc="Create your first priest account to begin building the clergy records." />
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
