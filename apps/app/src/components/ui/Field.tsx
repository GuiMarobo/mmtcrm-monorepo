import type { ReactNode } from 'react'

interface FieldProps {
  label: ReactNode
  children: ReactNode
  inline?: boolean
  required?: boolean
  error?: string | null
}

export function Field({ label, children, inline = false, required = false, error }: FieldProps) {
  const className = ['field', inline ? 'inline' : '', error ? 'has-error' : '']
    .filter(Boolean)
    .join(' ')
  return (
    <div className={className}>
      <label>
        {label}
        {required && <span className="req"> *</span>}
      </label>
      {children}
      {error && <div className="field-error">{error}</div>}
    </div>
  )
}

export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="field-row">{children}</div>
}
