'use client'

import React from 'react'

interface ClergyAvatarProps {
  photoUrl?: string | null
  fullName?: string | null
  firstName?: string | null
  lastName?: string | null
  size?: 'sm' | 'md' | 'lg'
  isDeceased?: boolean
  ecclesiasticalStatus?: string | null
}

export default function ClergyAvatar({
  photoUrl,
  fullName,
  firstName,
  lastName,
  size = 'md',
  isDeceased,
  ecclesiasticalStatus,
}: ClergyAvatarProps) {
  const resolvedName = fullName || [firstName, lastName].filter(Boolean).join(' ') || 'Priest'
  const resolvedDeceased =
    isDeceased !== undefined ? isDeceased : ecclesiasticalStatus === 'Deceased'

  const hasPhoto = photoUrl && photoUrl.trim() !== '' && !photoUrl.includes('unsplash.com')

  // Strip titles for initials
  const cleanName = resolvedName
    .replace(/Rev\.\s*Fr\.\s*|Rev\.\s*Monsignor\s*|Monsignor\s*|Fr\.\s*|Most\s*Rev\.\s*|Bishop\s*/i, '')
    .trim()
  const parts = cleanName.split(/\s+/).filter(Boolean)
  const initials = parts.map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'P'

  let sizeClasses = 'w-10 h-10 rounded-lg text-xs'
  if (size === 'md') sizeClasses = 'w-14 h-14 rounded-xl text-sm'
  if (size === 'lg') sizeClasses = 'w-24 h-24 rounded-2xl text-2xl'

  if (hasPhoto) {
    return (
      <img
        src={photoUrl!}
        alt={resolvedName}
        className={`${sizeClasses} object-cover border border-sand/50 shadow-md shrink-0`}
        referrerPolicy="no-referrer"
      />
    )
  }

  const bgStyle = resolvedDeceased
    ? 'bg-purple-50 border-purple-200 text-purple-700'
    : 'bg-gold/10 border-gold/30 text-gold'

  return (
    <div
      className={`${sizeClasses} ${bgStyle} border flex flex-col items-center justify-center font-serif font-bold shadow-sm shrink-0 relative select-none`}
    >
      <span>{initials}</span>
      {resolvedDeceased && (
        <span className="absolute bottom-0.5 text-[9px] font-sans font-normal text-purple-500">
          †
        </span>
      )}
      {!resolvedDeceased && size === 'lg' && (
        <span className="absolute bottom-1 text-[8px] font-sans font-normal text-gold/40 uppercase tracking-widest font-mono">
          AMD
        </span>
      )}
    </div>
  )
}