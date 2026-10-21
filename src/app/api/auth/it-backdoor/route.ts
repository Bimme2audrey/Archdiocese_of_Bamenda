import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession, hashPassword, generateToken, getRoleCookie } from '@/lib/auth'
import { generateCodeHash } from '@/lib/crypto'

// IT Administrator secure backdoor login.
// - The master code lives in .env (IT_ADMIN_MASTER_CODE) and is the recoverable secret.
// - Only a SHA-256 hash (peppered) is stored in the database, never the raw code.
// - If the master code is lost, it can be reset in .env and the hash re-seeded.
export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()
    if (!code) {
      return NextResponse.json({ error: 'Master code required' }, { status: 400 })
    }

    // Find the stored hash
    let config = await prisma.systemConfig.findUnique({ where: { key: 'it_master_code_hash' } })

    // If no hash stored, seed it from env if present
    if (!config) {
      const envCode = process.env.IT_ADMIN_MASTER_CODE
      if (!envCode) {
        return NextResponse.json(
          { error: 'Master code not initialized. Set IT_ADMIN_MASTER_CODE in .env.' },
          { status: 500 }
        )
      }
      config = await prisma.systemConfig.create({
        data: { key: 'it_master_code_hash', value: generateCodeHash(envCode) },
      })
    }

    // Validate (constant-time-ish compare is fine here; hash handles most timing concerns)
    if (generateCodeHash(code) !== config.value) {
      return NextResponse.json({ error: 'Invalid master code.' }, { status: 401 })
    }

    // Find or create the master IT administrator
    let itAdmin = await prisma.user.findFirst({ where: { role: 'IT_ADMIN' } })

    if (!itAdmin) {
      // Recover: create a fresh IT admin with a temporary password
      const tempPassword = generateToken(12)
      itAdmin = await prisma.user.create({
        data: {
          email: process.env.IT_ADMIN_EMAIL || 'itadmin@adpclergy.org',
          name: 'System IT Administrator',
          password: await hashPassword(tempPassword),
          role: 'IT_ADMIN',
          tempPassword: true,
        },
      })
      // Log the recovery temp password (visible in console only)
      console.log('🔐 [IT BACKDOOR] Recovered IT Admin. Temporary password:', tempPassword)
    }

    const sessionToken = await createSession(itAdmin.id)
    const response = NextResponse.json({
      success: true,
      user: { id: itAdmin.id, name: itAdmin.name, email: itAdmin.email, role: itAdmin.role },
      tempPassword: itAdmin.tempPassword,
    })
    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    }
    response.cookies.set(getRoleCookie(itAdmin.role), sessionToken, cookieOpts)
    response.cookies.set('session_token', sessionToken, cookieOpts)
    return response
  } catch (error) {
    console.error('IT backdoor error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
