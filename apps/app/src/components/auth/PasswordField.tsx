import { useState } from 'react'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import { I } from '../../icons'

interface PasswordFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  autoFocus?: boolean
  revealable?: boolean
}

export function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  autoFocus,
  revealable = true,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <TextField
      label={label}
      type={visible ? 'text' : 'password'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      fullWidth
      margin="dense"
      slotProps={{
        input: revealable
          ? {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
                    edge="end"
                    size="small"
                  >
                    {visible ? I.eyeOff : I.eye}
                  </IconButton>
                </InputAdornment>
              ),
            }
          : undefined,
      }}
    />
  )
}
