import { useMemo } from 'react'
import { Stat, StatGrid } from '../common/StatGrid'
import { summarizeCatalog } from './productsSummary'
import { formatCurrency } from '../../utils/format'
import type { Product } from '../../types'

interface ProductStatsProps {
  list: Product[]
  loading: boolean
}

const PENDING = '—'

export function ProductStats({ list, loading }: ProductStatsProps) {
  const summary = useMemo(() => summarizeCatalog(list), [list])

  return (
    <StatGrid columns={3}>
      <Stat
        label="Produtos Ativos"
        value={loading ? PENDING : summary.activeCount}
        hint={loading ? undefined : `de ${summary.total} no catálogo`}
      />
      <Stat
        label="Unidades em Estoque"
        value={loading ? PENDING : summary.units}
        hint={loading ? undefined : 'saldo somado de todos os produtos'}
      />
      <Stat
        label="Valor do Estoque"
        value={loading ? PENDING : formatCurrency(summary.stockValue)}
        hint={loading ? undefined : 'saldo × preço de venda'}
      />
    </StatGrid>
  )
}
