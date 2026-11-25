import TextField from '@mui/material/TextField'
import type { TextFieldProps } from '@mui/material/TextField'
import { useState } from 'react'
import { parseDecimal, sanitizeDecimal } from '../../utils/format'

type DecimalFieldProps = Omit<TextFieldProps, 'value' | 'onChange' | 'type'> & {
  value: number | null
  onChange: (value: number | null) => void
  decimals?: number
}

const toText = (value: number | null) => (value === null ? '' : String(value).replace('.', ','))

export function DecimalField({
  value,
  onChange,
  decimals = 2,
  slotProps,
  ...rest
}: DecimalFieldProps) {
  const [text, setText] = useState(() => toText(value))
  const parsed = parseDecimal(text)
  const shown = (Number.isNaN(parsed) ? null : parsed) === value ? text : toText(value)

  return (
    <TextField
      {...rest}
      value={shown}
      onChange={(e) => {
        const next = sanitizeDecimal(e.target.value, decimals)
        setText(next)
        const number = parseDecimal(next)
        onChange(Number.isNaN(number) ? null : number)
      }}
      slotProps={{
        ...slotProps,
        htmlInput: { inputMode: 'decimal', ...slotProps?.htmlInput },
      }}
    />
  )
}
