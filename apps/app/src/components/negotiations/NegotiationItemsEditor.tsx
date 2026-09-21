import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { calculateItemSubtotal, sumNegotiationItems } from './negotiationItemsSummary'
import { formatCurrency } from '../../utils/format'
import type { CreateNegotiationItemPayload, Product } from '../../types'

interface NegotiationItemsEditorProps {
  products: Product[]
  items: CreateNegotiationItemPayload[]
  onChange: (items: CreateNegotiationItemPayload[]) => void
}

export function NegotiationItemsEditor({
  products,
  items,
  onChange,
}: NegotiationItemsEditorProps) {
  const productById = new Map(products.map((p) => [p.id, p]))
  const availableProducts = products.filter(
    (p) => !items.some((item) => item.productId === p.id),
  )

  const rows = items
    .map((item) => ({ item, product: productById.get(item.productId) }))
    .filter(
      (row): row is { item: CreateNegotiationItemPayload; product: Product } =>
        !!row.product,
    )

  const total = sumNegotiationItems(
    rows.map(({ item, product }) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: product.price,
    })),
  )

  const addItem = (product: Product) => {
    onChange([...items, { productId: product.id, quantity: 1 }])
  }

  const removeItem = (productId: string) => {
    onChange(items.filter((item) => item.productId !== productId))
  }

  const setQuantity = (productId: string, quantity: number) => {
    onChange(
      items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
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
          {rows.map(({ item, product }, index) => {
            const subtotal = calculateItemSubtotal({
              quantity: item.quantity,
              unitPrice: product.price,
            })
            const overStock = item.quantity > product.stock

            return (
              <Box key={item.productId}>
                {index > 0 && <Divider />}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    px: 1.5,
                    py: 1,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {product.name}
                    </Typography>
                    <Typography sx={{ fontSize: 11.5, color: 'text.disabled' }}>
                      {product.sku} · {formatCurrency(product.price)}
                    </Typography>
                    {overStock && (
                      <Typography sx={{ fontSize: 11, color: 'warning.main', mt: 0.25 }}>
                        Saldo em estoque: {product.stock} — abaixo da quantidade
                      </Typography>
                    )}
                  </Box>

                  <TextField
                    label="Qtd."
                    type="number"
                    size="small"
                    value={item.quantity}
                    onChange={(e) => {
                      const quantity = Number(e.target.value)
                      if (Number.isInteger(quantity) && quantity >= 1) {
                        setQuantity(item.productId, quantity)
                      }
                    }}
                    slotProps={{ htmlInput: { min: 1, step: 1 } }}
                    sx={{ width: 84 }}
                  />

                  <Typography
                    sx={{ fontSize: 13.5, fontWeight: 600, width: 96, textAlign: 'right' }}
                  >
                    {formatCurrency(subtotal)}
                  </Typography>

                  <IconButton
                    onClick={() => removeItem(item.productId)}
                    aria-label={`Remover ${product.name}`}
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
