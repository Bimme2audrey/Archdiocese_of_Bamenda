'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  leadingIcon?: React.ReactNode
}

export default function PasswordInput({ className, leadingIcon, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      {leadingIcon}
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={cn('input-base pr-11', leadingIcon && 'pl-9', className)}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-stone-warm hover:bg-sand hover:text-ink focus:outline-none focus:ring-2 focus:ring-gold"
        aria-label={visible ? 'Hide password' : 'Show password'}
        title={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  )
}