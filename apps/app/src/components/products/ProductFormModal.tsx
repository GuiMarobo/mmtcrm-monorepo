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
import { priceError } from '../../utils/validators'
import type {
  CreateProductPayload,
  Product,
  ProductCategory,
  UpdateProductPayload,
} from '../../types'
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

function toForm(product: Product): ProductForm {
  return {
    ...EMPTY_FORM,
    name: product.name,
    sku: product.sku,
    description: product.description ?? '',
    category: product.category,
  }
}

type FieldKey = 'name' | 'sku' | 'price' | 'initialStock'

const CREATE_FIELDS: FieldKey[] = ['name', 'sku', 'price', 'initialStock']

const EDIT_FIELDS: FieldKey[] = ['name', 'sku']

function computeError(key: FieldKey, form: ProductForm): string | undefined {
  switch (key) {
    case 'name':
      return form.name.trim() ? undefined : 'Informe o nome do produto.'
    case 'sku':
      return form.sku.trim()
        ? undefined
        : 'Informe o código de referência do produto.'
    case 'price':
      return priceError(form.price)
    case 'initialStock': {
      if (!form.initialStock.trim()) return 'Informe a quantidade inicial.'
      const stock = Number(form.initialStock)
      if (!Number.isInteger(stock)) return 'A quantidade deve ser um número inteiro.'
      return stock < 0 ? 'A quantidade não pode ser negativa.' : undefined
    }
  }
}

function toUpdatePayload(form: ProductForm): UpdateProductPayload {
  return {
    name: form.name.trim(),
    sku: form.sku.trim(),
    description: form.description.trim() ? form.description.trim() : null,
    category: form.category,
  }
}

function toCreatePayload(form: ProductForm): CreateProductPayload {
  return {
    ...toUpdatePayload(form),
    price: Number(form.price),
    initialStock: Number(form.initialStock),
  }
}

type ProductFormModalProps = { onClose: () => void } & (
  | { product?: undefined; onSave: (payload: CreateProductPayload) => Promise<void> }
  | { product: Product; onSave: (payload: UpdateProductPayload) => Promise<void> }
)

export function ProductFormModal(props: ProductFormModalProps) {
  const { onClose } = props
  const editing = !!props.product
  const fields = editing ? EDIT_FIELDS : CREATE_FIELDS
  const [form, setForm] = useState<ProductForm>(() =>
    props.product ? toForm(props.product) : EMPTY_FORM,
  )
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
    setTouched(Object.fromEntries(fields.map((key) => [key, true])))
    if (fields.some((key) => computeError(key, form))) return
    setError(null)
    setSaving(true)
    try {
      if (props.product) await props.onSave(toUpdatePayload(form))
      else await props.onSave(toCreatePayload(form))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar produto.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormDialog
      title={editing ? 'Editar Produto' : 'Novo Produto'}
      subtitle={
        editing
          ? 'Preço e estoque têm ações próprias no detalhe do produto.'
          : 'O produto nasce ativo no catálogo. A quantidade inicial abre o histórico de estoque.'
      }
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
            {saving ? 'Salvando…' : editing ? 'Salvar alterações' : 'Cadastrar produto'}
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

        {!editing && (
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
        )}

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
