import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useEffect, useRef, useState } from 'react'
import { ApiError, productsApi } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { ProductDetailDrawer } from '../components/products/ProductDetailDrawer'
import { ProductFormModal } from '../components/products/ProductFormModal'
import { ProductPriceModal } from '../components/products/ProductPriceModal'
import { ProductsDataGrid } from '../components/products/ProductsDataGrid'
import { StockMovementModal } from '../components/products/StockMovementModal'
import { PageHeader } from '../components/common/PageHeader'
import { ErrorBanner, SectionCard } from '../components/common/SectionCard'
import { formatCurrency } from '../utils/format'
import type {
  CreateProductPayload,
  CreateStockMovementPayload,
  Product,
  ProductDetail,
  UpdateProductPayload,
  UpdateProductPricePayload,
} from '../types'

interface ProdutosProps {
  toast: (msg: string, type?: 'success' | 'error') => void
}

export function Produtos({ toast }: ProdutosProps) {
  const { user } = useAuth()
  const [list, setList] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<Product | null>(null)
  const [detail, setDetail] = useState<ProductDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [movingStock, setMovingStock] = useState(false)
  const [editing, setEditing] = useState(false)
  const [updatingPrice, setUpdatingPrice] = useState(false)
  const openedId = useRef<string | null>(null)

  const isAdmin = user?.role === 'ADMIN'

  const reload = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      setList(await productsApi.list())
    } catch (err) {
      setLoadError(
        err instanceof ApiError ? err.message : 'Falha ao carregar produtos.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const openDetail = async (product: Product) => {
    openedId.current = product.id
    setSelected(product)
    setDetail(null)
    setDetailError(null)
    setDetailLoading(true)
    try {
      const loaded = await productsApi.findOne(product.id)
      if (openedId.current !== product.id) return
      setDetail(loaded)
    } catch (err) {
      if (openedId.current !== product.id) return
      setDetailError(
        err instanceof ApiError
          ? err.message
          : 'Falha ao carregar o histórico de estoque.',
      )
    } finally {
      if (openedId.current === product.id) setDetailLoading(false)
    }
  }

  const closeDetail = () => {
    openedId.current = null
    setMovingStock(false)
    setEditing(false)
    setUpdatingPrice(false)
    setSelected(null)
    setDetail(null)
    setDetailError(null)
  }

  const saveProduct = async (payload: CreateProductPayload) => {
    const created = await productsApi.create(payload)
    setList((prev) => [created, ...prev])
    setCreating(false)
    toast(`Produto "${created.name}" cadastrado`)
  }

  const applyDetail = (updated: ProductDetail) => {
    const { stockMovements: _, ...row } = updated
    setList((prev) => prev.map((p) => (p.id === row.id ? row : p)))
    if (openedId.current === updated.id) {
      setSelected(row)
      setDetail(updated)
    }
  }

  const moveStock = async (payload: CreateStockMovementPayload) => {
    if (!detail) return
    const updated = await productsApi.moveStock(detail.id, payload)
    applyDetail(updated)
    setMovingStock(false)
    toast(`Movimentação registrada. Saldo atual: ${updated.stock}`)
  }

  const updateProduct = async (payload: UpdateProductPayload) => {
    if (!detail) return
    const updated = await productsApi.update(detail.id, payload)
    applyDetail(updated)
    setEditing(false)
    toast(`Produto "${updated.name}" atualizado`)
  }

  const updatePrice = async (payload: UpdateProductPricePayload) => {
    if (!detail) return
    const updated = await productsApi.updatePrice(detail.id, payload)
    applyDetail(updated)
    setUpdatingPrice(false)
    toast(`Preço atualizado para ${formatCurrency(updated.price)}`)
  }

  return (
    <Box>
      <PageHeader
        title="Produtos"
        subtitle="O catálogo de aparelhos e acessórios: preço e disponibilidade num só lugar."
        actions={
          isAdmin && (
            <Button
              variant="contained"
              startIcon={<AddOutlinedIcon />}
              onClick={() => setCreating(true)}
            >
              Novo Produto
            </Button>
          )
        }
      />

      {loadError ? (
        <SectionCard>
          <ErrorBanner message={loadError} onRetry={() => void reload()} />
        </SectionCard>
      ) : (
        <SectionCard>
          {!loading && list.length === 0 ? (
            <Typography
              sx={{
                p: 6,
                textAlign: 'center',
                color: 'text.disabled',
                fontSize: 13,
              }}
            >
              Nenhum produto ainda
            </Typography>
          ) : (
            <ProductsDataGrid
              rows={list}
              loading={loading}
              onOpen={(product) => void openDetail(product)}
            />
          )}
        </SectionCard>
      )}

      {selected && (
        <ProductDetailDrawer
          product={detail ?? selected}
          movements={detail?.stockMovements ?? []}
          movementsLoading={detailLoading}
          movementsError={detailError}
          isAdmin={isAdmin}
          onUpdatePrice={detail ? () => setUpdatingPrice(true) : undefined}
          onMoveStock={detail ? () => setMovingStock(true) : undefined}
          onEdit={detail ? () => setEditing(true) : undefined}
          onClose={closeDetail}
        />
      )}

      {movingStock && detail && (
        <StockMovementModal
          product={detail}
          onClose={() => setMovingStock(false)}
          onSave={moveStock}
          onError={(message) => toast(message, 'error')}
        />
      )}

      {updatingPrice && detail && (
        <ProductPriceModal
          product={detail}
          onClose={() => setUpdatingPrice(false)}
          onSave={updatePrice}
          onError={(message) => toast(message, 'error')}
        />
      )}

      {editing && detail && (
        <ProductFormModal
          product={detail}
          onClose={() => setEditing(false)}
          onSave={updateProduct}
        />
      )}

      {creating && (
        <ProductFormModal
          onClose={() => setCreating(false)}
          onSave={saveProduct}
        />
      )}
    </Box>
  )
}
