import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { useEffect, useState } from 'react'
import { ApiError, productsApi } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useExclusive } from '../hooks/useExclusive'
import {
  ProductConfirmDialog,
  type ProductConfirmAction,
} from '../components/products/ProductConfirmDialog'
import { ProductDetailDrawer } from '../components/products/ProductDetailDrawer'
import { ProductFormModal } from '../components/products/ProductFormModal'
import { ProductsGrid } from '../components/products/ProductsGrid'
import { runProductsBatch } from '../components/products/productsBatch'
import type { BatchAction } from '../components/products/productsBatch'
import { ProductPriceModal } from '../components/products/ProductPriceModal'
import { ProductStats } from '../components/products/ProductStats'
import { StockMovementModal } from '../components/products/StockMovementModal'
import { useProductDetail } from '../components/products/useProductDetail'
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

interface ProductAction {
  kind: 'edit' | 'duplicate' | 'price' | 'stock' | ProductConfirmAction
  product: Product
}

interface ProdutosProps {
  toast: (msg: string, type?: 'success' | 'error') => void
}

export function Produtos({ toast }: ProdutosProps) {
  const { user } = useAuth()
  const [list, setList] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [action, setAction] = useState<ProductAction | null>(null)
  const {
    selected,
    detail,
    loading: detailLoading,
    error: detailError,
    open: openDetail,
    close: closeDetail,
    isOpen,
    show,
  } = useProductDetail()

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

  const saveProduct = async (payload: CreateProductPayload) => {
    const created = await productsApi.create(payload)
    setList((prev) => [created, ...prev])
    setCreating(false)
    setAction(null)
    toast(`Produto "${created.name}" cadastrado`)
  }

  const applyDetail = (updated: ProductDetail) => {
    const { stockMovements: _, ...row } = updated
    setList((prev) => prev.map((p) => (p.id === row.id ? row : p)))
    show(updated)
  }

  const moveStock = async (product: Product, payload: CreateStockMovementPayload) => {
    const updated = await productsApi.moveStock(product.id, payload)
    applyDetail(updated)
    setAction(null)
    toast(`Movimentação registrada. Saldo atual: ${updated.stock}`)
  }

  const updateProduct = async (product: Product, payload: UpdateProductPayload) => {
    const updated = await productsApi.update(product.id, payload)
    applyDetail(updated)
    setAction(null)
    toast(`Produto "${updated.name}" atualizado`)
  }

  const updatePrice = async (product: Product, payload: UpdateProductPricePayload) => {
    const updated = await productsApi.updatePrice(product.id, payload)
    applyDetail(updated)
    setAction(null)
    toast(`Preço atualizado para ${formatCurrency(updated.price)}`)
  }

  const discontinue = async (product: Product) => {
    const updated = await productsApi.discontinue(product.id)
    applyDetail(updated)
    setAction(null)
    toast(`Produto "${updated.name}" descontinuado`)
  }

  const { busy: reactivating, run: reactivate } = useExclusive(async (product: Product) => {
    try {
      const updated = await productsApi.reactivate(product.id)
      applyDetail(updated)
      toast(`Produto "${updated.name}" reativado`)
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erro ao reativar o produto.', 'error')
    }
  })

  const removeProduct = async (product: Product) => {
    const drop = () => {
      setList((prev) => prev.filter((p) => p.id !== product.id))
      setAction(null)
      if (isOpen(product.id)) closeDetail()
    }
    try {
      await productsApi.remove(product.id)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) drop()
      throw err
    }
    drop()
    toast(`Produto "${product.name}" excluído`)
  }

  const batch = (batchAction: BatchAction, products: Product[]) =>
    runProductsBatch(batchAction, products, {
      applyDetail,
      drop: (ids) => {
        setList((prev) => prev.filter((product) => !ids.has(product.id)))
        if ([...ids].some(isOpen)) closeDetail()
      },
      reload,
      toast,
    })

  const startOn = (kind: ProductAction['kind']) => (product: Product) =>
    setAction({ kind, product })

  const startOnDetail = (kind: ProductAction['kind']) =>
    detail ? () => setAction({ kind, product: detail }) : undefined

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
        <>
          <ProductStats list={list} loading={loading} />
          <SectionCard>
            <ProductsGrid
              rows={list}
              loading={loading}
              onOpen={(product) => void openDetail(product)}
              actions={
                isAdmin
                  ? {
                      onEdit: startOn('edit'),
                      onUpdatePrice: startOn('price'),
                      onMoveStock: startOn('stock'),
                      onDuplicate: startOn('duplicate'),
                      onDiscontinue: startOn('discontinue'),
                      onReactivate: (product) => void reactivate(product),
                      onDelete: startOn('delete'),
                    }
                  : undefined
              }
              onBatch={isAdmin ? batch : undefined}
            />
          </SectionCard>
        </>
      )}

      {selected && (
        <ProductDetailDrawer
          product={detail ?? selected}
          movements={detail?.stockMovements ?? []}
          movementsLoading={detailLoading}
          movementsError={detailError}
          isAdmin={isAdmin}
          onUpdatePrice={startOnDetail('price')}
          onMoveStock={startOnDetail('stock')}
          onEdit={startOnDetail('edit')}
          onDuplicate={startOnDetail('duplicate')}
          onDiscontinue={startOnDetail('discontinue')}
          onReactivate={
            detail && !reactivating ? () => void reactivate(detail) : undefined
          }
          onDelete={startOnDetail('delete')}
          onClose={closeDetail}
        />
      )}

      {action?.kind === 'stock' && (
        <StockMovementModal
          product={action.product}
          onClose={() => setAction(null)}
          onSave={(payload) => moveStock(action.product, payload)}
          onError={(message) => toast(message, 'error')}
        />
      )}

      {action?.kind === 'price' && (
        <ProductPriceModal
          product={action.product}
          onClose={() => setAction(null)}
          onSave={(payload) => updatePrice(action.product, payload)}
          onError={(message) => toast(message, 'error')}
        />
      )}

      {action?.kind === 'edit' && (
        <ProductFormModal
          product={action.product}
          onClose={() => setAction(null)}
          onSave={(payload) => updateProduct(action.product, payload)}
        />
      )}

      {action?.kind === 'duplicate' && (
        <ProductFormModal
          duplicateOf={action.product}
          existingSkus={list.map((product) => product.sku)}
          onClose={() => setAction(null)}
          onSave={saveProduct}
        />
      )}

      {(action?.kind === 'discontinue' || action?.kind === 'delete') && (
        <ProductConfirmDialog
          action={action.kind}
          product={action.product}
          onConfirm={() =>
            action.kind === 'delete'
              ? removeProduct(action.product)
              : discontinue(action.product)
          }
          onCancel={() => setAction(null)}
          onError={(message) => toast(message, 'error')}
        />
      )}

      {creating && (
        <ProductFormModal
          existingSkus={list.map((product) => product.sku)}
          onClose={() => setCreating(false)}
          onSave={saveProduct}
        />
      )}
    </Box>
  )
}
