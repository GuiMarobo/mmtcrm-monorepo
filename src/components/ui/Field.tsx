import type { ReactNode } from 'react'

interface FieldProps {
  label: ReactNode
  children: ReactNode
  inline?: boolean
}

export function Field({ label, children, inline = false }: FieldProps) {
  return (
    <div className={inline ? 'field inline' : 'field'}>
      <label>{label}</label>
      {children}
    </div>
  )
}

export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="field-row">{children}</div>
}
