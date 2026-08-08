import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getUser } from '@/lib/auth'

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
    const { action, notes } = await req.json()

    if (action !== 'APPROVED' && action !== 'REJECTED') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const profile = await prisma.priestProfile.findUnique({ where: { id } })
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const now = new Date()
    const updateData =
      action === 'APPROVED'
        ? { status: 'APPROVED' as const, approvedAt: now, rejectedAt: null, updatedAt: now }
        : { status: 'REJECTED' as const, rejectedAt: now, approvedAt: null, updatedAt: now }

    const result = await prisma.priestProfile.update({ where: { id }, data: updateData })

    await prisma.profileReview.create({
      data: {
        profileId: id,
        reviewerId: user.id,
        action,
        notes: notes || null,
      },
    })

    return NextResponse.json({ success: true, profile: result })
  } catch (error) {
    console.error('Review profile error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}