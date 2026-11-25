import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { ApiError } from '../../api'
import { CurrencyField } from '../common/CurrencyField'
import { FormDialog } from '../common/FormDialog'
import { formatCurrency } from '../../utils/format'
import { priceError } from '../../utils/validators'
import type { Product, UpdateProductPricePayload } from '../../types'

interface ProductPriceModalProps {
  product: Product
  onClose: () => void
  onSave: (payload: UpdateProductPricePayload) => Promise<void>
  onError: (message: string) => void
}

export function ProductPriceModal({
  product,
  onClose,
  onSave,
  onError,
}: ProductPriceModalProps) {
  const [price, setPrice] = useState<number | null>(product.price)
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)

  const error = touched ? priceError(price) : undefined

  const submit = async () => {
    setTouched(true)
    if (priceError(price)) return
    setSaving(true)
    try {
      await onSave({ price: price ?? 0 })
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Erro ao atualizar o preço.')
      setSaving(false)
    }
  }

  return (
    <FormDialog
      title="Atualizar Preço"
      subtitle={product.name}
      onClose={onClose}
      width={420}
      closeOnBackdrop={false}
      footer={
        <>
          <Button variant="outlined" color="inherit" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={<CheckOutlinedIcon />}
            onClick={() => void submit()}
            disabled={saving}
          >
            Atualizar preço
          </Button>
        </>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 1 }}>
          Preço atual: {formatCurrency(product.price)}
        </Typography>

        <CurrencyField
          label="Novo preço de venda"
          required
          value={price}
          onChange={setPrice}
          onBlur={() => setTouched(true)}
          error={!!error}
          helperText={
            error ?? 'Negociações e pedidos já registrados mantêm o preço praticado.'
          }
          fullWidth
        />
      </Box>
    </FormDialog>
  )
}
