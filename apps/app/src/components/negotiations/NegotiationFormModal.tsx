import Alert from '@mui/material/Alert'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { ApiError } from '../../api'
import { formatCurrency } from '../../utils/format'
import { FormDialog } from '../common/FormDialog'
import { NegotiationItemsEditor } from './NegotiationItemsEditor'
import { sumItemsAtPracticedPrice } from './negotiationItemsSummary'
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
          discountType: item.discountType,
          discountValue: item.discountValue,
          product: item.product,
        }))
      : [],
  )
  const [notes, setNotes] = useState(negotiation?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const informedValue = negotiation?.informedValue ?? null

  const submit = async () => {
    setError(null)
    if (!clientId) {
      setError('Selecione o cliente da negociação.')
      return
    }

    const payloadItems = items.map(
      ({ productId, quantity, discountType, discountValue }) => ({
        productId,
        quantity,
        discountType: discountType ?? 'VALOR',
        discountValue: discountValue ?? 0,
      }),
    )

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

        {informedValue !== null && (
          <>
            <TextField
              label="Valor informado"
              value={formatCurrency(informedValue)}
              slotProps={{ htmlInput: { readOnly: true } }}
              helperText="Registrado antes dos itens; não pode ser editado."
              fullWidth
            />
            {items.length === 0 ? (
              <Alert severity="info">
                Esta negociação não tem itens. Adicionar o primeiro item substitui
                esse valor pela soma dos itens — depois disso, o valor informado não
                volta.
              </Alert>
            ) : (
              <Alert severity="warning">
                Ao salvar, o valor informado de {formatCurrency(informedValue)} será
                substituído por {formatCurrency(sumItemsAtPracticedPrice(items, products))} (soma dos itens), e o
                valor informado não volta.
              </Alert>
            )}
          </>
        )}

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
