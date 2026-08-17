import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import { I } from '../../icons'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <TextField
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      sx={{ flex: 1, maxWidth: 320 }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start" sx={{ color: 'text.disabled' }}>
              {I.search}
            </InputAdornment>
          ),
        },
      }}
    />
  )
}
