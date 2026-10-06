import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { ApiError } from '../../api'
import { EVALUATION_STATUS_LABELS } from '../../types'
import { imeiError } from '../../utils/validators'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { FormDialog } from '../common/FormDialog'
import { ToneChip } from '../common/ToneChip'
import type { BadgeTone } from '../../theme/tones'
import type {
  CreatedUsedDevice,
  CreateUsedDevicePayload,
  EvaluationStatus,
  UpdateUsedDevicePayload,
  UsedDevice,
} from '../../types'

const EVALUATION_STATUS_TONES: Record<EvaluationStatus, BadgeTone> = {
  AGUARDANDO: 'amber',
  AVALIADO: 'green',
  RECUSADO: 'red',
}

export interface NegotiationTradeIn {
  devices: UsedDevice[] | null
  error: string | null
  onCreate: (payload: CreateUsedDevicePayload) => Promise<CreatedUsedDevice>
  onUpdate: (id: number, payload: UpdateUsedDevicePayload) => Promise<unknown>
  onRemove: (id: number) => Promise<unknown>
}

interface NegotiationTradeInTabProps extends NegotiationTradeIn {
  readOnly: boolean
}

type FormTarget = { mode: 'create' } | { mode: 'edit'; device: UsedDevice }

export function NegotiationTradeInTab({
  devices,
  error,
  readOnly,
  onCreate,
  onUpdate,
  onRemove,
}: NegotiationTradeInTabProps) {
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null)
  const [removing, setRemoving] = useState<UsedDevice | null>(null)
  const [removeLoading, setRemoveLoading] = useState(false)

  const confirmRemove = async () => {
    if (!removing) return
    setRemoveLoading(true)
    const removed = await onRemove(removing.id).then(
      () => true,
      () => false,
    )
    setRemoveLoading(false)
    if (removed) setRemoving(null)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>Aparelhos na troca</Typography>
        {!readOnly && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddOutlinedIcon />}
            onClick={() => setFormTarget({ mode: 'create' })}
          >
            Cadastrar aparelho
          </Button>
        )}
      </Box>

      {readOnly && (
        <Alert severity="info">
          Negociação fechada: a troca fica em somente consulta. Reabra a negociação para alterar.
        </Alert>
      )}

      {error ? (
        <Alert severity="error">{error}</Alert>
      ) : !devices ? (
        <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>Carregando aparelhos…</Typography>
      ) : devices.length === 0 ? (
        <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>
          Nenhum aparelho na troca desta negociação.
        </Typography>
      ) : (
        <Table size="small" aria-label="Aparelhos na troca">
          <TableHead>
            <TableRow>
              <TableCell>Modelo</TableCell>
              <TableCell>Série</TableCell>
              <TableCell>IMEI</TableCell>
              <TableCell>Situação</TableCell>
              {!readOnly && <TableCell />}
            </TableRow>
          </TableHead>
          <TableBody>
            {devices.map((device) => (
              <TableRow key={device.id}>
                <TableCell sx={{ fontWeight: 600 }}>{device.model}</TableCell>
                <TableCell>{device.serialNumber}</TableCell>
                <TableCell>{device.imei ?? '—'}</TableCell>
                <TableCell>
                  <ToneChip tone={EVALUATION_STATUS_TONES[device.evaluationStatus]}>
                    {EVALUATION_STATUS_LABELS[device.evaluationStatus]}
                  </ToneChip>
                </TableCell>
                {!readOnly && (
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {device.evaluationStatus === 'AGUARDANDO' && (
                      <IconButton
                        size="small"
                        aria-label={`Editar ${device.model}`}
                        onClick={() => setFormTarget({ mode: 'edit', device })}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      aria-label={`Remover ${device.model}`}
                      onClick={() => setRemoving(device)}
                    >
                      <DeleteOutlineOutlinedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {formTarget && (
        <UsedDeviceFormDialog
          device={formTarget.mode === 'edit' ? formTarget.device : null}
          onClose={() => setFormTarget(null)}
          onCreate={onCreate}
          onUpdate={onUpdate}
        />
      )}

      {removing && (
        <ConfirmDialog
          title="Remover aparelho da troca"
          description={`${removing.model} (série ${removing.serialNumber}) sai da negociação.`}
          confirmLabel="Remover"
          danger
          loading={removeLoading}
          onConfirm={() => void confirmRemove()}
          onCancel={() => setRemoving(null)}
        />
      )}
    </Box>
  )
}

const timesLabel = (count: number) => (count === 1 ? '1 vez' : `${count} vezes`)

function UsedDeviceFormDialog({
  device,
  onClose,
  onCreate,
  onUpdate,
}: Pick<NegotiationTradeIn, 'onCreate' | 'onUpdate'> & {
  device: UsedDevice | null
  onClose: () => void
}) {
  const [model, setModel] = useState(device?.model ?? '')
  const [serialNumber, setSerialNumber] = useState(device?.serialNumber ?? '')
  const [imei, setImei] = useState(device?.imei ?? '')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [seenBefore, setSeenBefore] = useState<number | null>(null)

  const modelProblem = model.trim() ? undefined : 'Informe o modelo.'
  const serialProblem = serialNumber.trim() ? undefined : 'Informe o número de série.'
  const imeiProblem = imeiError(imei)

  const submit = async () => {
    setSubmitted(true)
    setError(null)
    if (modelProblem || serialProblem || imeiProblem) return

    const payload: CreateUsedDevicePayload = {
      model: model.trim(),
      serialNumber: serialNumber.trim(),
      imei: imei.trim() || null,
    }
    setSaving(true)
    try {
      if (device) {
        await onUpdate(device.id, payload)
        onClose()
      } else {
        const created = await onCreate(payload)
        if (created.serialSeenBefore > 0) setSeenBefore(created.serialSeenBefore)
        else onClose()
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar o aparelho.')
    } finally {
      setSaving(false)
    }
  }

  if (seenBefore !== null) {
    return (
      <FormDialog
        title="Aparelho cadastrado"
        width={460}
        onClose={onClose}
        footer={
          <Button variant="contained" onClick={onClose}>
            Concluir
          </Button>
        }
      >
        <Alert severity="warning">
          Esta série já apareceu {timesLabel(seenBefore)} na loja. O aparelho foi cadastrado e
          aguarda avaliação: avise o Técnico para conferir o histórico.
        </Alert>
      </FormDialog>
    )
  }

  return (
    <FormDialog
      title={device ? 'Corrigir aparelho' : 'Cadastrar aparelho na troca'}
      subtitle={
        device
          ? 'Só enquanto o aparelho aguarda avaliação.'
          : 'O aparelho nasce aguardando a avaliação do Técnico.'
      }
      width={460}
      onClose={onClose}
      footer={
        <>
          <Button variant="outlined" color="inherit" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => void submit()} disabled={saving}>
            {saving ? 'Salvando…' : device ? 'Salvar' : 'Cadastrar'}
          </Button>
        </>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Modelo"
          required
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="iPhone 8 64 GB"
          error={submitted && !!modelProblem}
          helperText={(submitted && modelProblem) || ' '}
          slotProps={{ htmlInput: { maxLength: 200 } }}
          fullWidth
        />
        <TextField
          label="Número de série"
          required
          value={serialNumber}
          onChange={(e) => setSerialNumber(e.target.value)}
          error={submitted && !!serialProblem}
          helperText={(submitted && serialProblem) || ' '}
          slotProps={{ htmlInput: { maxLength: 60 } }}
          fullWidth
        />
        <TextField
          label="IMEI"
          value={imei}
          onChange={(e) => setImei(e.target.value)}
          error={submitted && !!imeiProblem}
          helperText={(submitted && imeiProblem) || 'Opcional: iPad Wi-Fi, Mac e Apple Watch não têm.'}
          slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 20 } }}
          fullWidth
        />
      </Box>
    </FormDialog>
  )
}
