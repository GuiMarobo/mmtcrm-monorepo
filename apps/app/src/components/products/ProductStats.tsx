import { useMemo } from 'react'
import { Stat, StatGrid } from '../common/StatGrid'
import { summarizeCatalog } from './productsSummary'
import { LOW_STOCK_LIMIT } from './productsList'
import { formatCurrency, plural } from '../../utils/format'
import type { Product } from '../../types'

interface ProductStatsProps {
  list: Product[]
  loading: boolean
}

const PENDING = '—'

const counted = (count: number, word: string) => `${count} ${plural(count, word, `${word}s`)}`

export function ProductStats({ list, loading }: ProductStatsProps) {
  const summary = useMemo(() => summarizeCatalog(list), [list])

  return (
    <StatGrid columns={4}>
      <Stat
        label="Total de produtos"
        value={loading ? PENDING : summary.total}
        hint={loading ? undefined : counted(summary.activeCount, 'ativo')}
      />
      <Stat
        label="Unidades em estoque"
        value={loading ? PENDING : summary.units}
        hint={loading ? undefined : 'saldo somado de todos os produtos'}
      />
      <Stat
        label="Valor do estoque"
        value={loading ? PENDING : formatCurrency(summary.stockValue)}
        hint={loading ? undefined : 'saldo × preço de venda'}
      />
      <Stat
        label="Sem estoque / baixo"
        value={loading ? PENDING : `${summary.outOfStockCount} / ${summary.lowStockCount}`}
        hint={
          loading
            ? undefined
            : `${counted(summary.outOfStockCount, 'zerado')} · ${counted(summary.lowStockCount, 'baixo')} (até ${LOW_STOCK_LIMIT} un.)`
        }
      />
    </StatGrid>
  )
}
