import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

// List announcements. Admins see all; others see active ones.
export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req)
    const isAdmin = !!user && (user.role === 'IT_ADMIN' || user.role === 'ADP_ADMIN')

    const where = isAdmin ? {} : { active: true }

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: { author: { select: { name: true } } },
    })

    return NextResponse.json({ announcements })
  } catch (error) {
    console.error('List announcements error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user || (user.role !== 'IT_ADMIN' && user.role !== 'ADP_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { title, body, active, category, isPinned, targetAudience } = await req.json()
    if (!title || !body) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        body,
        authorId: user.id,
        active: active !== false,
        category: category || 'Chancery Notice',
        isPinned: isPinned || false,
        targetAudience: targetAudience || null,
      },
      include: { author: { select: { name: true } } },
    })

    return NextResponse.json({ success: true, announcement })
  } catch (error) {
    console.error('Create announcement error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}