import { useRef, useState } from 'react'
import { ApiError, productsApi } from '../../api'
import type { Product, ProductDetail } from '../../types'

export function useProductDetail() {
  const [selected, setSelected] = useState<Product | null>(null)
  const [detail, setDetail] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const openedId = useRef<string | null>(null)

  const open = async (product: Product) => {
    openedId.current = product.id
    setSelected(product)
    setDetail(null)
    setError(null)
    setLoading(true)
    try {
      const loaded = await productsApi.findOne(product.id)
      if (openedId.current !== product.id) return
      setDetail(loaded)
    } catch (err) {
      if (openedId.current !== product.id) return
      setError(err instanceof ApiError ? err.message : 'Falha ao carregar o histórico de estoque.')
    } finally {
      if (openedId.current === product.id) setLoading(false)
    }
  }

  const close = () => {
    openedId.current = null
    setSelected(null)
    setDetail(null)
    setError(null)
  }

  const isOpen = (id: string) => openedId.current === id

  const show = (updated: ProductDetail) => {
    if (!isOpen(updated.id)) return
    const { stockMovements: _, ...row } = updated
    setSelected(row)
    setDetail(updated)
  }

  return { selected, detail, loading, error, open, close, isOpen, show }
}
