import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined'
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import { useMemo } from 'react'
import { KpiStat, StatGrid } from '../common/StatGrid'
import { summarizeCatalog } from './productsSummary'
import { LOW_STOCK_LIMIT } from './productsList'
import { formatCurrency } from '../../utils/format'
import type { Product } from '../../types'

interface ProductStatsProps {
  list: Product[]
  loading: boolean
}

const PENDING = '—'

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

export function ProductStats({ list, loading }: ProductStatsProps) {
  const summary = useMemo(() => summarizeCatalog(list), [list])

  return (
    <StatGrid variant="cards" columns={4}>
      <KpiStat
        icon={<Inventory2OutlinedIcon fontSize="small" />}
        tone="blue"
        label="Total de produtos"
        value={loading ? PENDING : summary.total}
        hint={loading ? undefined : plural(summary.activeCount, 'ativo')}
      />
      <KpiStat
        icon={<LayersOutlinedIcon fontSize="small" />}
        tone="purple"
        label="Unidades em estoque"
        value={loading ? PENDING : summary.units}
        hint={loading ? undefined : 'saldo somado de todos os produtos'}
      />
      <KpiStat
        icon={<PaidOutlinedIcon fontSize="small" />}
        tone="green"
        label="Valor do estoque"
        value={loading ? PENDING : formatCurrency(summary.stockValue)}
        hint={loading ? undefined : 'saldo × preço de venda'}
      />
      <KpiStat
        icon={<WarningAmberOutlinedIcon fontSize="small" />}
        tone="amber"
        label="Sem estoque / baixo"
        value={loading ? PENDING : `${summary.outOfStockCount} / ${summary.lowStockCount}`}
        hint={
          loading
            ? undefined
            : `${plural(summary.outOfStockCount, 'zerado')} · ${plural(summary.lowStockCount, 'baixo')} (até ${LOW_STOCK_LIMIT} un.)`
        }
      />
    </StatGrid>
  )
}
