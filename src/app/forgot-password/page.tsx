'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo, Spinner } from '@/components/ui'
import { Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (!response.ok) setError(data.error || 'Could not process the request.')
      else setMessage(data.message)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" />
          <h1 className="text-2xl font-bold mt-4 tracking-tight">Reset Your Password</h1>
          <p className="text-sm text-stone-warm mt-1 text-center">Enter the email address on your priest account.</p>
        </div>
        <form onSubmit={submit} className="card card-shadow p-8 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-warm" />
              <input type="email" required autoComplete="email" className="input-base pl-9" placeholder="you@archdiocese.org" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
          </div>
          {message && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{message}</div>}
          {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Spinner /> : 'Send Reset Link'}
          </button>
          <p className="text-xs text-stone-warm leading-relaxed border-t border-sand pt-3">
            If you use WhatsApp without an email on your account, contact ADP administration to verify your identity and request a temporary passcode.
          </p>
          <div className="text-center text-sm">
            <Link href="/priest-login" className="text-burgundy font-medium hover:underline">Back to sign in</Link>
          </div>
        </form>
      </div>
    </div>
  )
}