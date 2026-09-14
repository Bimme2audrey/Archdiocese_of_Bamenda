'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Logo, Spinner } from '@/components/ui'
import PasswordInput from '@/components/PasswordInput'
import { KeyRound, Lock } from 'lucide-react'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to update password')
        setLoading(false)
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" />
          <h1 className="text-2xl font-bold mt-4 tracking-tight">Set Your Password</h1>
          <p className="text-sm text-stone-warm mt-1 text-center">
            You are using a temporary passcode. Please set a secure password to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card card-shadow p-8 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Temporary Passcode</label>
            <PasswordInput
              leadingIcon={<KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-warm" />}
              required
              className="font-mono"
              placeholder="Your temporary passcode"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">New Password</label>
            <PasswordInput
              leadingIcon={<Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-warm" />}
              required
              placeholder="Min 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Confirm New Password</label>
            <PasswordInput
              required
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? <Spinner /> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}