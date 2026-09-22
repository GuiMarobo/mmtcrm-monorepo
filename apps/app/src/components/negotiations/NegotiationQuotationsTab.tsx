import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import InputAdornment from '@mui/material/InputAdornment'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { formatCurrency } from '../../utils/format'
import { ratePercentError } from '../../utils/validators'
import {
  MAX_INSTALLMENTS,
  simulateInstallment,
  sumCashTotal,
} from './installmentSimulation'
import type { InstallmentSimulation } from './installmentSimulation'
import type { InstallmentRate } from '../../types'

interface NegotiationQuotationsTabProps {
  items: { subtotal: number }[]
  installmentRates: InstallmentRate[] | null
  installmentRatesError: string | null
}

export function NegotiationQuotationsTab({
  items,
  installmentRates,
  installmentRatesError,
}: NegotiationQuotationsTabProps) {
  if (installmentRatesError) return <Alert severity="error">{installmentRatesError}</Alert>
  if (!installmentRates) {
    return (
      <Typography sx={{ p: 3, textAlign: 'center', color: 'text.disabled', fontSize: 13 }}>
        Carregando taxas…
      </Typography>
    )
  }
  return <InstallmentSimulationTable cashTotal={sumCashTotal(items)} rates={installmentRates} />
}

const INSTALLMENT_OPTIONS = Array.from({ length: MAX_INSTALLMENTS }, (_, index) => index + 1)

function describeInstallments(simulation: InstallmentSimulation) {
  const { installments, installmentValue, firstInstallment } = simulation
  if (firstInstallment === installmentValue) {
    return `${installments}x de ${formatCurrency(installmentValue)}`
  }
  return `1ª de ${formatCurrency(firstInstallment)} + ${installments - 1}x de ${formatCurrency(installmentValue)}`
}

function InstallmentSimulationTable({
  cashTotal,
  rates,
}: {
  cashTotal: number
  rates: InstallmentRate[]
}) {
  const [values, setValues] = useState(() =>
    INSTALLMENT_OPTIONS.map((installments) =>
      String(rates.find((rate) => rate.installments === installments)?.ratePercent ?? 0),
    ),
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2 }}>
        <Typography sx={{ fontSize: 13.5 }}>
          Total à vista:{' '}
          <Box component="strong" sx={{ fontWeight: 700 }}>
            {formatCurrency(cashTotal)}
          </Box>
        </Typography>
        <Typography sx={{ fontSize: 12, color: 'text.disabled', textAlign: 'right' }}>
          Cartão de crédito · sobre os itens salvos · nada é gravado
        </Typography>
      </Box>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Parcelas</TableCell>
            <TableCell>Taxa</TableCell>
            <TableCell>Parcela</TableCell>
            <TableCell align="right">Total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {INSTALLMENT_OPTIONS.map((installments, index) => {
            const error = ratePercentError(values[index])
            const simulation = error
              ? null
              : simulateInstallment(cashTotal, installments, Number(values[index]))
            return (
              <TableRow key={installments}>
                <TableCell sx={{ fontWeight: 600 }}>{installments}x</TableCell>
                <TableCell sx={{ width: 120 }}>
                  <TextField
                    size="small"
                    type="number"
                    value={values[index]}
                    onChange={(e) =>
                      setValues((prev) =>
                        prev.map((value, i) => (i === index ? e.target.value : value)),
                      )
                    }
                    error={!!error}
                    helperText={error}
                    slotProps={{
                      htmlInput: {
                        'aria-label': `Taxa ${installments}x`,
                        inputMode: 'decimal',
                        min: 0,
                        max: 100,
                        step: '0.01',
                      },
                      input: { endAdornment: <InputAdornment position="end">%</InputAdornment> },
                    }}
                  />
                </TableCell>
                <TableCell>{simulation ? describeInstallments(simulation) : '—'}</TableCell>
                <TableCell align="right">
                  {simulation ? (
                    <>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                        {formatCurrency(simulation.totalWithInterest)}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 11.5,
                          color: simulation.surcharge > 0 ? 'warning.main' : 'text.disabled',
                        }}
                      >
                        {simulation.surcharge > 0
                          ? `+${formatCurrency(simulation.surcharge)}`
                          : 'sem acréscimo'}
                      </Typography>
                    </>
                  ) : (
                    '—'
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Box>
  )
}
