import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { cookies } from 'next/headers'
import { User } from '@prisma/client'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = randomBytes(length)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length]
  }
  return result
}

export function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(8)
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars[bytes[i] % chars.length]
  }
  return result
}

export async function createSession(userId: string): Promise<string> {
  const token = generateToken(64)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await prisma.session.create({
    data: { userId, token, expiresAt },
  })

  return token
}

export async function getSessionUser(token: string): Promise<User | null> {
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { token } })
    return null
  }

  return session.user
}

export async function deleteSession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } })
}

// Each role uses its own session cookie so the three roles can be logged in
// simultaneously (e.g. IT Admin + ADP Admin + Priest) in the same browser.
export const ROLE_COOKIES: Record<string, string> = {
  IT_ADMIN: 'session_it',
  ADP_ADMIN: 'session_adp',
  PRIEST: 'session_priest',
}

export const ROLE_DASHBOARDS: Record<string, string> = {
  IT_ADMIN: '/admin-dashboard',
  ADP_ADMIN: '/clergy-dashboard',
  PRIEST: '/priest-dashboard',
}

export function getRoleCookie(role: string): string {
  return ROLE_COOKIES[role] || 'session_token'
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value
    if (!token) return null
    return getSessionUser(token)
  } catch {
    return null
  }
}

// Read the session for a specific role (used by role-specific dashboards so
// multiple roles can be open at the same time).
export async function getRoleSessionUser(role: string): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(getRoleCookie(role))?.value
    if (!token) return null
    return getSessionUser(token)
  } catch {
    return null
  }
}

// Authenticate an API request using the role the client declares via the
// "x-role" header (set by role-scoped pages). This lets every role's pages
// use its own session cookie even when several roles are logged in at once.
export async function getUser(
  req?: { headers: { get(name: string): string | null } } | null
): Promise<User | null> {
  if (req) {
    const role = req.headers.get('x-role')
    if (role && ROLE_COOKIES[role]) {
      const u = await getRoleSessionUser(role)
      if (u) return u
    }
  }
  return getCurrentUser()
}

export async function requireAuth(allowedRoles?: string[]) {
  const user = await getCurrentUser()
  if (!user) {
    return { user: null, redirect: '/login' }
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return { user: null, redirect: '/dashboard' }
  }
  return { user, redirect: null }
}
