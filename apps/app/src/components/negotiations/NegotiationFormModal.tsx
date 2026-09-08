import Alert from '@mui/material/Alert'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { useState } from 'react'
import { ApiError } from '../../api'
import { FormDialog } from '../common/FormDialog'
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
    <FormDialog
      title={isEdit ? 'Editar negociação' : 'Nova negociação'}
      subtitle={
        isEdit
          ? 'Altere os dados da tratativa em aberto.'
          : 'A negociação nasce em aberto, com você como vendedor responsável.'
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="outlined" color="inherit" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => void submit()} disabled={saving}>
            {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Abrir negociação'}
          </Button>
        </>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {error && <Alert severity="error">{error}</Alert>}

        <Autocomplete
          options={clients}
          getOptionLabel={(c) => c.name}
          value={clients.find((c) => c.id === clientId) ?? null}
          onChange={(_, option) => setClientId(option?.id ?? '')}
          isOptionEqualToValue={(o, v) => o.id === v.id}
          noOptionsText="Nenhum cliente encontrado"
          fullWidth
          renderInput={(params) => (
            <TextField
              {...params}
              label="Cliente"
              required
              placeholder="Busque pelo nome…"
              helperText=" "
            />
          )}
        />

        <TextField
          label="Valor total"
          type="number"
          required
          value={totalValue}
          onChange={(e) => setTotalValue(e.target.value)}
          placeholder="0,00"
          autoFocus={!isEdit}
          error={valueInvalid}
          helperText={
            valueInvalid
              ? 'Valor inválido'
              : totalValue.trim() !== ''
                ? formatCurrency(parsed)
                : ' '
          }
          slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
          fullWidth
        />

        <TextField
          label="Observações"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Contexto da tratativa, condições combinadas…"
          multiline
          minRows={3}
          slotProps={{ htmlInput: { maxLength: 1000 } }}
          helperText=" "
          fullWidth
        />
      </Box>
    </FormDialog>
  )
}
