import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const tokens = [
    req.cookies.get('session_token')?.value,
    req.cookies.get('session_it')?.value,
    req.cookies.get('session_adp')?.value,
    req.cookies.get('session_priest')?.value,
  ].filter(Boolean) as string[]

  for (const token of tokens) {
    await deleteSession(token)
  }

  const response = NextResponse.json({ success: true })
  response.cookies.delete('session_token')
  response.cookies.delete('session_it')
  response.cookies.delete('session_adp')
  response.cookies.delete('session_priest')
  return response
}
