'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo, Spinner } from '@/components/ui'
import PasswordInput from '@/components/PasswordInput'
import { Lock, Mail } from 'lucide-react'

const roleDashboards: Record<string, string> = {
  IT_ADMIN: '/admin-dashboard',
  ADP_ADMIN: '/clergy-dashboard',
  PRIEST: '/priest-dashboard',
}

export default function LoginForm({ initialRole = '' }: { initialRole?: string }) {
  const router = useRouter()
  const [role] = useState(initialRole || 'PRIEST')
  const isPriestLogin = role === 'PRIEST'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }
      if (data.user?.tempPassword) {
        router.push('/change-password')
      } else {
        router.push(roleDashboards[data.user?.role] || '/dashboard')
      }
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex flex-col items-center mb-8">
        <Logo size="lg" />
        <h1 className="text-2xl font-bold mt-4 tracking-tight">Welcome Back</h1>
        <p className="text-sm text-stone-warm mt-1">Sign in to the ADP Profile System</p>
      </div>

      <form onSubmit={handleSubmit} className="card card-shadow p-8 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            {isPriestLogin ? 'Email or WhatsApp Number' : 'Email Address'}
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-warm" />
            <input
              type={isPriestLogin ? 'text' : 'email'}
              required
              className="input-base pl-9"
              placeholder={isPriestLogin ? 'you@archdiocese.org or +237...' : 'admin@archdiocese.org'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Password</label>
          <PasswordInput
            leadingIcon={<Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-warm" />}
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
          {loading ? <Spinner /> : 'Sign In'}
        </button>

        <div className="text-center text-xs text-stone-warm pt-2 border-t border-sand">
          {role === 'PRIEST' && (
            <>
              Received an invitation?{' '}
              <Link href="/register" className="text-burgundy font-medium hover:underline">
                Complete your profile
              </Link>
              <p className="mt-2">
                <Link href="/forgot-password" className="text-burgundy font-medium hover:underline">
                  Forgot your password?
                </Link>
              </p>
            </>
          )}
        </div>
      </form>
    </div>
  )
}