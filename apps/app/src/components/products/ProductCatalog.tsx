import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useMemo, useState, type ReactNode } from 'react'
import { ProductStats } from './ProductStats'
import { ProductsDataGrid } from './ProductsDataGrid'
import { ProductsToolbar } from './ProductsToolbar'
import { EMPTY_PRODUCT_FILTERS, filterProducts, type ProductFilters } from './productsFilter'
import { SectionCard } from '../common/SectionCard'
import type { Product } from '../../types'

interface ProductCatalogProps {
  list: Product[]
  loading: boolean
  onOpen: (product: Product) => void
}

export function ProductCatalog({ list, loading, onOpen }: ProductCatalogProps) {
  const [filters, setFilters] = useState<ProductFilters>(EMPTY_PRODUCT_FILTERS)
  const visible = useMemo(() => filterProducts(list, filters), [list, filters])

  const catalogEmpty = !loading && list.length === 0
  const filteredEmpty = !loading && !catalogEmpty && visible.length === 0

  return (
    <>
      <ProductStats list={list} loading={loading} />
      <SectionCard>
        {catalogEmpty ? (
          <EmptyMessage text="Nenhum produto ainda" />
        ) : (
          <>
            <ProductsToolbar filters={filters} onChange={setFilters} />
            {filteredEmpty ? (
              <EmptyMessage text="Nenhum produto encontrado com a busca e os filtros aplicados">
                <Button
                  size="small"
                  onClick={() => setFilters(EMPTY_PRODUCT_FILTERS)}
                  sx={{ mt: 1.5 }}
                >
                  Limpar filtros
                </Button>
              </EmptyMessage>
            ) : (
              <ProductsDataGrid rows={visible} loading={loading} onOpen={onOpen} />
            )}
          </>
        )}
      </SectionCard>
    </>
  )
}

function EmptyMessage({ text, children }: { text: string; children?: ReactNode }) {
  return (
    <Box sx={{ p: 6, textAlign: 'center' }}>
      <Typography sx={{ color: 'text.disabled', fontSize: 13 }}>{text}</Typography>
      {children}
    </Box>
  )
}
