import { redirect } from 'next/navigation'
import Sidebar from './Sidebar'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function AppShell({
  children,
  user: propUser,
}: {
  children: React.ReactNode
  user?: { id?: string; name: string | null; email: string; role: string; tempPassword?: boolean; photoUrl?: string | null } | null
}) {
  const user = (propUser ?? (await getCurrentUser())) as {
    id?: string
    name: string | null
    email: string
    role: string
    tempPassword?: boolean
    photoUrl?: string | null
  } | null

  if (!user) redirect('/login')
  if (user.tempPassword) redirect('/change-password')

  let profileName = user.name
  let profilePhoto = user.photoUrl ?? null

  if (user.role === 'PRIEST' && user.id) {
    const priestProfile = await prisma.priestProfile.findUnique({
      where: { userId: user.id },
      select: { firstName: true, middleName: true, lastName: true, photoUrl: true },
    })

    const profileFullName = [priestProfile?.firstName, priestProfile?.middleName, priestProfile?.lastName].filter(Boolean).join(' ').trim()
    profileName = profileFullName || user.name
    profilePhoto = priestProfile?.photoUrl || profilePhoto
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col lg:flex-row">
      <Sidebar user={{ name: profileName, email: user.email, role: user.role, photoUrl: profilePhoto }} />
      <main className="flex-1 min-w-0 p-6 lg:p-8">{children}</main>
    </div>
  )
}