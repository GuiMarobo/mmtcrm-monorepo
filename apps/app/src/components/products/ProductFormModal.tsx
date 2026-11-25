import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import { ApiError } from '../../api'
import { FormDialog } from '../common/FormDialog'
import { CurrencyField } from '../common/CurrencyField'
import { FormRow } from '../common/FormRow'
import { MAX_INTEGER, sanitizeInteger } from '../../utils/format'
import { priceError } from '../../utils/validators'
import type {
  CreateProductPayload,
  Product,
  ProductCategory,
  UpdateProductPayload,
} from '../../types'
import { PRODUCT_CATEGORY_OPTIONS } from '../../types'
import { suggestSku } from './skuSuggestion'

interface ProductForm {
  name: string
  sku: string
  description: string
  category: ProductCategory
  price: number | null
  initialStock: string
}

const EMPTY_FORM: ProductForm = {
  name: '',
  sku: '',
  description: '',
  category: 'IPHONE',
  price: null,
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

function toDuplicateForm(source: Product, takenSkus: string[]): ProductForm {
  return {
    ...toForm(source),
    sku: suggestSku(source.name, takenSkus),
    price: source.price,
  }
}

type FieldKey = 'name' | 'sku' | 'price' | 'initialStock'

const CREATE_FIELDS: FieldKey[] = ['name', 'sku', 'price', 'initialStock']

const EDIT_FIELDS: FieldKey[] = ['name', 'sku']

function computeError(key: FieldKey, form: ProductForm): string | undefined {
  switch (key) {
    case 'name':
      if (!form.name.trim()) return 'Informe o nome do produto.'
      return form.name.trim().length > 200 ? 'Até 200 caracteres.' : undefined
    case 'sku':
      if (!form.sku.trim()) return 'Informe o código de referência do produto.'
      return form.sku.trim().length > 60 ? 'Até 60 caracteres.' : undefined
    case 'price':
      return priceError(form.price)
    case 'initialStock': {
      if (!form.initialStock.trim()) return 'Informe a quantidade inicial.'
      if (!/^\d+$/.test(form.initialStock)) return 'A quantidade deve ser um número inteiro.'
      return Number(form.initialStock) > MAX_INTEGER ? 'Quantidade acima do limite.' : undefined
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
    price: form.price ?? 0,
    initialStock: Number(form.initialStock),
  }
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      <Typography variant="overline" sx={{ color: 'text.disabled' }}>
        {title}
      </Typography>
      {children}
    </Box>
  )
}

type ProductFormModalProps = { onClose: () => void } & (
  | {
      product?: undefined
      existingSkus?: string[]
      duplicateOf?: Product
      onSave: (payload: CreateProductPayload) => Promise<void>
    }
  | { product: Product; onSave: (payload: UpdateProductPayload) => Promise<void> }
)

export function ProductFormModal(props: ProductFormModalProps) {
  const { onClose } = props
  const editing = !!props.product
  const fields = editing ? EDIT_FIELDS : CREATE_FIELDS
  const takenSkus = props.product ? [] : (props.existingSkus ?? [])
  const [form, setForm] = useState<ProductForm>(() => {
    if (props.product) return toForm(props.product)
    if (props.duplicateOf) return toDuplicateForm(props.duplicateOf, takenSkus)
    return EMPTY_FORM
  })
  const duplicating = !props.product && !!props.duplicateOf

  const placeCaretAtEnd = useCallback(
    (input: HTMLInputElement | null) => {
      if (!duplicating || !input) return
      input.setSelectionRange(input.value.length, input.value.length)
    },
    [duplicating],
  )

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({})

  const set = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const [suggesting, setSuggesting] = useState(!editing)

  const changeName = (name: string) => {
    setForm((prev) => ({ ...prev, name, sku: suggesting ? suggestSku(name, takenSkus) : prev.sku }))
  }

  const changeSku = (sku: string) => {
    setSuggesting(false)
    set('sku', sku)
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <FormSection title="Identificação">
          <TextField
            label="Nome"
            required
            value={form.name}
            inputRef={placeCaretAtEnd}
            autoFocus={duplicating}
            onChange={(e) => changeName(e.target.value)}
            onBlur={() => handleBlur('name')}
            placeholder="Ex.: iPhone 15 Pro 256GB"
            error={!!displayError('name')}
            helperText={displayError('name') ?? ' '}
            slotProps={{ htmlInput: { maxLength: 200 } }}
            fullWidth
          />

          <FormRow>
            <TextField
              label="Código de Referência"
              required
              value={form.sku}
              onChange={(e) => changeSku(e.target.value)}
              onBlur={() => handleBlur('sku')}
              placeholder="Ex.: IP15P-256"
              error={!!displayError('sku')}
              helperText={
                displayError('sku') ??
                (editing
                  ? 'Gravado em maiúsculas, sem espaços nas pontas.'
                  : 'Sugerido a partir do nome; edite à vontade.')
              }
              slotProps={{ htmlInput: { maxLength: 60 } }}
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

          <TextField
            label="Descrição"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Detalhes do produto (opcional)"
            multiline
            minRows={2}
            helperText=" "
            slotProps={{ htmlInput: { maxLength: 1000 } }}
            fullWidth
          />
        </FormSection>

        {!editing && (
          <FormSection title="Preço & Estoque">
            <FormRow>
              <CurrencyField
                label="Preço de Venda"
                required
                value={form.price}
                onChange={(price) => set('price', price)}
                onBlur={() => handleBlur('price')}
                error={!!displayError('price')}
                helperText={displayError('price') ?? ' '}
                fullWidth
              />
              <TextField
                label="Quantidade Inicial em Estoque"
                required
                value={form.initialStock}
                onChange={(e) => set('initialStock', sanitizeInteger(e.target.value))}
                onBlur={() => handleBlur('initialStock')}
                error={!!displayError('initialStock')}
                helperText={displayError('initialStock') ?? ' '}
                slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                fullWidth
              />
            </FormRow>
          </FormSection>
        )}

        {error && <Alert severity="error">{error}</Alert>}
      </Box>
    </FormDialog>
  )
}
