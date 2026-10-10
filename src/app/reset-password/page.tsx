'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Logo, Spinner } from '@/components/ui'
import PasswordInput from '@/components/PasswordInput'
import { Lock } from 'lucide-react'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [complete, setComplete] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!token) {
      setError('This reset link is missing its token. Request a new link.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })
      const data = await response.json()
      if (!response.ok) setError(data.error || 'Could not reset the password.')
      else setComplete(true)
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
          <h1 className="text-2xl font-bold mt-4 tracking-tight">Choose a New Password</h1>
          <p className="text-sm text-stone-warm mt-1 text-center">Reset links expire after 30 minutes and can only be used once.</p>
        </div>
        <form onSubmit={submit} className="card card-shadow p-8 space-y-4">
          {complete ? (
            <div role="status" className="space-y-4 text-center">
              <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">Your password has been reset. Sign in with your new password.</p>
              <Link href="/priest-login" className="btn-primary w-full">Return to Sign In</Link>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-1.5">New Password</label>
                <PasswordInput leadingIcon={<Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-warm" />} required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Confirm New Password</label>
                <PasswordInput required minLength={8} autoComplete="new-password" placeholder="Enter it again" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
              </div>
              {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
              <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <Spinner /> : 'Reset Password'}</button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return <Suspense><ResetPasswordForm /></Suspense>
}