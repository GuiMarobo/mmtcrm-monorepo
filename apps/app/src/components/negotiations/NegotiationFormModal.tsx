import Alert from '@mui/material/Alert'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { ApiError } from '../../api'
import { FormDialog } from '../common/FormDialog'
import { NegotiationItemsEditor } from './NegotiationItemsEditor'
import type { NegotiationItemFormValue } from './NegotiationItemsEditor'
import type {
  Client,
  CreateNegotiationPayload,
  NegotiationDetail,
  Product,
  ReplaceNegotiationPayload,
} from '../../types'

interface NegotiationFormModalProps {
  negotiation: NegotiationDetail | null
  clients: Client[]
  products: Product[]
  onClose: () => void
  onCreate: (payload: CreateNegotiationPayload) => Promise<void>
  onUpdate: (payload: ReplaceNegotiationPayload) => Promise<void>
}

export function NegotiationFormModal({
  negotiation,
  clients,
  products,
  onClose,
  onCreate,
  onUpdate,
}: NegotiationFormModalProps) {
  const isEdit = !!negotiation
  const [clientId, setClientId] = useState(negotiation?.clientId ?? '')
  const [items, setItems] = useState<NegotiationItemFormValue[]>(
    negotiation
      ? negotiation.items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }))
      : [],
  )
  const [notes, setNotes] = useState(negotiation?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setError(null)
    if (!clientId) {
      setError('Selecione o cliente da negociação.')
      return
    }

    const payloadItems = items.map(({ productId, quantity }) => ({
      productId,
      quantity,
    }))

    setSaving(true)
    try {
      if (isEdit) {
        await onUpdate({
          clientId,
          items: payloadItems,
          notes: notes.trim() || null,
        })
      } else {
        await onCreate({
          clientId,
          items: payloadItems,
          notes: notes.trim() || null,
        })
      }
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
      width={isEdit ? 600 : 680}
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

        <Box>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600, mb: 0.75 }}>
            Itens da negociação
          </Typography>
          <NegotiationItemsEditor
            products={products}
            items={items}
            onChange={setItems}
          />
        </Box>

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
