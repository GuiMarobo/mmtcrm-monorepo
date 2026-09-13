import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { ApiError } from '../../api'
import { FormDialog } from '../common/FormDialog'
import type {
  CreateStockMovementPayload,
  Product,
  StockMovementType,
} from '../../types'
import { STOCK_MOVEMENT_TYPE_OPTIONS } from '../../types'

const INVALID_QUANTITY = 'A quantidade deve ser um número inteiro maior que zero.'

function quantityError(value: string): string | undefined {
  const quantity = Number(value)
  if (!value.trim() || !Number.isInteger(quantity) || quantity <= 0) {
    return INVALID_QUANTITY
  }
  return undefined
}

interface StockMovementModalProps {
  product: Product
  onClose: () => void
  onSave: (payload: CreateStockMovementPayload) => Promise<void>
  onError: (message: string) => void
}

export function StockMovementModal({
  product,
  onClose,
  onSave,
  onError,
}: StockMovementModalProps) {
  const [type, setType] = useState<StockMovementType>('ENTRADA')
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)

  const error = touched ? quantityError(quantity) : undefined

  const submit = async () => {
    setTouched(true)
    if (quantityError(quantity)) return
    const payload: CreateStockMovementPayload = {
      type,
      quantity: Number(quantity),
      ...(note.trim() && { note: note.trim() }),
    }
    setSaving(true)
    try {
      await onSave(payload)
    } catch (err) {
      onError(
        err instanceof ApiError ? err.message : 'Erro ao registrar a movimentação.',
      )
      setSaving(false)
    }
  }

  return (
    <FormDialog
      title="Movimentar Estoque"
      subtitle={product.name}
      onClose={onClose}
      width={480}
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
            Registrar movimento
          </Button>
        </>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        <ToggleButtonGroup
          exclusive
          fullWidth
          value={type}
          onChange={(_, value: StockMovementType | null) => value && setType(value)}
          aria-label="Tipo de movimento"
          sx={{ mb: 1.5 }}
        >
          {STOCK_MOVEMENT_TYPE_OPTIONS.map((o) => (
            <ToggleButton key={o.value} value={o.value}>
              {o.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 1 }}>
          Saldo atual: {product.stock}
        </Typography>

        <TextField
          label="Quantidade"
          required
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          onBlur={() => setTouched(true)}
          error={!!error}
          helperText={error ?? ' '}
          slotProps={{ htmlInput: { inputMode: 'numeric', min: 1, step: 1 } }}
          fullWidth
        />

        <TextField
          label="Observação"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Motivo da movimentação (opcional)"
          multiline
          minRows={2}
          helperText=" "
          slotProps={{ htmlInput: { maxLength: 500 } }}
          fullWidth
        />
      </Box>
    </FormDialog>
  )
}
