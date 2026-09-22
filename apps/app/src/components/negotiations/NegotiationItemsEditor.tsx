import { useState } from 'react'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import {
  calculateItemSubtotal,
  itemDiscountError,
  sumItemsAtPracticedPrice,
} from './negotiationItemsSummary'
import { ToneChip } from '../common/ToneChip'
import { formatCurrency } from '../../utils/format'
import { DISCOUNT_TYPE_OPTIONS } from '../../types'
import type {
  CreateNegotiationItemPayload,
  DiscountType,
  NegotiationItemProduct,
  Product,
} from '../../types'

export interface NegotiationItemFormValue extends CreateNegotiationItemPayload {
  unitPrice?: number
  product?: NegotiationItemProduct
}

interface ItemRow {
  item: NegotiationItemFormValue
  name: string
  sku: string
  unitPrice: number
  stock: number | null
  deleted: boolean
}

interface NegotiationItemsEditorProps {
  products: Product[]
  items: NegotiationItemFormValue[]
  onChange: (items: NegotiationItemFormValue[]) => void
}

export function NegotiationItemsEditor({
  products,
  items,
  onChange,
}: NegotiationItemsEditorProps) {
  const [search, setSearch] = useState('')
  const productById = new Map(products.map((p) => [p.id, p]))
  const availableProducts = products.filter(
    (p) => p.status === 'ATIVO' && !items.some((item) => item.productId === p.id),
  )

  const rows = items.flatMap((item): ItemRow[] => {
    const catalog = productById.get(item.productId)
    const source = catalog ?? item.product
    const unitPrice = item.unitPrice ?? catalog?.price
    if (!source || unitPrice === undefined) return []
    return [
      {
        item,
        name: source.name,
        sku: source.sku,
        unitPrice,
        stock: catalog?.stock ?? null,
        deleted: item.product?.deleted ?? false,
      },
    ]
  })

  const total = sumItemsAtPracticedPrice(items, products)

  const addItem = (product: Product) => {
    onChange([
      ...items,
      { productId: product.id, quantity: 1, discountType: 'VALOR', discountValue: 0 },
    ])
  }

  const removeItem = (productId: string) => {
    onChange(items.filter((item) => item.productId !== productId))
  }

  const updateItem = (
    productId: string,
    changes: Partial<Pick<NegotiationItemFormValue, 'quantity' | 'discountType' | 'discountValue'>>,
  ) => {
    onChange(
      items.map((item) =>
        item.productId === productId ? { ...item, ...changes } : item,
      ),
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Autocomplete
        options={availableProducts}
        getOptionLabel={(p) => `${p.name} — ${p.sku}`}
        value={null}
        onChange={(_, option) => option && addItem(option)}
        inputValue={search}
        onInputChange={(_, value, reason) => setSearch(reason === 'input' ? value : '')}
        isOptionEqualToValue={(o, v) => o.id === v.id}
        noOptionsText="Nenhum produto ativo disponível"
        fullWidth
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.id}>
            <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.25 }}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>
                {option.name}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: 'text.disabled' }}>
                {option.sku} · {formatCurrency(option.price)} · {option.stock}{' '}
                em estoque
              </Typography>
            </Box>
          </Box>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Adicionar produto"
            placeholder="Busque pelo nome ou código…"
            helperText=" "
          />
        )}
      />

      {rows.length > 0 && (
        <Box
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1.5,
            overflow: 'hidden',
          }}
        >
          {rows.map(({ item, name, sku, unitPrice, stock, deleted }, index) => {
            const pricedItem = { ...item, unitPrice }
            const subtotal = calculateItemSubtotal(pricedItem)
            const discountError = itemDiscountError(pricedItem)
            const overStock = stock !== null && item.quantity > stock

            return (
              <Box key={item.productId}>
                {index > 0 && <Divider />}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1.25,
                    px: 1.5,
                    py: 1,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: 13.5,
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: deleted ? 'text.disabled' : undefined,
                        }}
                      >
                        {name}
                      </Typography>
                      {deleted && <ToneChip tone="red">Excluído do catálogo</ToneChip>}
                    </Box>
                    <Typography sx={{ fontSize: 11.5, color: 'text.disabled' }}>
                      {sku} · {formatCurrency(unitPrice)}
                    </Typography>
                    {deleted ? (
                      <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: 0.25 }}>
                        Só pode ser mantido como está ou removido — remova antes de converter em pedido
                      </Typography>
                    ) : (
                      overStock && (
                        <Typography sx={{ fontSize: 11, color: 'warning.main', mt: 0.25 }}>
                          Saldo em estoque: {stock} — abaixo da quantidade
                        </Typography>
                      )
                    )}
                  </Box>

                  <TextField
                    label="Qtd."
                    type="number"
                    size="small"
                    value={item.quantity}
                    disabled={deleted}
                    onChange={(e) => {
                      const quantity = Number(e.target.value)
                      if (Number.isInteger(quantity) && quantity >= 1) {
                        updateItem(item.productId, { quantity })
                      }
                    }}
                    slotProps={{ htmlInput: { min: 1, step: 1 } }}
                    sx={{ width: 84 }}
                  />

                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={item.discountType ?? 'VALOR'}
                    disabled={deleted}
                    onChange={(_, discountType: DiscountType | null) => {
                      if (discountType) updateItem(item.productId, { discountType })
                    }}
                    aria-label={`Forma do desconto de ${name}`}
                  >
                    {DISCOUNT_TYPE_OPTIONS.map((option) => (
                      <ToggleButton
                        key={option.value}
                        value={option.value}
                        sx={{ px: 1, py: 0.5, fontSize: 12.5 }}
                      >
                        {option.label}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>

                  <TextField
                    label="Desconto"
                    type="number"
                    size="small"
                    value={item.discountValue ?? 0}
                    disabled={deleted}
                    error={!!discountError}
                    helperText={discountError ?? undefined}
                    onChange={(e) => {
                      const discountValue = Number(e.target.value)
                      if (
                        Number.isFinite(discountValue) &&
                        Math.round(discountValue * 100) === discountValue * 100
                      ) {
                        updateItem(item.productId, { discountValue })
                      }
                    }}
                    slotProps={{
                      htmlInput: {
                        min: 0,
                        max: item.discountType === 'PERCENTUAL' ? 100 : undefined,
                        step: 0.01,
                      },
                    }}
                    sx={{ width: 104 }}
                  />

                  <Typography
                    sx={{ fontSize: 13.5, fontWeight: 600, width: 96, textAlign: 'right' }}
                  >
                    {formatCurrency(subtotal)}
                  </Typography>

                  <IconButton
                    onClick={() => removeItem(item.productId)}
                    aria-label={`Remover ${name}`}
                    size="small"
                  >
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            )
          })}
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 0.5,
          pt: 0.5,
        }}
      >
        <Typography sx={{ fontSize: 12.5, color: 'text.disabled' }}>
          {rows.length === 0
            ? 'Nenhum item adicionado ainda'
            : `${rows.length} ${rows.length === 1 ? 'item' : 'itens'}`}
        </Typography>
        <Typography sx={{ fontSize: 15, fontWeight: 700 }}>
          {formatCurrency(total)}
        </Typography>
      </Box>
    </Box>
  )
}
