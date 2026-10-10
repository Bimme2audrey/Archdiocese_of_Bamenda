'use client'

import { useEffect, useState } from 'react'
import { PageHeader, SectionCard, Spinner, EmptyState } from '@/components/ui'
import { Users, Send, CheckCircle2, Edit3, UserPlus, Copy, Mail, MessageCircle, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface Invitation {
  id: string
  email: string | null
  sentAt: string
  expiresAt: string
  usedAt: string | null
  deliveryMethod: string
  emailSentAt: string | null
  whatsappSentAt: string | null
  user: { name: string | null; tempPassword: boolean; priestProfile: { status: string; phoneNumber: string | null } | null } | null
}

export default function InvitePanel({ role }: { role: string }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'whatsapp' | 'both'>('email')
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resultPassword, setResultPassword] = useState('')
  const [resultProfileId, setResultProfileId] = useState('')
  const [resultInvitationId, setResultInvitationId] = useState('')
  const [resultInviteUrl, setResultInviteUrl] = useState('')
  const [resultName, setResultName] = useState('')
  const [resultEmail, setResultEmail] = useState('')
  const [resultPhoneNumber, setResultPhoneNumber] = useState('')
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
    const needsEmail = deliveryMethod !== 'whatsapp'
    const needsPhone = deliveryMethod !== 'email'
    if (needsEmail && !email.trim()) {
      setError('Enter an email address or choose WhatsApp delivery.')
      return
    }
    if (needsPhone && !phoneNumber.trim()) {
      setError('Enter a WhatsApp number for this delivery option.')
      return
    }
    setError('')
    setSuccess('')
    setResultPassword('')
    setResultInviteUrl('')
    setResultName('')
    setResultEmail('')
    setResultPhoneNumber('')
    setCopied('')
    setSending(true)
    const whatsappWindow = needsPhone ? window.open('about:blank', '_blank') : null
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-role': role },
        body: JSON.stringify({ name, email, phoneNumber, deliveryMethod: deliveryMethod.toUpperCase() }),
      })
      const data = await res.json()
      if (!res.ok) {
        whatsappWindow?.close()
        setError(data.error || 'Failed to create account')
        setSending(false)
        return
      }
      const wasEmailSent = data.emailSent !== false
      setEmailSent(wasEmailSent)
      setResultPassword(data.tempPassword)
      setResultProfileId(data.profileId || '')
      setResultInvitationId(data.invitation?.id || '')
      setResultInviteUrl(data.inviteUrl || '')
      setResultName(name)
      setResultEmail(email)
      setResultPhoneNumber(data.phoneNumber || phoneNumber)
      setEmail('')
      setName('')
      setPhoneNumber('')
      setSuccess(data.emailPreview
        ? 'Email was not sent: SMTP is not configured, so only a server preview was generated.'
        : data.emailError
          ? data.emailError
          : wasEmailSent && needsPhone
            ? 'Invitation email sent. A WhatsApp message is open; review and send it there.'
            : wasEmailSent
              ? 'Invitation email sent.'
              : 'A WhatsApp message is open; review and send it there. It will remain Not sent until confirmed below.')
      const whatsappUrl = getWhatsAppUrl(data.phoneNumber || phoneNumber, name, email, data.tempPassword, data.inviteUrl)
      if (whatsappWindow && whatsappUrl) {
        whatsappWindow.location.href = whatsappUrl
      }
      await loadInvitations()
    } catch {
      whatsappWindow?.close()
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

  function getWhatsAppUrl(phone: string, invitedName: string, invitedEmail: string, password: string, inviteUrl: string) {
    const recipient = phone.replace(/\D/g, '')
    if (!recipient) return

    const message = [
      `Hello${invitedName ? ` ${invitedName}` : ''},`,
      '',
      'You have been invited to complete your ADP clergy profile.',
      invitedEmail ? `Email: ${invitedEmail}` : `WhatsApp number: +${recipient}`,
      `Temporary passcode: ${password}`,
      `Open your invitation: ${inviteUrl}`,
    ].join('\n')

    return `https://wa.me/${recipient}?text=${encodeURIComponent(message)}`
  }

  function openWhatsApp() {
    const url = getWhatsAppUrl(resultPhoneNumber, resultName, resultEmail, resultPassword, resultInviteUrl)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function markWhatsAppSent(id: string) {
    const res = await fetch(`/api/admin/invitations/${id}`, {
      method: 'PATCH',
      headers: { 'x-role': role },
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Could not update invitation status')
      return
    }
    await loadInvitations()
    setSuccess('WhatsApp delivery recorded.')
  }

  async function prepareWhatsApp(invitation: Invitation) {
    const whatsappWindow = window.open('about:blank', '_blank')
    const res = await fetch(`/api/admin/invitations/${invitation.id}`, {
      method: 'POST',
      headers: { 'x-role': role },
    })
    const data = await res.json()
    if (!res.ok) {
      whatsappWindow?.close()
      setError(data.error || 'Could not prepare WhatsApp invitation')
      return
    }
    const invitedName = invitation.user?.name || ''
    const phone = invitation.user?.priestProfile?.phoneNumber || ''
    setResultInvitationId(invitation.id)
    setResultName(invitedName)
    setResultPhoneNumber(phone)
    setResultEmail(invitation.email || '')
    setResultPassword(data.tempPassword)
    setResultInviteUrl(data.inviteUrl)
    setSuccess('A fresh temporary passcode was created. Send the prepared WhatsApp message, then confirm delivery.')
    const url = getWhatsAppUrl(phone, invitedName, invitation.email || '', data.tempPassword, data.inviteUrl)
    if (url && whatsappWindow) whatsappWindow.location.href = url
    await loadInvitations()
  }

  async function deleteInvitation(invitation: Invitation) {
    const removeAccount = !invitation.usedAt && invitation.user?.tempPassword
    const confirmed = window.confirm(removeAccount
      ? 'Delete this invitation? If its account is still unused and its profile is blank, that account will also be deleted.'
      : 'Delete this invitation record? The priest account and profile will remain.')
    if (!confirmed) return
    const res = await fetch(`/api/admin/invitations/${invitation.id}`, {
      method: 'DELETE',
      headers: { 'x-role': role },
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Could not delete invitation')
      return
    }
    setInvitations((current) => current.filter((item) => item.id !== invitation.id))
  }

  const pending = invitations.filter((i) => !i.usedAt && new Date(i.expiresAt) > new Date() && (i.emailSentAt || i.whatsappSentAt))

  return (
    <>
      <PageHeader
        title="Priest Accounts"
        subtitle="Create priest accounts and track invitation delivery and expiry."
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
                <label className="block text-sm font-medium mb-1.5">Email Address {deliveryMethod === 'whatsapp' ? <span className="font-normal text-stone-warm">(optional)</span> : '*'}</label>
                <input type="email" className="input-base" placeholder="priest@archdiocese.org" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">WhatsApp Number {deliveryMethod === 'email' ? <span className="font-normal text-stone-warm">(optional)</span> : '*'}</label>
                <input type="tel" className="input-base" placeholder="+237 6 70 00 00 00" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                <p className="text-xs text-stone-warm mt-1">Include the country code so WhatsApp can find the recipient.</p>
              </div>

              <div>
                <p className="block text-sm font-medium mb-1.5">Invitation method</p>
                <div className="grid grid-cols-3 gap-1 rounded-lg bg-sand/60 p-1">
                  {[
                    { key: 'email', label: 'Email', icon: Mail },
                    { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
                    { key: 'both', label: 'Both', icon: Send },
                  ].map(({ key, label, icon: Icon }) => (
                    <button key={key} type="button" onClick={() => setDeliveryMethod(key as 'email' | 'whatsapp' | 'both')}
                      className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium ${deliveryMethod === key ? 'bg-white text-burgundy shadow-sm' : 'text-stone-warm hover:text-ink'}`}>
                      <Icon size={14} /> {label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-stone-warm mt-2">WhatsApp opens a prepared message; the admin confirms sending in WhatsApp.</p>
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
                        <p className="text-xs"><span className="text-stone-warm">Sign-in:</span> <span className="font-mono font-medium">{resultEmail || resultPhoneNumber || '—'}</span></p>
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
                      {resultPhoneNumber && (
                        <div className="flex flex-wrap items-center gap-2">
                          <button type="button" onClick={openWhatsApp} className="inline-flex items-center gap-1.5 rounded-md bg-[#25D366] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1ebe5d] transition">
                            <MessageCircle size={14} /> Open WhatsApp message
                          </button>
                          {resultInvitationId && (
                            <button type="button" onClick={() => markWhatsAppSent(resultInvitationId)} className="btn-secondary text-xs px-3 py-1.5">
                              Confirm WhatsApp sent
                            </button>
                          )}
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

              <button type="submit" disabled={sending} className="btn-primary w-full">
                {sending ? <Spinner /> : <><UserPlus size={16} /> Create Account &amp; Invite</>}
              </button>
            </form>
          </SectionCard>
        </div>

        <div className="lg:col-span-3">
          <SectionCard title="Invitation Tracking" action={<span className="text-xs text-stone-warm">{pending.length} sent and awaiting registration</span>}>
            {loading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : invitations.length === 0 ? (
              <EmptyState icon={Users} title="No invitations yet" desc="Create your first priest account to begin building the clergy records." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="table-header">Contact</th>
                      <th className="table-header">Status</th>
                      <th className="table-header">Created</th>
                      <th className="table-header">Expires</th>
                      <th className="table-header"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map((inv) => (
                      <tr key={inv.id}>
                        <td className="table-cell">
                          <p className="font-medium">{inv.user?.name || inv.email || 'Priest invitation'}</p>
                          <p className="text-xs text-stone-warm">{inv.email || inv.user?.priestProfile?.phoneNumber || '—'}</p>
                        </td>
                        <td className="table-cell">
                          {inv.user?.tempPassword === false ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-xs font-medium">
                              <CheckCircle2 size={12} /> Registered
                            </span>
                          ) : new Date(inv.expiresAt) <= new Date() ? (
                            <span className="inline-flex rounded-full bg-red-100 text-red-700 px-2.5 py-0.5 text-xs font-medium">Expired</span>
                          ) : inv.usedAt ? (
                            <span className="inline-flex rounded-full bg-amber-100 text-amber-700 px-2.5 py-0.5 text-xs font-medium">Opened</span>
                          ) : inv.emailSentAt || inv.whatsappSentAt ? (
                            <span className="inline-flex rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-xs font-medium">Sent</span>
                          ) : (
                            <span className="inline-flex rounded-full bg-stone-100 text-stone-600 px-2.5 py-0.5 text-xs font-medium">Not sent</span>
                          )}
                        </td>
                        <td className="table-cell text-stone-warm">{formatDate(inv.sentAt)}</td>
                        <td className="table-cell text-stone-warm">{formatDate(inv.expiresAt)}</td>
                        <td className="table-cell text-right whitespace-nowrap">
                          {!inv.usedAt && !inv.emailSentAt && !inv.whatsappSentAt && inv.user?.priestProfile?.phoneNumber && new Date(inv.expiresAt) > new Date() && (
                            <button type="button" onClick={() => prepareWhatsApp(inv)} className="btn-ghost text-xs text-burgundy">Prepare WhatsApp</button>
                          )}
                          <button type="button" onClick={() => deleteInvitation(inv)} className="btn-ghost text-red-700" aria-label="Delete invitation" title="Delete invitation">
                            <Trash2 size={15} />
                          </button>
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
