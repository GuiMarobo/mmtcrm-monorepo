import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import { useState } from 'react'

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
                    {visible ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }
          : undefined,
      }}
    />
  )
}
