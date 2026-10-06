import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { SectionCard, SectionToolbar } from '../common/SectionCard'
import { ratePercentError } from '../../utils/validators'
import type { InstallmentRate, ReplaceInstallmentRatesPayload } from '../../types'

interface InstallmentRatesFormProps {
  rates: InstallmentRate[]
  onSave: (payload: ReplaceInstallmentRatesPayload) => Promise<void>
}

export function InstallmentRatesForm({ rates, onSave }: InstallmentRatesFormProps) {
  const [values, setValues] = useState(() => rates.map((rate) => String(rate.ratePercent)))
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)

  const errors = values.map((value) => (touched ? ratePercentError(value) : undefined))

  const submit = async () => {
    setTouched(true)
    if (values.some((value) => ratePercentError(value))) return
    setSaving(true)
    try {
      await onSave({
        rates: rates.map((rate, index) => ({
          installments: rate.installments,
          ratePercent: Number(values[index]),
        })),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionCard>
      <SectionToolbar>
        <Box>
          <Typography component="h2" sx={{ fontSize: 14, fontWeight: 700 }}>
            Taxas de parcelamento no cartão de crédito
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.disabled' }}>
            Acréscimo sobre o total à vista, de 1x a 12x. O vendedor pode ajustar na emissão.
          </Typography>
        </Box>
      </SectionToolbar>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 1.5,
          }}
        >
          {rates.map((rate, index) => (
            <TextField
              key={rate.installments}
              label={`${rate.installments}x`}
              type="number"
              value={values[index]}
              onChange={(e) =>
                setValues((prev) => prev.map((v, i) => (i === index ? e.target.value : v)))
              }
              error={!!errors[index]}
              helperText={errors[index]}
              slotProps={{
                htmlInput: { inputMode: 'decimal', min: 0, max: 100, step: '0.01' },
                input: { endAdornment: <InputAdornment position="end">%</InputAdornment> },
              }}
              fullWidth
            />
          ))}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<CheckOutlinedIcon />}
            onClick={() => void submit()}
            disabled={saving}
          >
            Salvar taxas
          </Button>
        </Box>
      </Box>
    </SectionCard>
  )
}
