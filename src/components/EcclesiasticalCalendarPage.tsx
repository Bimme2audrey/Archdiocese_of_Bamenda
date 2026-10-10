'use client'

import { useEffect, useState } from 'react'
import { PageHeader, SectionCard, Spinner, EmptyState } from '@/components/ui'
import ClergyAvatar from '@/components/ClergyAvatar'
import {
  Calendar as CalendarIcon, Award, Heart, Download, Printer,
  Search, Flame, UserCheck, BookOpen,
} from 'lucide-react'
import { MONTHS, parseDateParts, getJubileeLabel } from '@/lib/utils'

interface PriestRow {
  id: string
  firstName: string | null; lastName: string | null; middleName: string | null
  dateOfBirth: string | null; dateOfOrdination: string | null; diocese: string | null
  phoneNumber: string | null; nationality: string | null; photoUrl: string | null
  ecclesiasticalStatus: string | null
  dateOfDeath: string | null; restingPlace: string | null
  user: { name: string | null; email: string }
  assignments: Array<{ parish: string; role: string; isCurrent: boolean }>
}

export default function EcclesiasticalCalendarPage({ role }: { role: string }) {
  const [priests, setPriests] = useState<PriestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'calendar' | 'annual' | 'birthdays' | 'necrology' | 'printable'>('calendar')
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPriestIds, setSelectedPriestIds] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/reports/calendar', { headers: { 'x-role': role } })
      .then((r) => r.json())
      .then((d) => setPriests(d.profiles || []))
      .catch(() => setPriests([]))
      .finally(() => setLoading(false))
  }, [role])

  useEffect(() => {
    if (priests.length > 0 && selectedPriestIds.length === 0) {
      setSelectedPriestIds(priests.filter((p) => p.ecclesiasticalStatus !== 'Deceased').map((p) => p.id))
    }
  }, [priests, selectedPriestIds.length])

  const activePriests = priests.filter((p) => p.ecclesiasticalStatus !== 'Deceased')
  const selectedPriests = activePriests.filter((p) => selectedPriestIds.includes(p.id))
  const deceasedPriests = priests.filter((p) => p.ecclesiasticalStatus === 'Deceased')

  const fullName = (p: PriestRow) =>
    [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ') || p.user.name || 'Unnamed'

  const ordinationsInMonth = selectedPriests
    .filter((p) => { const d = parseDateParts(p.dateOfOrdination); return d && d.month === selectedMonth })
    .sort((a, b) => (parseDateParts(a.dateOfOrdination)?.day || 0) - (parseDateParts(b.dateOfOrdination)?.day || 0))

  const ordinationsByMonth = MONTHS.map((month, monthIndex) => ({
    month,
    monthIndex,
    priests: selectedPriests
      .filter((priest) => parseDateParts(priest.dateOfOrdination)?.month === monthIndex)
      .sort((a, b) => (parseDateParts(a.dateOfOrdination)?.day || 0) - (parseDateParts(b.dateOfOrdination)?.day || 0)),
  }))

  const birthdaysInMonth = activePriests
    .filter((p) => { const d = parseDateParts(p.dateOfBirth); return d && d.month === selectedMonth })
    .sort((a, b) => (parseDateParts(a.dateOfBirth)?.day || 0) - (parseDateParts(b.dateOfBirth)?.day || 0))

  const necrologyInMonth = deceasedPriests
    .filter((p) => { const d = parseDateParts(p.dateOfDeath); return d ? d.month === selectedMonth : true })
    .sort((a, b) => (parseDateParts(a.dateOfDeath)?.day || 0) - (parseDateParts(b.dateOfDeath)?.day || 0))

  const handleExportCSV = () => {
    const headers = ['Full Name', 'Status', 'DOB', 'Ordination Date', 'Email', 'Diocese', 'Current Assignment']
    const rows = priests.map((p) => [
      `"${fullName(p).replace(/"/g, '""')}"`,
      p.ecclesiasticalStatus || 'Active', p.dateOfBirth || '', p.dateOfOrdination || '',
      p.user.email, p.diocese || '',
      p.assignments?.[0] ? `${p.assignments[0].role} - ${p.assignments[0].parish}` : '',
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'presbyterate-directory.csv'; a.click(); URL.revokeObjectURL(url)
  }

  function escapeIcs(value: string) {
    return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
  }

  function exportAnnualCalendar() {
    const events = activePriests.flatMap((priest) => {
      const ordination = parseDateParts(priest.dateOfOrdination)
      if (!ordination) return []
      const day = Math.min(ordination.day, new Date(selectedYear, ordination.month + 1, 0).getDate())
      const date = `${selectedYear}${String(ordination.month + 1).padStart(2, '0')}${String(day).padStart(2, '0')}`
      const nextDay = new Date(selectedYear, ordination.month, day + 1)
      const endDate = `${nextDay.getFullYear()}${String(nextDay.getMonth() + 1).padStart(2, '0')}${String(nextDay.getDate()).padStart(2, '0')}`
      const name = fullName(priest)
      const lines = [
        'BEGIN:VEVENT',
        `UID:${priest.id}-${date}@adp-clergy`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
        `DTSTART;VALUE=DATE:${date}`,
        `DTEND;VALUE=DATE:${endDate}`,
        `SUMMARY:${escapeIcs(`Ordination Anniversary: ${name}`)}`,
        `DESCRIPTION:${escapeIcs(`Ordained ${priest.dateOfOrdination}${priest.diocese ? `\\n${priest.diocese}` : ''}`)}`,
      ]
      if (priest.photoUrl && !priest.photoUrl.startsWith('data:')) {
        const imageUrl = priest.photoUrl.startsWith('/') ? `${window.location.origin}${priest.photoUrl}` : priest.photoUrl
        lines.push(`IMAGE;VALUE=URI:${escapeIcs(imageUrl)}`)
      }
      lines.push('END:VEVENT')
      return [lines.join('\r\n')]
    })
    const calendar = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ADP Clergy System//Ordination Calendar//EN', `X-WR-CALNAME:${selectedYear} Ordination Anniversaries`, ...events, 'END:VCALENDAR'].join('\r\n')
    const url = URL.createObjectURL(new Blob([calendar], { type: 'text/calendar;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `adp-ordination-calendar-${selectedYear}.ics`
    link.click()
    URL.revokeObjectURL(url)
  }

  const filteredPriests = searchQuery
    ? priests.filter((p) => fullName(p).toLowerCase().includes(searchQuery.toLowerCase()) || p.user.email.toLowerCase().includes(searchQuery.toLowerCase()))
    : priests

  const tabs = [
    { key: 'calendar' as const, label: 'Ordination Anniversaries', icon: Award },
    { key: 'annual' as const, label: 'Annual Calendar', icon: CalendarIcon },
    { key: 'birthdays' as const, label: 'Birthdays', icon: Heart },
    { key: 'necrology' as const, label: 'Necrology', icon: Flame },
    { key: 'printable' as const, label: 'Printable Directory', icon: Printer },
  ]
  const statColor = (s: string | null) =>
    s === 'Deceased' ? 'bg-red-100 text-red-700' : s === 'Retired' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <div className="space-y-6">
      <PageHeader title="Ecclesiastical Calendar" subtitle="Liturgical anniversaries, birthdays, necrology, and presbyterate directory." />
      <SectionCard>
        <div className="flex flex-wrap gap-1 p-1 bg-sand/60 rounded-lg mb-4 print:hidden">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-2 ${activeTab === t.key ? 'bg-white shadow-sm' : 'text-stone-warm hover:text-ink'}`}>
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4">
          {activeTab === 'annual' ? (
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <CalendarIcon size={16} className="text-stone-warm" />
              <select className="input-base w-auto" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} aria-label="Calendar year">
                {Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 5 + i).map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
              <button onClick={() => window.print()} className="btn-secondary"><Printer size={15} /> Print / Save PDF</button>
              <button onClick={exportAnnualCalendar} className="btn-secondary"><Download size={15} /> Download .ics</button>
            </div>
          ) : activeTab !== 'printable' ? (
            <div className="flex items-center gap-2">
              <CalendarIcon size={16} className="text-stone-warm" />
              <select className="input-base w-auto" value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
                {MONTHS.map((m, i) => (<option key={i} value={i}>{m}</option>))}
              </select>
            </div>
          ) : (
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-warm" />
              <input className="input-base pl-9" placeholder="Search name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          )}
          <button onClick={handleExportCSV} className="btn-secondary print:hidden"><Download size={15} /> Export CSV</button>
        </div>

        {activeTab === 'calendar' && (
          ordinationsInMonth.length === 0 ? (
            <EmptyState icon={Award} title="No anniversaries" desc={`No ordinations in ${MONTHS[selectedMonth]}.`} />
          ) : (<div className="space-y-3">{ordinationsInMonth.map((p) => (
            <div key={p.id} className="flex items-start gap-4 p-4 rounded-lg border border-sand bg-cream/50">
              <ClergyAvatar firstName={p.firstName} lastName={p.lastName} photoUrl={p.photoUrl} size="md" ecclesiasticalStatus={p.ecclesiasticalStatus} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{fullName(p)}</p>
                <p className="text-sm text-stone-warm">Ordained: {p.dateOfOrdination}
                  {getJubileeLabel(p.dateOfOrdination) && (<span className="ml-2 inline-flex items-center gap-1 text-amber-700 bg-amber-100 rounded-full px-2 py-0.5 text-xs font-medium"><Award size={11} /> {getJubileeLabel(p.dateOfOrdination)}</span>)}
                </p>
                <p className="text-xs text-stone-warm mt-1">{p.diocese || '—'} · {p.user.email}</p>
              </div>
            </div>
          ))}</div>)
        )}

        {activeTab === 'annual' && (
          <div className="annual-calendar-print space-y-5">
            <header className="hidden print:block border-b-2 border-stone-800 pb-3">
              <h1 className="text-2xl font-bold">Archdiocese of Bamenda</h1>
              <p className="text-lg">Ordination Anniversaries · {selectedYear}</p>
            </header>
            {ordinationsByMonth.every((group) => group.priests.length === 0) ? (
              <EmptyState icon={Award} title="No ordination anniversaries recorded" desc={`There are no priest ordination dates to include in ${selectedYear}.`} />
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 print:grid-cols-3 print:gap-3">
                {ordinationsByMonth.map(({ month, monthIndex, priests: monthPriests }) => (
                  <section key={monthIndex} className="rounded-lg border border-sand p-4 print:break-inside-avoid print:border-stone-300 print:p-3">
                    <h2 className="font-semibold text-burgundy border-b border-sand pb-2 mb-3 print:text-black">{month} {selectedYear}</h2>
                    {monthPriests.length === 0 ? (
                      <p className="text-xs text-stone-warm">No anniversaries</p>
                    ) : (
                      <div className="space-y-3">
                        {monthPriests.map((priest) => {
                          const ordination = parseDateParts(priest.dateOfOrdination)
                          return (
                            <div key={priest.id} className="flex items-center gap-2.5">
                              <ClergyAvatar firstName={priest.firstName} lastName={priest.lastName} photoUrl={priest.photoUrl} size="sm" ecclesiasticalStatus={priest.ecclesiasticalStatus} />
                              <div className="min-w-0">
                                <p className="text-sm font-medium leading-tight">{ordination?.day} {month.slice(0, 3)} · {fullName(priest)}</p>
                                <p className="text-xs text-stone-warm">Ordained {priest.dateOfOrdination}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </section>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'birthdays' && (
          birthdaysInMonth.length === 0 ? (
            <EmptyState icon={Heart} title="No birthdays" desc={`No birthdays in ${MONTHS[selectedMonth]}.`} />
          ) : (<div className="space-y-3">{birthdaysInMonth.map((p) => (
            <div key={p.id} className="flex items-start gap-4 p-4 rounded-lg border border-sand bg-cream/50">
              <ClergyAvatar firstName={p.firstName} lastName={p.lastName} photoUrl={p.photoUrl} size="md" ecclesiasticalStatus={p.ecclesiasticalStatus} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{fullName(p)}</p><p className="text-sm text-stone-warm">Born: {p.dateOfBirth}</p>
                <p className="text-xs text-stone-warm mt-1">{p.diocese || '—'} · {p.user.email}</p>
              </div>
            </div>
          ))}</div>)
        )}
        {activeTab === 'necrology' && (
          necrologyInMonth.length === 0 ? (
            <EmptyState icon={Flame} title="No memorials" desc={`No memorials in ${MONTHS[selectedMonth]}.`} />
          ) : (<div className="space-y-3">{necrologyInMonth.map((p) => (
            <div key={p.id} className="flex items-start gap-4 p-4 rounded-lg border border-purple-200 bg-purple-50/40">
              <ClergyAvatar firstName={p.firstName} lastName={p.lastName} photoUrl={p.photoUrl} size="md" isDeceased={true} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-purple-800">† {fullName(p)}</p>
                <p className="text-sm text-stone-warm">Died: {p.dateOfDeath || 'Unknown'}</p>
                <p className="text-xs text-stone-warm mt-0.5">Resting: {p.restingPlace || 'Cemetery'}</p>
                <p className="text-xs text-stone-warm mt-1">{p.user.email}</p>
              </div>
            </div>
          ))}</div>)
        )}

        {activeTab === 'printable' && (
          <div>
            <button onClick={() => window.print()} className="btn-secondary mb-4"><Printer size={15} /> Print Directory</button>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-sand text-stone-warm uppercase font-mono text-xs">
                    <th className="pb-3 pr-2">#</th><th className="pb-3 pr-4">Full Name</th><th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Ordination</th><th className="pb-3 pr-4">Current Assignment</th>
                    <th className="pb-3 pr-4">Phone</th><th className="pb-3">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand/50">
                  {filteredPriests.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-cream transition-colors">
                      <td className="py-3 pr-2 font-mono text-stone-warm">{idx + 1}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2 font-medium">
                          <ClergyAvatar firstName={p.firstName} lastName={p.lastName} photoUrl={p.photoUrl} size="sm" ecclesiasticalStatus={p.ecclesiasticalStatus} />
                          <span>{fullName(p)}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4"><span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${statColor(p.ecclesiasticalStatus)}`}>{p.ecclesiasticalStatus || 'Active'}</span></td>
                      <td className="py-3 pr-4 font-mono text-amber-700">{p.dateOfOrdination || '—'}</td>
                      <td className="py-3 pr-4 text-stone-warm">{p.assignments?.[0] ? `${p.assignments[0].role} - ${p.assignments[0].parish}` : '—'}</td>
                      <td className="py-3 pr-4 font-mono text-stone-warm">{p.phoneNumber || '—'}</td>
                      <td className="py-3 font-mono text-stone-warm text-xs">{p.user.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  )
}