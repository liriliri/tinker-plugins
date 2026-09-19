import type { ReactNode } from 'react'
import className from 'licia/className'
import { tw } from '../theme'

interface FieldProps {
  label: string
  hint?: string
  children: ReactNode
}

export default function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className={tw.label}>{label}</span>
      {children}
      {hint ? (
        <span className={className('text-[10px]', tw.text.muted)}>{hint}</span>
      ) : null}
    </label>
  )
}
