import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { PageHeader, SectionCard, StatusBadge, EmptyState, RoleBadge } from '@/components/ui'
import AnnouncementsCard from '@/components/AnnouncementsCard'
import {
  UserRound,
  Users,
  FileCheck2,
  Clock,
  ArrowRight,
  CalendarCheck,
  GraduationCap,
  Church,
  ShieldCheck,
  ServerCog,
  KeyRound,
  Award,
  ClipboardList,
} from 'lucide-react'

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="card card-shadow p-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color} mb-3`}>
        <Icon size={19} />
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm text-stone-warm mt-1">{label}</p>
    </div>
  )
}

export default async function RoleDashboard({ user }: { user: { id: string; role: 'IT_ADMIN' | 'ADP_ADMIN' | 'PRIEST'; name: string | null } }) {
  const isAdmin = user.role === 'IT_ADMIN' || user.role === 'ADP_ADMIN'

  let total = 0
  let approved = 0
  let pending = 0
  let rejected = 0

  if (isAdmin) {
    ;[total, approved, pending, rejected] = await Promise.all([
      prisma.priestProfile.count(),
      prisma.priestProfile.count({ where: { status: 'APPROVED' } }),
      prisma.priestProfile.count({ where: { status: 'PENDING' } }),
      prisma.priestProfile.count({ where: { status: 'REJECTED' } }),
    ])
  }

  let itStats: { users: number; admins: number; priests: number } | null = null
  if (user.role === 'IT_ADMIN') {
    const [users, admins, priests] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADP_ADMIN' } }),
      prisma.user.count({ where: { role: 'PRIEST' } }),
    ])
    itStats = { users, admins, priests }
  }

  let myProfile: {
    status: string
    firstName: string | null
    lastName: string | null
    updatedAt: Date
  } | null = null

  if (user.role === 'PRIEST') {
    myProfile = await prisma.priestProfile.findUnique({
      where: { userId: user.id },
      select: { status: true, firstName: true, lastName: true, updatedAt: true },
    })
  }
const roleSubtitle: Record<string, string> = {
    IT_ADMIN: 'System administration & access control for the entire platform',
    ADP_ADMIN: 'Manage clergy records, reviews, invitations and reporting',
    PRIEST: 'Build and maintain your official clergy profile',
  }
