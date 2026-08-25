import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'
import FormHelperText from '@mui/material/FormHelperText'
import Box from '@mui/material/Box'
import type { ReactNode } from 'react'

interface FieldProps {
  label: ReactNode
  children: ReactNode
  inline?: boolean
  required?: boolean
  error?: string | null
}

export function Field({
  label,
  children,
  inline = false,
  required = false,
  error,
}: FieldProps) {
  const className = ['field', inline ? 'inline' : '', error ? 'has-error' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <FormControl className={className} error={!!error} fullWidth>
      <FormLabel sx={{ color: 'text.secondary', mb: '6px' }}>
        {label}
        {required && <Box component="span" sx={{ color: 'error.main' }}> *</Box>}
      </FormLabel>
      {children}
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  )
}

export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="field-row">{children}</div>
}
