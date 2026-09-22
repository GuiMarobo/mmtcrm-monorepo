import Alert from '@mui/material/Alert'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { ApiError } from '../../api'
import { formatCurrency } from '../../utils/format'
import { FormDialog } from '../common/FormDialog'
import { NegotiationItemsEditor } from './NegotiationItemsEditor'
import { NegotiationQuotationsTab } from './NegotiationQuotationsTab'
import {
  SELLER_DISCOUNT_LIMIT_PERCENT,
  findItemOverSellerLimit,
  sumItemsAtPracticedPrice,
} from './negotiationItemsSummary'
import type { NegotiationItemFormValue } from './NegotiationItemsEditor'
import type {
  Client,
  CreateNegotiationPayload,
  InstallmentRate,
  IssueQuotationPayload,
  NegotiationDetail,
  Product,
  Quotation,
  ReplaceNegotiationPayload,
} from '../../types'

type NegotiationModalTab = 'itens' | 'orcamentos'

const DEFAULT_VALIDITY_DAYS = 7

interface NegotiationFormModalProps {
  negotiation: NegotiationDetail | null
  isAdmin: boolean
  clients: Client[]
  products: Product[]
  installmentRates?: InstallmentRate[] | null
  installmentRatesError?: string | null
  defaultValidityDays?: number
  quotations?: Quotation[] | null
  quotationsError?: string | null
  onIssueQuotation?: (payload: IssueQuotationPayload) => Promise<unknown>
  onClose: () => void
  onCreate: (payload: CreateNegotiationPayload) => Promise<void>
  onUpdate: (payload: ReplaceNegotiationPayload) => Promise<void>
}

export function NegotiationFormModal({
  negotiation,
  isAdmin,
  clients,
  products,
  installmentRates = null,
  installmentRatesError = null,
  defaultValidityDays = DEFAULT_VALIDITY_DAYS,
  quotations = null,
  quotationsError = null,
  onIssueQuotation,
  onClose,
  onCreate,
  onUpdate,
}: NegotiationFormModalProps) {
  const isEdit = !!negotiation
  const [tab, setTab] = useState<NegotiationModalTab>('itens')
  const quotationsBlockedReason = !negotiation
    ? null
    : negotiation.status !== 'ABERTA'
      ? 'Orçamentos só para negociação em aberto.'
      : negotiation.items.length === 0
        ? 'Salve ao menos um item na negociação para simular o parcelamento.'
        : null
  const [clientId, setClientId] = useState(negotiation?.clientId ?? '')
  const savedItems: NegotiationItemFormValue[] = negotiation
    ? negotiation.items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountType: item.discountType,
        discountValue: item.discountValue,
        product: item.product,
      }))
    : []
  const [items, setItems] = useState<NegotiationItemFormValue[]>(savedItems)
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

    const overLimit = isAdmin ? undefined : findItemOverSellerLimit(items, savedItems, products)
    if (overLimit) {
      const name =
        products.find((p) => p.id === overLimit.productId)?.name ??
        overLimit.product?.name ??
        'item'
      setError(
        `Desconto acima de ${SELLER_DISCOUNT_LIMIT_PERCENT}% exige administrador: reduza o desconto de ${name} para ${SELLER_DISCOUNT_LIMIT_PERCENT}% ou menos.`,
      )
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
          {tab === 'itens' && (
            <Button variant="contained" onClick={() => void submit()} disabled={saving}>
              {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Abrir negociação'}
            </Button>
          )}
        </>
      }
    >
      {negotiation && (
        <Box sx={{ mb: 2 }}>
          <Tabs
            value={tab}
            onChange={(_, value: NegotiationModalTab) => setTab(value)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab value="itens" label="Itens" />
            <Tab value="orcamentos" label="Orçamentos" disabled={!!quotationsBlockedReason} />
          </Tabs>
          {quotationsBlockedReason && (
            <Typography sx={{ fontSize: 12, color: 'text.disabled', mt: 0.75 }}>
              {quotationsBlockedReason}
            </Typography>
          )}
        </Box>
      )}

      {negotiation && !quotationsBlockedReason && (
        <Box hidden={tab !== 'orcamentos'}>
          <NegotiationQuotationsTab
            items={negotiation.items}
            installmentRates={installmentRates}
            installmentRatesError={installmentRatesError}
            defaultValidityDays={defaultValidityDays}
            quotations={quotations}
            quotationsError={quotationsError}
            onIssueQuotation={onIssueQuotation}
          />
        </Box>
      )}

      <Box hidden={tab !== 'itens'}>
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
              savedItems={savedItems}
              limitDiscount={!isAdmin}
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
      </Box>
    </FormDialog>
  )
}
