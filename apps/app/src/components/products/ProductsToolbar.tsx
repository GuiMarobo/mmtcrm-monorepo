import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { SearchField } from '../common/SearchField'
import { SectionToolbar } from '../common/SectionCard'
import {
  STOCK_AVAILABILITY_OPTIONS,
  type ProductFilters,
  type StockAvailability,
} from './productsFilter'
import type { ProductCategory, ProductStatus } from '../../types'
import { PRODUCT_CATEGORY_OPTIONS, PRODUCT_STATUS_OPTIONS } from '../../types'

interface ProductsToolbarProps {
  filters: ProductFilters
  onChange: (filters: ProductFilters) => void
}

const selectSx = { minWidth: 170, flex: { xs: 1, sm: 'none' } }

export function ProductsToolbar({ filters, onChange }: ProductsToolbarProps) {
  const set = <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) =>
    onChange({ ...filters, [key]: value })

  return (
    <SectionToolbar>
      <SearchField
        value={filters.query}
        onChange={(value) => set('query', value)}
        placeholder="Buscar por nome ou código de referência…"
      />
      <TextField
        select
        label="Categoria"
        value={filters.category}
        onChange={(e) => set('category', e.target.value as ProductCategory | '')}
        slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
        sx={selectSx}
      >
        <MenuItem value="">Todas</MenuItem>
        {PRODUCT_CATEGORY_OPTIONS.map((o) => (
          <MenuItem key={o.value} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Situação"
        value={filters.status}
        onChange={(e) => set('status', e.target.value as ProductStatus | '')}
        slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
        sx={selectSx}
      >
        <MenuItem value="">Todas</MenuItem>
        {PRODUCT_STATUS_OPTIONS.map((o) => (
          <MenuItem key={o.value} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
      </TextField>
      <ToggleButtonGroup
        exclusive
        value={filters.availability}
        onChange={(_, next: StockAvailability | null) => next && set('availability', next)}
        aria-label="Disponibilidade"
      >
        {STOCK_AVAILABILITY_OPTIONS.map((o) => (
          <ToggleButton key={o.value} value={o.value}>
            {o.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </SectionToolbar>
  )
}
