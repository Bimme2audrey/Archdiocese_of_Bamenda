// Helpers for showing clergy records in life order (earliest first).
// Dates in records are free text ("2010", "Sept 2010", "2010-09-01"), so we
// read the first year (and month, when written as YYYY-MM) we can find.

const ACADEMIC_LEVEL_ORDER = ['PRIMARY', 'SECONDARY', 'SEMINARY', 'PHILOSOPHY', 'THEOLOGY', 'UNIVERSITY', 'OTHER']

function dateKey(value: string | null | undefined): number {
  if (!value) return Number.POSITIVE_INFINITY
  const iso = value.match(/(\d{4})-(\d{2})(?:-(\d{2}))?/)
  if (iso) return Number(iso[1]) * 10000 + Number(iso[2]) * 100 + Number(iso[3] || 0)
  const year = value.match(/\d{4}/)
  if (year) return Number(year[0]) * 10000
  return Number.POSITIVE_INFINITY
}

function levelRank(level: string | null | undefined): number {
  const index = ACADEMIC_LEVEL_ORDER.indexOf(level || '')
  return index === -1 ? ACADEMIC_LEVEL_ORDER.length : index
}

function byDate<T>(items: T[] | null | undefined, start: (item: T) => string | null | undefined, tiebreak?: (a: T, b: T) => number): T[] {
  return [...(items || [])].sort((a, b) => {
    const keyA = dateKey(start(a))
    const keyB = dateKey(start(b))
    if (keyA !== keyB) return keyA < keyB ? -1 : 1
    return tiebreak ? tiebreak(a, b) : 0
  })
}

export function sortAcademicRecords<T extends { startYear?: string | null; level?: string | null }>(records: T[] | null | undefined): T[] {
  return byDate(records, (r) => r.startYear, (a, b) => levelRank(a.level) - levelRank(b.level))
}

export function sortByStartDate<T extends { startDate?: string | null }>(items: T[] | null | undefined): T[] {
  return byDate(items, (i) => i.startDate)
}

// Returns a copy of the profile with its dated lists in chronological order.
export function withChronologicalRecords<P extends { academicRecords?: any[]; assignments?: any[]; ministries?: any[] }>(profile: P): P {
  return {
    ...profile,
    academicRecords: sortAcademicRecords(profile.academicRecords),
    assignments: sortByStartDate(profile.assignments),
    ministries: sortByStartDate(profile.ministries),
  }
}
