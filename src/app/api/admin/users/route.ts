import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getUser } from '@/lib/auth'
import { hashPassword, generateTempPassword, generateToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user || user.role !== 'IT_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        tempPassword: true,
        createdAt: true,
        createdBy: true,
        priestProfile: { select: { status: true } },
      },
    })
    return NextResponse.json({ users })
  } catch (error) {
    console.error('List users error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user || user.role !== 'IT_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { email, name, role } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const normalizedEmail = email.toLowerCase().trim()
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 })
    }

    const tempPassword = generateTempPassword()
    const hashed = await hashPassword(tempPassword)

    await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name || null,
        password: hashed,
        role: role === 'ADP_ADMIN' ? 'ADP_ADMIN' : 'ADP_ADMIN',
        tempPassword: true,
        createdBy: user.id,
      },
    })

    return NextResponse.json({ success: true, tempPassword })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}