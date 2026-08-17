import { useState } from 'react'
import { ApiError } from '../../api'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Button, Modal } from '../ui'
import { formatCurrency } from '../../utils/format'
import type {
  Client,
  CreateNegotiationPayload,
  Negotiation,
} from '../../types'

interface NegotiationFormModalProps {
  negotiation: Negotiation | null
  clients: Client[]
  onClose: () => void
  onSave: (payload: CreateNegotiationPayload) => Promise<void>
}

export function NegotiationFormModal({
  negotiation,
  clients,
  onClose,
  onSave,
}: NegotiationFormModalProps) {
  const isEdit = !!negotiation
  const [clientId, setClientId] = useState(negotiation?.clientId ?? '')
  const [totalValue, setTotalValue] = useState(
    negotiation ? String(negotiation.totalValue) : '',
  )
  const [notes, setNotes] = useState(negotiation?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const parsed = Number(totalValue.replace(',', '.'))
  const valueInvalid = totalValue.trim() !== '' && (Number.isNaN(parsed) || parsed < 0)

  const submit = async () => {
    setError(null)
    if (!clientId) {
      setError('Selecione o cliente da negociação.')
      return
    }
    if (totalValue.trim() === '' || Number.isNaN(parsed) || parsed < 0) {
      setError('Informe um valor total válido, igual ou maior que zero.')
      return
    }

    setSaving(true)
    try {
      await onSave({
        clientId,
        totalValue: Math.round(parsed * 100) / 100,
        notes: notes.trim() || null,
      })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível salvar a negociação.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Editar negociação' : 'Nova negociação'}
      subtitle={
        isEdit
          ? 'Altere os dados da tratativa em aberto.'
          : 'A negociação nasce em aberto, com você como vendedor responsável.'
      }
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={() => void submit()} disabled={saving}>
            {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Abrir negociação'}
          </Button>
        </>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          select
          label="Cliente"
          required
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          fullWidth
        >
          <MenuItem value="">Selecione um cliente…</MenuItem>
          {clients.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>

        <Box>
          <TextField
            label="Valor total"
            type="number"
            required
            value={totalValue}
            onChange={(e) => setTotalValue(e.target.value)}
            placeholder="0,00"
            autoFocus={!isEdit}
            error={valueInvalid}
            helperText={valueInvalid ? 'Valor inválido' : undefined}
            slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
            fullWidth
          />
          {!valueInvalid && totalValue.trim() !== '' && (
            <Typography sx={{ mt: 0.5, color: 'text.disabled', fontSize: 12.5 }}>
              {formatCurrency(parsed)}
            </Typography>
          )}
        </Box>

        <TextField
          label="Observações"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Contexto da tratativa, condições combinadas…"
          multiline
          minRows={3}
          slotProps={{ htmlInput: { maxLength: 1000 } }}
          fullWidth
        />
      </Box>
    </Modal>
  )
}
