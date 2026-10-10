import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'
import { hashPassword, generateTempPassword } from '@/lib/auth'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const user = await getUser(req)
    if (!user || (user.role !== 'IT_ADMIN' && user.role !== 'ADP_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await context.params
    const { action } = await req.json()

    const target = await prisma.user.findUnique({ where: { id } })
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    if (action === 'RESET_PASSWORD') {
      if (user.role === 'ADP_ADMIN' && target.role !== 'PRIEST') {
        return NextResponse.json({ error: 'ADP admins can reset priest accounts only' }, { status: 403 })
      }
      const tempPassword = generateTempPassword()
      const hashed = await hashPassword(tempPassword)
      await prisma.$transaction([
        prisma.user.update({ where: { id }, data: { password: hashed, tempPassword: true } }),
        prisma.session.deleteMany({ where: { userId: id } }),
        prisma.passwordResetToken.deleteMany({ where: { userId: id } }),
      ])
      return NextResponse.json({ success: true, tempPassword })
    }

    if (action === 'TOGGLE_ACTIVE') {
      if (user.role !== 'IT_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      const updated = await prisma.user.update({
        where: { id },
        data: { isActive: !target.isActive },
      })
      return NextResponse.json({ success: true, isActive: updated.isActive })
    }

    if (action === 'SET_ROLE') {
      if (user.role !== 'IT_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      const { role } = await req.json()
      if (!['ADP_ADMIN', 'PRIEST', 'IT_ADMIN'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }
      if (target.role === 'IT_ADMIN') {
        return NextResponse.json({ error: 'Cannot change the master IT administrator role' }, { status: 400 })
      }
      await prisma.user.update({ where: { id }, data: { role } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('User management error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}