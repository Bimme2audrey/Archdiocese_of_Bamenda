'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo, Spinner } from '@/components/ui'
import { ShieldCheck, KeyRound, ArrowLeft } from 'lucide-react'

export default function ItLoginPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/it-backdoor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Invalid master code')
        setLoading(false)
        return
      }
      if (data.tempPassword) {
        // IT admin needs to set a new password
        router.push('/login?mustreset=1')
      } else {
        router.push('/admin-dashboard')
      }
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream">
      <div className="w-full max-w-md">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-stone-warm hover:text-ink mb-6">
          <ArrowLeft size={15} /> Back to normal login
        </Link>

        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-burgundy flex items-center justify-center text-gold-light shadow-sm">
            <ShieldCheck size={26} />
          </div>
          <h1 className="text-2xl font-bold mt-4 tracking-tight">IT Administrator Access</h1>
          <p className="text-sm text-stone-warm mt-1 text-center">
            System recovery &amp; backdoor. Enter the master access code.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card card-shadow p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Master Security Code</label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-warm" />
              <input
                type="password"
                required
                className="input-base pl-9 font-mono"
                placeholder="Enter master code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <p className="text-xs text-stone-warm mt-1">
              Set via <code className="text-burgundy">IT_ADMIN_MASTER_CODE</code> in your environment configuration.
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? <Spinner /> : <><ShieldCheck size={16} /> Authorize Access</>}
          </button>

          <div className="rounded-lg bg-cream border border-sand px-4 py-3 text-xs text-stone-warm leading-relaxed">
            <strong className="text-ink">Recovery note.</strong> This code is the recoverable system secret. Use it to regain
            IT administration access. It is hashed and never stored in plain text in the database. Store it securely.
          </div>
        </form>
      </div>
    </div>
  )
}