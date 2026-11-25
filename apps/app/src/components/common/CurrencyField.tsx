import TextField from '@mui/material/TextField'
import type { TextFieldProps } from '@mui/material/TextField'
import { MAX_MONEY, formatCurrency, parseCurrencyInput } from '../../utils/format'

type CurrencyFieldProps = Omit<TextFieldProps, 'value' | 'onChange' | 'type'> & {
  value: number | null
  onChange: (value: number | null) => void
  max?: number
}

export function CurrencyField({
  value,
  onChange,
  max = MAX_MONEY,
  slotProps,
  placeholder = 'R$ 0,00',
  ...rest
}: CurrencyFieldProps) {
  return (
    <TextField
      {...rest}
      placeholder={placeholder}
      value={value === null ? '' : formatCurrency(value)}
      onChange={(e) => {
        const next = parseCurrencyInput(e.target.value)
        if (next === null || next <= max) onChange(next)
      }}
      slotProps={{
        ...slotProps,
        htmlInput: { inputMode: 'numeric', ...slotProps?.htmlInput },
      }}
    />
  )
}
