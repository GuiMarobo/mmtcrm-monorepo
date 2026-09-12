import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { useState } from 'react'
import { ApiError } from '../../api'
import { FormDialog } from '../common/FormDialog'
import { FormRow } from '../common/FormRow'
import type { CreateProductPayload, ProductCategory } from '../../types'
import { PRODUCT_CATEGORY_OPTIONS } from '../../types'

interface ProductForm {
  name: string
  sku: string
  description: string
  category: ProductCategory
  price: string
  initialStock: string
}

const EMPTY_FORM: ProductForm = {
  name: '',
  sku: '',
  description: '',
  category: 'IPHONE',
  price: '',
  initialStock: '0',
}

type FieldKey = 'name' | 'sku' | 'price' | 'initialStock'

const ALL_FIELDS: FieldKey[] = ['name', 'sku', 'price', 'initialStock']

function computeError(key: FieldKey, form: ProductForm): string | undefined {
  switch (key) {
    case 'name':
      return form.name.trim() ? undefined : 'Informe o nome do produto.'
    case 'sku':
      return form.sku.trim()
        ? undefined
        : 'Informe o código de referência do produto.'
    case 'price': {
      if (!form.price.trim()) return 'Informe o preço de venda.'
      const price = Number(form.price)
      if (Number.isNaN(price)) return 'Preço inválido.'
      return price < 0 ? 'O preço não pode ser negativo.' : undefined
    }
    case 'initialStock': {
      if (!form.initialStock.trim()) return 'Informe a quantidade inicial.'
      const stock = Number(form.initialStock)
      if (!Number.isInteger(stock)) return 'A quantidade deve ser um número inteiro.'
      return stock < 0 ? 'A quantidade não pode ser negativa.' : undefined
    }
  }
}

function toPayload(form: ProductForm): CreateProductPayload {
  return {
    name: form.name.trim(),
    sku: form.sku.trim(),
    description: form.description.trim() ? form.description.trim() : null,
    category: form.category,
    price: Number(form.price),
    initialStock: Number(form.initialStock),
  }
}

interface ProductFormModalProps {
  onClose: () => void
  onSave: (payload: CreateProductPayload) => Promise<void>
}

export function ProductFormModal({ onClose, onSave }: ProductFormModalProps) {
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({})

  const set = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const displayError = (key: FieldKey): string | undefined =>
    touched[key] ? computeError(key, form) : undefined

  const handleBlur = (key: FieldKey) => {
    setTouched((prev) => ({ ...prev, [key]: true }))
  }

  const submit = async () => {
    setTouched({ name: true, sku: true, price: true, initialStock: true })
    if (!ALL_FIELDS.every((key) => !computeError(key, form))) return
    setError(null)
    setSaving(true)
    try {
      await onSave(toPayload(form))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar produto.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormDialog
      title="Novo Produto"
      subtitle="O produto nasce ativo no catálogo. A quantidade inicial abre o histórico de estoque."
      onClose={onClose}
      width={680}
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
            {saving ? 'Salvando…' : 'Cadastrar produto'}
          </Button>
        </>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        <TextField
          label="Nome"
          required
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          placeholder="Ex.: iPhone 15 Pro 256GB"
          error={!!displayError('name')}
          helperText={displayError('name') ?? ' '}
          fullWidth
        />

        <FormRow>
          <TextField
            label="Código de Referência"
            required
            value={form.sku}
            onChange={(e) => set('sku', e.target.value)}
            onBlur={() => handleBlur('sku')}
            placeholder="Ex.: IP15P-256"
            error={!!displayError('sku')}
            helperText={displayError('sku') ?? 'Gravado em maiúsculas, sem espaços nas pontas.'}
            fullWidth
          />
          <TextField
            select
            label="Categoria"
            required
            value={form.category}
            onChange={(e) => set('category', e.target.value as ProductCategory)}
            helperText=" "
            fullWidth
          >
            {PRODUCT_CATEGORY_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </FormRow>

        <FormRow>
          <TextField
            label="Preço de Venda"
            required
            type="number"
            value={form.price}
            onChange={(e) => set('price', e.target.value)}
            onBlur={() => handleBlur('price')}
            placeholder="0,00"
            error={!!displayError('price')}
            helperText={displayError('price') ?? ' '}
            slotProps={{ htmlInput: { inputMode: 'decimal', min: 0, step: '0.01' } }}
            fullWidth
          />
          <TextField
            label="Quantidade Inicial em Estoque"
            required
            type="number"
            value={form.initialStock}
            onChange={(e) => set('initialStock', e.target.value)}
            onBlur={() => handleBlur('initialStock')}
            error={!!displayError('initialStock')}
            helperText={displayError('initialStock') ?? ' '}
            slotProps={{ htmlInput: { inputMode: 'numeric', min: 0, step: 1 } }}
            fullWidth
          />
        </FormRow>

        <TextField
          label="Descrição"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Detalhes do produto (opcional)"
          multiline
          minRows={2}
          helperText=" "
          fullWidth
        />

        {error && <Alert severity="error">{error}</Alert>}
      </Box>
    </FormDialog>
  )
}
