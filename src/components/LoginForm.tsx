'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo, Spinner } from '@/components/ui'
import { Lock, Mail, ShieldCheck, Award, Church } from 'lucide-react'
import { cn } from '@/lib/utils'

const roleDashboards: Record<string, string> = {
  IT_ADMIN: '/admin-dashboard',
  ADP_ADMIN: '/clergy-dashboard',
  PRIEST: '/priest-dashboard',
}

const roleSelectors = [
  { key: 'IT_ADMIN', label: 'IT Admin', icon: ShieldCheck },
  { key: 'ADP_ADMIN', label: 'ADP Admin', icon: Award },
  { key: 'PRIEST', label: 'Priest', icon: Church },
]

export default function LoginForm({ initialRole = '' }: { initialRole?: string }) {
  const router = useRouter()
  const [role, setRole] = useState(initialRole)
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
        <p className="text-sm text-stone-warm mt-1">Sign in to the ADP Clergy Profile System</p>
      </div>

      <form onSubmit={handleSubmit} className="card card-shadow p-8 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-stone-warm">I am a…</label>
          <div className="grid grid-cols-3 gap-2">
            {roleSelectors.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRole(r.key)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg border p-2.5 text-xs font-medium transition-colors',
                  role === r.key
                    ? 'border-burgundy bg-burgundy/5 text-burgundy'
                    : 'border-sand text-stone-warm hover:border-gold'
                )}
              >
                <r.icon size={16} />
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Email Address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-warm" />
            <input
              type="email"
              required
              className="input-base pl-9"
              placeholder="you@archdiocese.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-warm" />
            <input
              type="password"
              required
              className="input-base pl-9"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
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
            </>
          )}
        </div>
      </form>
    </div>
  )
}