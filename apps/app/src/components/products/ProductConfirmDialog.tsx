import { useState } from 'react'
import { ApiError } from '../../api'
import { ConfirmDialog } from '../common/ConfirmDialog'
import type { Product } from '../../types'

export type ProductConfirmAction = 'discontinue' | 'delete'

const COPY: Record<
  ProductConfirmAction,
  { title: string; body: string; confirmLabel: string; danger: boolean; fallbackError: string }
> = {
  discontinue: {
    title: 'Descontinuar produto?',
    body:
      'passa a Inativo e deixa de ser oferecido em novas negociações. Ele continua visível para consulta e pode ser reativado depois.',
    confirmLabel: 'Descontinuar',
    danger: false,
    fallbackError: 'Erro ao descontinuar o produto.',
  },
  delete: {
    title: 'Excluir produto?',
    body:
      'sai do catálogo e não poderá mais ser aberto. O histórico de estoque é preservado.',
    confirmLabel: 'Excluir produto',
    danger: true,
    fallbackError: 'Erro ao excluir o produto.',
  },
}

interface ProductConfirmDialogProps {
  action: ProductConfirmAction
  product: Product
  onConfirm: () => Promise<void>
  onCancel: () => void
  onError: (message: string) => void
}

export function ProductConfirmDialog({
  action,
  product,
  onConfirm,
  onCancel,
  onError,
}: ProductConfirmDialogProps) {
  const [saving, setSaving] = useState(false)
  const copy = COPY[action]

  const confirm = async () => {
    setSaving(true)
    try {
      await onConfirm()
    } catch (err) {
      onError(err instanceof ApiError ? err.message : copy.fallbackError)
      setSaving(false)
    }
  }

  return (
    <ConfirmDialog
      title={copy.title}
      description={
        <>
          O produto <b>{product.name}</b> {copy.body}
        </>
      }
      confirmLabel={copy.confirmLabel}
      danger={copy.danger}
      loading={saving}
      onConfirm={() => void confirm()}
      onCancel={onCancel}
    />
  )
}
