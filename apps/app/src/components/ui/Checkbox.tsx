import MuiCheckbox from '@mui/material/Checkbox'

interface CheckboxProps {
  checked: boolean
  onChange: () => void
  'aria-label'?: string
}

export function Checkbox({ checked, onChange, ...rest }: CheckboxProps) {
  return (
    <MuiCheckbox
      checked={checked}
      onChange={onChange}
      slotProps={{ input: { 'aria-label': rest['aria-label'] } }}
      sx={{ padding: 0 }}
    />
  )
}
