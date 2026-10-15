import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { ApiError } from '../../api'
import { FormDialog } from '../common/FormDialog'
import { DetailField } from '../common/DetailSection'
import { EvaluationStatusChip } from './EvaluationStatusChip'
import { receivedLabel } from './receivedLabel'
import { formatCurrency, formatDate } from '../../utils/format'
import {
  DEVICE_CONDITION_LABELS,
  DEVICE_CONDITION_OPTIONS,
  EVALUATION_STATUS_LABELS,
} from '../../types'
import type {
  DeviceCondition,
  EvaluateUsedDevicePayload,
  QueueUsedDevice,
  RefuseUsedDevicePayload,
  UsedDeviceDetail,
} from '../../types'

interface UsedDeviceEvaluationDialogProps {
  device: QueueUsedDevice
  detail: UsedDeviceDetail | null
  historyError?: string | null
  onEvaluate: (payload: EvaluateUsedDevicePayload) => Promise<unknown>
  onRefuse: (payload: RefuseUsedDevicePayload) => Promise<unknown>
  onClose: () => void
}

const sectionTitleSx = { fontSize: 12.5, fontWeight: 600 }

export function UsedDeviceEvaluationDialog({
  device,
  detail,
  historyError = null,
  onEvaluate,
  onRefuse,
  onClose,
}: UsedDeviceEvaluationDialogProps) {
  const readOnly = device.negotiation.status !== 'ABERTA'
  const [condition, setCondition] = useState<DeviceCondition | ''>(device.condition ?? '')
  const [value, setValue] = useState(
    device.estimatedValue === null ? '' : String(device.estimatedValue),
  )
  const [report, setReport] = useState(device.report ?? '')
  const [icloudUnlocked, setIcloudUnlocked] = useState(device.icloudUnlocked === true)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const conditionProblem = condition ? undefined : 'Informe a condição.'
  const valueProblem = Number(value) > 0 ? undefined : 'O valor deve ser maior que zero.'
  const reportText = report.trim()

  const run = async (action: () => Promise<unknown>) => {
    setError(null)
    setSaving(true)
    try {
      await action()
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível registrar a avaliação.')
    } finally {
      setSaving(false)
    }
  }

  const evaluate = () => {
    setSubmitted(true)
    if (!condition || conditionProblem || valueProblem) return
    void run(() =>
      onEvaluate({
        condition,
        estimatedValue: Number(value),
        report: reportText || null,
        icloudUnlocked,
      }),
    )
  }

  const refuse = () => {
    if (!reportText) return
    void run(() => onRefuse({ report: reportText }))
  }

  return (
    <FormDialog
      title={device.model}
      subtitle={`Série ${device.serialNumber}${device.imei ? ` · IMEI ${device.imei}` : ''}`}
      width={640}
      onClose={onClose}
      closeOnBackdrop={false}
      footer={
        readOnly ? (
          <Button variant="contained" onClick={onClose}>
            Fechar
          </Button>
        ) : (
          <>
            <Button
              variant="outlined"
              color="error"
              onClick={refuse}
              disabled={saving || !reportText}
            >
              Recusar
            </Button>
            <Button variant="contained" onClick={evaluate} disabled={saving || !icloudUnlocked}>
              Avaliar
            </Button>
          </>
        )
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box sx={{ display: 'grid', gap: 1.25 }}>
          <DetailField label="Situação">
            {EVALUATION_STATUS_LABELS[device.evaluationStatus]}
          </DetailField>
          <DetailField label="Cliente">{device.negotiation.client.name}</DetailField>
          <DetailField label="Vendedor">{device.negotiation.vendedor?.name ?? '—'}</DetailField>
          <DetailField label="Cadastrado em">{formatDate(device.createdAt)}</DetailField>
          <DetailField label="Recebimento">{receivedLabel(device.negotiation.status)}</DetailField>
          {device.evaluatedAt && (
            <DetailField label="Última avaliação">
              {formatDate(device.evaluatedAt)}
              {device.evaluator ? ` por ${device.evaluator.name}` : ''}
            </DetailField>
          )}
        </Box>

        <SerialHistory detail={detail} error={historyError} />

        {readOnly ? (
          <Alert severity="info">
            Negociação fechada: a avaliação fica em somente consulta. Para alterar, a negociação
            precisa ser reaberta.
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <Typography sx={sectionTitleSx}>Avaliação</Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                select
                label="Condição"
                value={condition}
                onChange={(e) => setCondition(e.target.value as DeviceCondition)}
                error={submitted && !!conditionProblem}
                helperText={(submitted && conditionProblem) || ' '}
                sx={{ flex: 1 }}
              >
                {DEVICE_CONDITION_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Valor estimado"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                error={submitted && !!valueProblem}
                helperText={(submitted && valueProblem) || 'É o valor de troca.'}
                slotProps={{
                  input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> },
                  htmlInput: { min: 0, step: 0.01 },
                }}
                sx={{ flex: 1 }}
              />
            </Box>
            <TextField
              label="Laudo"
              value={report}
              onChange={(e) => setReport(e.target.value)}
              multiline
              minRows={3}
              helperText="Opcional ao avaliar. Obrigatório ao recusar: é o motivo que o Vendedor passa ao Cliente."
              slotProps={{ htmlInput: { maxLength: 2000 } }}
              fullWidth
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={icloudUnlocked}
                  onChange={(e) => setIcloudUnlocked(e.target.checked)}
                />
              }
              label="iCloud liberado"
            />
            {!icloudUnlocked && (
              <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
                Com o iCloud bloqueado, o aparelho não pode ser avaliado: recuse com o motivo no
                laudo.
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </FormDialog>
  )
}

function SerialHistory({
  detail,
  error,
}: {
  detail: UsedDeviceDetail | null
  error: string | null
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography sx={sectionTitleSx}>Histórico da série</Typography>
      {error ? (
        <Alert severity="error">{error}</Alert>
      ) : !detail ? (
        <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>Carregando histórico…</Typography>
      ) : detail.serialHistory.length === 0 ? (
        <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>
          É a primeira vez que esta série aparece na loja.
        </Typography>
      ) : (
        <Table size="small" aria-label="Histórico da série">
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Resultado</TableCell>
              <TableCell>Condição</TableCell>
              <TableCell align="right">Valor</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {detail.serialHistory.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{formatDate(entry.evaluatedAt ?? entry.createdAt)}</TableCell>
                <TableCell>
                  <EvaluationStatusChip status={entry.evaluationStatus} />
                </TableCell>
                <TableCell>
                  {entry.condition ? DEVICE_CONDITION_LABELS[entry.condition] : '—'}
                </TableCell>
                <TableCell align="right">
                  {entry.estimatedValue === null ? '—' : formatCurrency(entry.estimatedValue)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  )
}
