import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'

interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchField({ value, onChange, placeholder }: SearchFieldProps) {
  return (
    <TextField
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      sx={{ flex: 1, minWidth: 200, maxWidth: { sm: 320 } }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start" sx={{ color: 'text.disabled' }}>
              <SearchOutlinedIcon />
            </InputAdornment>
          ),
        },
      }}
    />
  )
}
