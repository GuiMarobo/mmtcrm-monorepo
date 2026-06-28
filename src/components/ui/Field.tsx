import type { ReactNode } from 'react'

interface FieldProps {
  label: ReactNode
  children: ReactNode
  inline?: boolean
  required?: boolean
}

export function Field({ label, children, inline = false, required = false }: FieldProps) {
  return (
    <div className={inline ? 'field inline' : 'field'}>
      <label>
        {label}
        {required && <span className="req"> *</span>}
      </label>
      {children}
    </div>
  )
}

export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="field-row">{children}</div>
}
