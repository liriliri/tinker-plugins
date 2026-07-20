import type { ReactNode } from 'react'
import { tw } from '../theme'

interface FieldProps {
  label: string
  children: ReactNode
}

export default function Field({ label, children }: FieldProps) {
  return (
    <label className="block">
      <span className={tw.label}>{label}</span>
      {children}
    </label>
  )
}
