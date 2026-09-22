import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import Radio from '@mui/material/Radio'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { ApiError } from '../../api'
import { formatCurrency, formatDate, formatIsoDate, formatPercent } from '../../utils/format'
import { ratePercentError } from '../../utils/validators'
import { ToneChip } from '../common/ToneChip'
import {
  MAX_INSTALLMENTS,
  simulateInstallment,
  sumCashTotal,
} from './installmentSimulation'
import { MAX_VALIDITY_AHEAD_DAYS, validUntilError, validityDateFrom } from './quotationValidity'
import type { InstallmentRate, IssueQuotationPayload, Quotation } from '../../types'

interface NegotiationQuotationsTabProps {
  items: { subtotal: number }[]
  installmentRates: InstallmentRate[] | null
  installmentRatesError: string | null
  defaultValidityDays: number
  quotations: Quotation[] | null
  quotationsError: string | null
  onIssueQuotation?: (payload: IssueQuotationPayload) => Promise<unknown>
}

export function NegotiationQuotationsTab({
  items,
  installmentRates,
  installmentRatesError,
  defaultValidityDays,
  quotations,
  quotationsError,
  onIssueQuotation,
}: NegotiationQuotationsTabProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <IssuedQuotations quotations={quotations} error={quotationsError} />
      {installmentRatesError ? (
        <Alert severity="error">{installmentRatesError}</Alert>
      ) : !installmentRates ? (
        <Typography sx={{ p: 3, textAlign: 'center', color: 'text.disabled', fontSize: 13 }}>
          Carregando taxas…
        </Typography>
      ) : (
        <InstallmentSimulationTable
          cashTotal={sumCashTotal(items)}
          rates={installmentRates}
          defaultValidityDays={defaultValidityDays}
          onIssue={onIssueQuotation}
        />
      )}
    </Box>
  )
}

const INSTALLMENT_OPTIONS = Array.from({ length: MAX_INSTALLMENTS }, (_, index) => index + 1)

function describeInstallments({
  installments,
  installmentValue,
  firstInstallment,
}: {
  installments: number
  installmentValue: number
  firstInstallment: number
}) {
  if (firstInstallment === installmentValue) {
    return `${installments}x de ${formatCurrency(installmentValue)}`
  }
  return `1ª de ${formatCurrency(firstInstallment)} + ${installments - 1}x de ${formatCurrency(installmentValue)}`
}

function IssuedQuotations({
  quotations,
  error,
}: {
  quotations: Quotation[] | null
  error: string | null
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>Orçamentos emitidos</Typography>
      {error ? (
        <Alert severity="error">{error}</Alert>
      ) : !quotations ? (
        <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>Carregando orçamentos…</Typography>
      ) : quotations.length === 0 ? (
        <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>
          Nenhum orçamento emitido nesta negociação.
        </Typography>
      ) : (
        <Table size="small" aria-label="Orçamentos emitidos">
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Emitido em</TableCell>
              <TableCell>Condição</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Validade</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {quotations.map((quotation) => (
              <TableRow key={quotation.id}>
                <TableCell sx={{ fontWeight: 600 }}>{quotation.code}</TableCell>
                <TableCell>{formatDate(quotation.createdAt)}</TableCell>
                <TableCell>
                  {`${describeInstallments({
                    installments: quotation.installments,
                    installmentValue: quotation.installmentValue,
                    firstInstallment: quotation.firstInstallmentValue,
                  })} · ${formatPercent(quotation.ratePercent)}`}
                </TableCell>
                <TableCell align="right">{formatCurrency(quotation.totalWithInterest)}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {formatIsoDate(quotation.validUntil)}
                    {quotation.expired && <ToneChip tone="red">Vencido</ToneChip>}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  )
}

function InstallmentSimulationTable({
  cashTotal,
  rates,
  defaultValidityDays,
  onIssue,
}: {
  cashTotal: number
  rates: InstallmentRate[]
  defaultValidityDays: number
  onIssue?: (payload: IssueQuotationPayload) => Promise<unknown>
}) {
  const [values, setValues] = useState(() =>
    INSTALLMENT_OPTIONS.map((installments) =>
      String(rates.find((rate) => rate.installments === installments)?.ratePercent ?? 0),
    ),
  )
  const [selected, setSelected] = useState<number | null>(null)
  const [validUntil, setValidUntil] = useState(() =>
    validityDateFrom(new Date(), defaultValidityDays),
  )
  const [issuing, setIssuing] = useState(false)
  const [issueError, setIssueError] = useState<string | null>(null)

  const today = new Date()
  const validUntilProblem = validUntilError(validUntil, today)
  const selectedRateProblem = selected === null ? null : ratePercentError(values[selected - 1])
  const canIssue = selected !== null && !selectedRateProblem && !validUntilProblem && !issuing

  const issue = async () => {
    if (!onIssue || selected === null) return
    setIssueError(null)
    setIssuing(true)
    try {
      await onIssue({
        installments: selected,
        ratePercent: Number(values[selected - 1]),
        validUntil,
      })
    } catch (err) {
      setIssueError(
        err instanceof ApiError ? err.message : 'Não foi possível emitir o orçamento.',
      )
    } finally {
      setIssuing(false)
    }
  }

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
          Cartão de crédito · sobre os itens salvos · simular não grava nada
        </Typography>
      </Box>

      <Table size="small" aria-label="Simulação de parcelamento">
        <TableHead>
          <TableRow>
            {onIssue && <TableCell padding="checkbox" />}
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
              <TableRow key={installments} selected={selected === installments}>
                {onIssue && (
                  <TableCell padding="checkbox">
                    <Radio
                      size="small"
                      checked={selected === installments}
                      onChange={() => setSelected(installments)}
                      slotProps={{ input: { 'aria-label': `Escolher ${installments}x` } }}
                    />
                  </TableCell>
                )}
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

      {onIssue && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {issueError && <Alert severity="error">{issueError}</Alert>}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <TextField
              size="small"
              type="date"
              label="Validade"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              error={!!validUntilProblem}
              helperText={validUntilProblem ?? `Até ${MAX_VALIDITY_AHEAD_DAYS} dias.`}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: {
                  min: validityDateFrom(today, 1),
                  max: validityDateFrom(today, MAX_VALIDITY_AHEAD_DAYS),
                },
              }}
            />
            <Button variant="contained" onClick={() => void issue()} disabled={!canIssue}>
              {issuing ? 'Emitindo…' : 'Emitir orçamento'}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  )
}
