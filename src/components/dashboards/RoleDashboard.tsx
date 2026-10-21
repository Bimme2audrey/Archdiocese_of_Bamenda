import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import ClergyAvatar from '@/components/ClergyAvatar'
import { PageHeader, SectionCard, StatusBadge, EmptyState, RoleBadge } from '@/components/ui'
import AnnouncementsCard from '@/components/AnnouncementsCard'
import {
  UserRound, Users, FileCheck2, Clock, ArrowRight, CalendarCheck, GraduationCap,
  Church, ShieldCheck, KeyRound, Award, Heart,
  Flame, TrendingUp,
} from 'lucide-react'
import { MONTHS, parseDateParts, getJubileeLabel, calculateAge } from '@/lib/utils'

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <div className="card card-shadow p-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color} mb-3`}><Icon size={19} /></div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm text-stone-warm mt-1">{label}</p>
    </div>
  )
}

export default async function RoleDashboard({ user }: { user: { id: string; role: 'IT_ADMIN' | 'ADP_ADMIN' | 'PRIEST'; name: string | null } }) {

  // ==================== IT ADMIN: User Management Only ====================
  if (user.role === 'IT_ADMIN') {
    const [totalUsers, activeAdmins, activePriests, inactiveUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADP_ADMIN', isActive: true } }),
      prisma.user.count({ where: { role: 'PRIEST', isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
    ])
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }, take: 10,
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    })
    return (<>
      <PageHeader title="System Administration" subtitle="User account management & access control" action={<RoleBadge role="IT_ADMIN" />} />
      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={totalUsers} icon={Users} color="bg-burgundy text-gold-light" />
          <StatCard label="Active Admins" value={activeAdmins} icon={ShieldCheck} color="bg-indigo-100 text-indigo-700" />
          <StatCard label="Active Priests" value={activePriests} icon={Church} color="bg-emerald-100 text-emerald-700" />
          <StatCard label="Suspended" value={inactiveUsers} icon={Clock} color="bg-slate-100 text-slate-600" />
        </div>
        <div className="flex gap-4"><Link href="/it/admin" className="btn-primary"><ShieldCheck size={16} /> Manage Administrator Accounts</Link></div>
        <SectionCard title="Recent User Accounts">
          <div className="overflow-x-auto"><table className="w-full"><thead><tr>
            <th className="table-header">Name</th><th className="table-header">Email</th><th className="table-header">Role</th><th className="table-header">Status</th><th className="table-header">Created</th>
          </tr></thead><tbody>
            {recentUsers.map((u) => (<tr key={u.id} className="hover:bg-cream transition-colors">
              <td className="table-cell font-medium">{u.name || '—'}</td>
              <td className="table-cell text-stone-warm">{u.email}</td>
              <td className="table-cell"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${u.role === 'IT_ADMIN' ? 'bg-burgundy text-white' : u.role === 'ADP_ADMIN' ? 'bg-gold/20 text-burgundy' : 'bg-sand text-ink'}`}>{u.role === 'IT_ADMIN' ? 'IT Admin' : u.role === 'ADP_ADMIN' ? 'ADP Admin' : 'Priest'}</span></td>
              <td className="table-cell"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.isActive ? 'Active' : 'Suspended'}</span></td>
              <td className="table-cell text-stone-warm text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
            </tr>))}
          </tbody></table></div>
        </SectionCard>
      </div>
    </>)
  }
  // ==================== ADP ADMIN: Rich Clergy Dashboard ====================
  if (user.role === 'ADP_ADMIN') {
    const now = new Date(); const currentMonth = now.getMonth(); const currentYear = now.getFullYear()
    const allProfiles = await prisma.priestProfile.findMany({ orderBy: { dateOfOrdination: 'asc' }, include: { user: { select: { name: true, email: true } } } })
    const active = allProfiles.filter((p: any) => p.ecclesiasticalStatus !== 'Deceased')
    const deceased = allProfiles.filter((p: any) => p.ecclesiasticalStatus === 'Deceased')
    const agesArr = active.map((p: any) => calculateAge(p.dateOfBirth)).filter((a: number) => a > 0)
    const avgAge = agesArr.length > 0 ? Math.round(agesArr.reduce((a: number, b: number) => a + b, 0) / agesArr.length) : 0
    const retirementEligible = active.filter((p: any) => calculateAge(p.dateOfBirth) >= 75)
    const nearRetirement = active.filter((p: any) => { const a = calculateAge(p.dateOfBirth); return a >= 70 && a < 75 })
    const ordThisMonth = active.filter((p: any) => { const d = parseDateParts(p.dateOfOrdination); return d && d.month === currentMonth }).sort((a: any, b: any) => (parseDateParts(a.dateOfOrdination)?.day || 0) - (parseDateParts(b.dateOfOrdination)?.day || 0))
    const bdayThisMonth = active.filter((p: any) => { const d = parseDateParts(p.dateOfBirth); return d && d.month === currentMonth }).sort((a: any, b: any) => (parseDateParts(a.dateOfBirth)?.day || 0) - (parseDateParts(b.dateOfBirth)?.day || 0))
    const necrThisMonth = deceased.filter((p: any) => { const d = parseDateParts(p.dateOfDeath); return d ? d.month === currentMonth : true }).sort((a: any, b: any) => (parseDateParts(a.dateOfDeath)?.day || 0) - (parseDateParts(b.dateOfDeath)?.day || 0))
    const fullNm = (p: any) => [p.firstName, p.lastName].filter(Boolean).join(' ') || p.user?.name || 'Unnamed'
    const succPriests = active.filter((p: any) => calculateAge(p.dateOfBirth) >= 70).sort((a: any, b: any) => calculateAge(b.dateOfBirth) - calculateAge(a.dateOfBirth))
    const [approved, pending, rejected] = await Promise.all([prisma.priestProfile.count({ where: { status: 'APPROVED' } }), prisma.priestProfile.count({ where: { status: 'PENDING' } }), prisma.priestProfile.count({ where: { status: 'REJECTED' } })])
    return (<>
      <PageHeader title="ADP Administration" subtitle="Active Presbyterate Overview & Chancery Management" action={<RoleBadge role="ADP_ADMIN" />} />
      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Active Presbyterate" value={active.length} icon={Users} color="bg-burgundy text-gold-light" />
          <StatCard label="Average Clergy Age" value={avgAge} icon={TrendingUp} color="bg-emerald-100 text-emerald-700" />
          <StatCard label="Retirement Ready (70+)" value={retirementEligible.length + nearRetirement.length} icon={Clock} color="bg-amber-100 text-amber-700" />
          <StatCard label="Necrology Record" value={deceased.length} icon={Flame} color="bg-purple-100 text-purple-700" />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="card card-shadow p-4"><p className="text-xs text-stone-warm">Approved Profiles</p><p className="text-2xl font-bold text-emerald-700">{approved}</p></div>
          <div className="card card-shadow p-4"><p className="text-xs text-stone-warm">Pending Review</p><p className="text-2xl font-bold text-amber-700">{pending}</p></div>
          <div className="card card-shadow p-4"><p className="text-xs text-stone-warm">Rejected</p><p className="text-2xl font-bold text-red-700">{rejected}</p></div>
        </div>
        <AnnouncementsCard role="ADP_ADMIN" />
        <SectionCard title={`Liturgical & Clergy Calendar — ${MONTHS[currentMonth]} ${currentYear}`}>
          <div className="grid md:grid-cols-3 gap-4">
            <div><h4 className="text-sm font-semibold flex items-center gap-1.5 mb-3 text-burgundy"><Award size={15} /> Ordination Anniversaries</h4>
              {ordThisMonth.length === 0 ? <p className="text-xs text-stone-warm italic">None</p> : <div className="space-y-1.5 max-h-48 overflow-y-auto">{ordThisMonth.slice(0, 8).map((p: any) => (<Link key={p.id} href={`/adp/priests/${p.id}`} className="block p-2 rounded border border-sand bg-cream/50 hover:border-gold/30 transition text-xs"><span className="font-medium">{fullNm(p)}</span><span className="text-stone-warm ml-1">— Day {parseDateParts(p.dateOfOrdination)?.day}</span>{getJubileeLabel(p.dateOfOrdination) && <span className="ml-1 text-amber-600 font-semibold">· {getJubileeLabel(p.dateOfOrdination)}</span>}</Link>))}</div>}
            </div>
            <div><h4 className="text-sm font-semibold flex items-center gap-1.5 mb-3 text-emerald-700"><Heart size={15} /> Priest Birthdays</h4>
              {bdayThisMonth.length === 0 ? <p className="text-xs text-stone-warm italic">None</p> : <div className="space-y-1.5 max-h-48 overflow-y-auto">{bdayThisMonth.slice(0, 8).map((p: any) => (<Link key={p.id} href={`/adp/priests/${p.id}`} className="block p-2 rounded border border-sand bg-cream/50 hover:border-emerald/30 transition text-xs"><span className="font-medium">{fullNm(p)}</span><span className="text-stone-warm ml-1">— Day {parseDateParts(p.dateOfBirth)?.day}</span></Link>))}</div>}
            </div>
            <div><h4 className="text-sm font-semibold flex items-center gap-1.5 mb-3 text-purple-700"><Flame size={15} /> Necrology Memorials</h4>
              {necrThisMonth.length === 0 ? <p className="text-xs text-stone-warm italic">None</p> : <div className="space-y-1.5 max-h-48 overflow-y-auto">{necrThisMonth.slice(0, 8).map((p: any) => (<Link key={p.id} href={`/adp/priests/${p.id}`} className="block p-2 rounded border border-purple-200 bg-purple-50/40 hover:border-purple-300 transition text-xs"><span className="font-medium text-purple-800">† {fullNm(p)}</span><span className="text-stone-warm ml-1">— {p.dateOfDeath || 'Unknown'}</span></Link>))}</div>}
            </div>
          </div>
          <div className="mt-4 text-right"><Link href="/adp/calendar" className="text-sm text-burgundy font-medium hover:underline inline-flex items-center gap-1">Full Calendar <ArrowRight size={13} /></Link></div>
        </SectionCard>
        <SectionCard title="Succession & Retirement — Priests ≥ 70 Years">
          {succPriests.length === 0 ? <p className="text-sm text-stone-warm">No priests approaching retirement age.</p> :
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b-2 border-sand text-stone-warm uppercase font-mono text-xs">
              <th className="pb-2 pr-3 text-left">Priest</th><th className="pb-2 pr-3 text-left">Age</th><th className="pb-2 pr-3 text-left">Status</th><th className="pb-2 pr-3 text-left">Ordination</th><th className="pb-2 pr-3 text-left">Assignment</th><th className="pb-2 text-left">Diocese</th>
            </tr></thead><tbody className="divide-y divide-sand/50">
              {succPriests.map((p: any) => { const age = calculateAge(p.dateOfBirth); const sl = age >= 75 ? 'Retirement Eligible' : 'Near Retirement'; const sc = age >= 75 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                return (<tr key={p.id} className="hover:bg-cream transition-colors">
                  <td className="py-2 pr-3 font-medium"><Link href={`/adp/priests/${p.id}`} className="hover:text-burgundy">{fullNm(p)}</Link></td>
                  <td className="py-2 pr-3 font-mono">{age}</td><td className="py-2 pr-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${sc}`}>{sl}</span></td>
                  <td className="py-2 pr-3 text-stone-warm text-xs">{p.dateOfOrdination || '—'}</td>
                  <td className="py-2 pr-3 text-stone-warm text-xs">{p.assignments?.[0] ? `${p.assignments[0].role} - ${p.assignments[0].parish}` : '—'}</td>
                  <td className="py-2 text-stone-warm text-xs">Archdiocese of Bamenda</td>
                </tr>)})}
            </tbody></table></div>}
        </SectionCard>
      </div>
    </>)
  }
  // ==================== PRIEST ====================
  const myProfile = await prisma.priestProfile.findUnique({
    where: { userId: user.id },
    select: { status: true, firstName: true, lastName: true, updatedAt: true, photoUrl: true },
  })

  return (
    <>
      <PageHeader title="My Dashboard" subtitle="Build and maintain your official clergy profile" action={<RoleBadge role="PRIEST" />} />
      <div className="max-w-3xl">
        <div className="card card-shadow p-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex items-center gap-4">
              <ClergyAvatar
                firstName={myProfile?.firstName}
                lastName={myProfile?.lastName}
                photoUrl={myProfile?.photoUrl}
                size="lg"
                ecclesiasticalStatus={myProfile?.status ? 'Active' : undefined}
              />
              <div>
                <p className="font-semibold text-lg">My Clergy Profile</p>
                <p className="text-sm text-stone-warm">{myProfile ? `${[myProfile.firstName, myProfile.lastName].filter(Boolean).join(' ')}`.trim() || 'Not yet started' : 'Not yet started'}</p>
              </div>
            </div>
            {myProfile && <StatusBadge status={myProfile.status} />}
          </div>
          <div className="border-t border-sand mt-6 pt-6">
            <p className="text-sm text-stone-warm leading-relaxed mb-4">Complete your structured questionnaire to build your official digital profile. Your profile becomes fully active only after review and approval by ADP administrators.</p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <Link href="/priest/questionnaire" className="btn-primary"><GraduationCap size={16} /> {myProfile && myProfile.status !== 'DRAFT' ? 'View / Edit My Profile' : 'Complete My Questionnaire'}</Link>
          </div>
        </div>
        <div className="mt-6"><AnnouncementsCard role="PRIEST" /></div>
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          {myProfile ? (<>
            <div className="card card-shadow p-5"><CalendarCheck size={18} className="text-gold mb-2" /><p className="text-sm font-medium">Last Updated</p><p className="text-stone-warm text-sm mt-1">{myProfile.updatedAt.toLocaleDateString()}</p></div>
            <div className="card card-shadow p-5"><FileCheck2 size={18} className="text-gold mb-2" /><p className="text-sm font-medium">Profile Status</p><div className="mt-1"><StatusBadge status={myProfile.status} /></div></div>
          </>) : (
            <div className="card card-shadow md:col-span-2"><EmptyState icon={UserRound} title="No profile yet" desc="Begin your clergy profile by completing the structured questionnaire." /></div>
          )}
        </div>
      </div>
    </>
  )
}
