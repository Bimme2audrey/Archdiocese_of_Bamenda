'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { Logo, Spinner } from '@/components/ui'
import PasswordInput from '@/components/PasswordInput'
import { KeyRound, Mail, User } from 'lucide-react'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [form, setForm] = useState({
    email: '',
    tempPassword: '',
    newPassword: '',
    confirmPassword: '',
    name: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (form.newPassword.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }
    if (!token) {
      setError('Missing invitation token. Use the link from your invitation email.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email: form.email,
          tempPassword: form.tempPassword,
          newPassword: form.newPassword,
          name: form.name,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Registration failed')
        setLoading(false)
        return
      }
      router.push('/priest/questionnaire')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" />
          <h1 className="text-2xl font-bold mt-4 tracking-tight">Complete Your Registration</h1>
          <p className="text-sm text-stone-warm mt-1">Set up your account to begin your clergy profile</p>
        </div>

        <form onSubmit={handleSubmit} className="card card-shadow p-8 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-warm" />
              <input className="input-base pl-9" placeholder="Rev. John Doe" value={form.name} onChange={(e) => update('name', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Email Address <span className="font-normal text-stone-warm">(optional for WhatsApp invitations)</span></label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-warm" />
              <input type="email" className="input-base pl-9" placeholder="you@archdiocese.org" value={form.email} onChange={(e) => update('email', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Temporary Passcode</label>
            <div className="relative">
              <PasswordInput
                leadingIcon={<KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-warm" />}
                required
                className="font-mono"
                placeholder="From your invitation email"
                value={form.tempPassword}
                onChange={(e) => update('tempPassword', e.target.value)}
              />
            </div>
            <p className="text-xs text-stone-warm mt-1">Sent to you via the invitation from ADP administration.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">New Password</label>
              <PasswordInput required placeholder="Min 8 characters" value={form.newPassword} onChange={(e) => update('newPassword', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Confirm Password</label>
              <PasswordInput required placeholder="Repeat password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? <Spinner /> : 'Create My Account'}
          </button>

          <div className="text-center text-xs text-stone-warm pt-2 border-t border-sand">
            Already have an account?{' '}
            <Link href="/login" className="text-burgundy font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}