const link = (
    {
      IT_ADMIN: { admin: '/it/admin', reports: '/it/reports', priests: '/it/priests' },
      ADP_ADMIN: { invite: '/adp/invite', reports: '/adp/reports', priests: '/adp/priests' },
      PRIEST: { questionnaire: '/priest/questionnaire' },
    } as Record<string, Record<string, string>>
  )[user.role]

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={roleSubtitle[user.role] || 'Welcome'}
        action={<RoleBadge role={user.role} />}
      />

      {/* --- IT ADMINISTRATOR --- */}
      {user.role === 'IT_ADMIN' && itStats && (
        <div className="space-y-6">
          <div className="rounded-xl border-l-4 border-burgundy bg-white p-5 card-shadow">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-burgundy flex items-center justify-center text-gold-light">
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="font-semibold">System Control</p>
                <p className="text-sm text-stone-warm">Full authority over the platform, user accounts and credentials.</p>
              </div>
            </div>
          </div>
<AnnouncementsCard role={user.role} />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="User Accounts" value={itStats.users} icon={Users} color="text-burgundy bg-burgundy/10" />
            <StatCard label="ADP Administrators" value={itStats.admins} icon={ShieldCheck} color="text-gold bg-gold/15" />
            <StatCard label="Registered Priests" value={itStats.priests} icon={Church} color="text-indigo-700 bg-indigo-100" />
            <StatCard label="Total Profiles" value={total} icon={UserRound} color="text-green-700 bg-green-100" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <SectionCard title="IT Administration Panel">
              <div className="grid grid-cols-1 gap-2">
                <Link href={link.admin} className="flex items-center gap-3 p-3 rounded-lg hover:bg-cream border border-sand transition-colors">
                  <div className="w-9 h-9 rounded-md bg-burgundy/10 text-burgundy flex items-center justify-center"><ServerCog size={18} /></div>
                  <span className="text-sm font-medium">Manage Administrators &amp; Accounts</span>
                </Link>
                <Link href={link.reports} className="flex items-center gap-3 p-3 rounded-lg hover:bg-cream border border-sand transition-colors">
                  <div className="w-9 h-9 rounded-md bg-gold/15 text-gold flex items-center justify-center"><FileCheck2 size={18} /></div>
                  <span className="text-sm font-medium">System Reports &amp; Statistics</span>
                </Link>
                <Link href={link.priests} className="flex items-center gap-3 p-3 rounded-lg hover:bg-cream border border-sand transition-colors">
                  <div className="w-9 h-9 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center"><UserRound size={18} /></div>
                  <span className="text-sm font-medium">Browse All Clergy Records</span>
                </Link>
              </div>
            </SectionCard>

            <SectionCard title="System Security">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-cream border border-sand">
                <div className="w-9 h-9 rounded-md bg-burgundy/10 text-burgundy flex items-center justify-center shrink-0"><KeyRound size={18} /></div>
                <div>
                  <p className="text-sm font-medium">IT Backdoor / Recovery</p>
                  <p className="text-sm text-stone-warm mt-1 leading-relaxed">
                    Recover system access via <code className="text-burgundy">/it-login</code> using the master security code.
                    The code is stored only as a hashed value and can be reset in your configuration.
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      )}
      {/* --- ADP ADMINISTRATOR --- */}
      {user.role === 'ADP_ADMIN' && (
        <div className="space-y-6">
          <div className="rounded-xl border-l-4 border-gold bg-white p-5 card-shadow">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-gold/20 flex items-center justify-center text-burgundy">
                <Award size={22} />
              </div>
              <div>
                <p className="font-semibold">Clergy Operations</p>
                <p className="text-sm text-stone-warm">Review and approve clergy profiles, send invitations and track records.</p>
              </div>
            </div>
          </div>
<AnnouncementsCard role={user.role} />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Profiles" value={total} icon={UserRound} color="text-burgundy bg-burgundy/10" />
            <StatCard label="Approved" value={approved} icon={FileCheck2} color="text-green-700 bg-green-100" />
            <StatCard label="Pending Review" value={pending} icon={Clock} color="text-amber-700 bg-amber-100" />
            <StatCard label="Rejected" value={rejected} icon={FileCheck2} color="text-red-700 bg-red-100" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <SectionCard title="Review Queue">
              {pending > 0 ? (
                <Link href={`${link.priests}?status=PENDING`} className="flex items-center justify-between p-4 rounded-lg bg-amber-50 border border-amber-200 group">
                  <div>
                    <p className="font-semibold text-amber-900">{pending} profile{pending > 1 ? 's' : ''} awaiting review</p>
                    <p className="text-sm text-amber-700">Review submitted clergy records and approve them.</p>
                  </div>
                  <ArrowRight size={18} className="text-amber-700 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-stone-warm">No profiles awaiting review. All caught up!</p>
                  <Clock size={18} className="text-stone-warm" />
                </div>
              )}
            </SectionCard>

            <SectionCard title="Quick Access">
              <div className="grid grid-cols-1 gap-2">
                <Link href={link.invite} className="flex items-center gap-3 p-3 rounded-lg hover:bg-cream border border-sand transition-colors">
                  <div className="w-8 h-8 rounded-md bg-burgundy/10 text-burgundy flex items-center justify-center"><Users size={16} /></div>
                  <span className="text-sm font-medium">Invite a Priest</span>
                </Link>
                <Link href={link.reports} className="flex items-center gap-3 p-3 rounded-lg hover:bg-cream border border-sand transition-colors">
                  <div className="w-8 h-8 rounded-md bg-gold/15 text-gold flex items-center justify-center"><ClipboardList size={16} /></div>
                  <span className="text-sm font-medium">Generate Statistics &amp; Reports</span>
                </Link>
                <Link href={link.priests} className="flex items-center gap-3 p-3 rounded-lg hover:bg-cream border border-sand transition-colors">
                  <div className="w-8 h-8 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center"><UserRound size={16} /></div>
                  <span className="text-sm font-medium">View All Clergy Records</span>
                </Link>
              </div>
            </SectionCard>
          </div>
        </div>
      )}
      {/* --- PRIEST --- */}
      {user.role === 'PRIEST' && (
        <div className="max-w-3xl">
          <div className="card card-shadow p-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-burgundy/10 flex items-center justify-center">
                  <Church size={28} className="text-burgundy" />
                </div>
                <div>
                  <p className="font-semibold text-lg">My Clergy Profile</p>
                  <p className="text-sm text-stone-warm">
                    {myProfile ? `${[myProfile.firstName, myProfile.lastName].filter(Boolean).join(' ')}`.trim() || 'Not yet started' : 'Not yet started'}
                  </p>
                </div>
              </div>
              {myProfile && <StatusBadge status={myProfile.status} />}
            </div>

            <div className="border-t border-sand mt-6 pt-6">
              <p className="text-sm text-stone-warm leading-relaxed mb-4">
                Complete your structured questionnaire to build your official digital profile. Your profile becomes fully
                active only after review and approval by ADP administrators.
              </p>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <Link href={link.questionnaire} className="btn-primary">
                <GraduationCap size={16} /> {myProfile && myProfile.status !== 'DRAFT' ? 'View / Edit My Profile' : 'Complete My Questionnaire'}
              </Link>
            </div>
          </div>
<div className="mt-6"><AnnouncementsCard role={user.role} /></div>

          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            {myProfile ? (
              <>
                <div className="card card-shadow p-5">
                  <CalendarCheck size={18} className="text-gold mb-2" />
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-stone-warm text-sm mt-1">{myProfile.updatedAt.toLocaleDateString()}</p>
                </div>
                <div className="card card-shadow p-5">
                  <FileCheck2 size={18} className="text-gold mb-2" />
                  <p className="text-sm font-medium">Profile Status</p>
                  <div className="mt-1"><StatusBadge status={myProfile.status} /></div>
                </div>
              </>
            ) : (
              <div className="card card-shadow md:col-span-2">
                <EmptyState
                  icon={UserRound}
                  title="No profile yet"
                  desc="Begin your clergy profile by completing the structured questionnaire."
                />
              </div>
            )}
          </div>
        </div>

      )}
    </>
  )
}