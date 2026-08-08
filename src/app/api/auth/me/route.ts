import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ user: null }, { status: 401 })
  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, tempPassword: user.tempPassword },
  })
}
