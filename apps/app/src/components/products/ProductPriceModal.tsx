import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { ApiError } from '../../api'
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
  const [price, setPrice] = useState(String(product.price))
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)

  const error = touched ? priceError(price) : undefined

  const submit = async () => {
    setTouched(true)
    if (priceError(price)) return
    setSaving(true)
    try {
      await onSave({ price: Number(price) })
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

        <TextField
          label="Novo preço de venda"
          required
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          onBlur={() => setTouched(true)}
          error={!!error}
          helperText={
            error ?? 'Negociações e pedidos já registrados mantêm o preço praticado.'
          }
          slotProps={{ htmlInput: { inputMode: 'decimal', min: 0, step: '0.01' } }}
          fullWidth
        />
      </Box>
    </FormDialog>
  )
}
