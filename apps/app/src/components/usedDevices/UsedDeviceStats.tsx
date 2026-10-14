import { Stat, StatGrid } from '../common/StatGrid'
import { formatCurrency } from '../../utils/format'
import type { UsedDeviceSummary } from '../../types'

interface UsedDeviceStatsProps {
  summary: UsedDeviceSummary | null
}

const PENDING = '—'

const receivedHint = (count: number) =>
  `${count} ${count === 1 ? 'aparelho' : 'aparelhos'} em negociações ganhas`

export function UsedDeviceStats({ summary }: UsedDeviceStatsProps) {
  return (
    <StatGrid columns={2}>
      <Stat
        label="Aguardando Avaliação"
        value={summary ? summary.awaiting : PENDING}
        hint={summary ? 'na fila de negociações em aberto' : undefined}
      />
      <Stat
        label="Recebidos no Mês"
        value={summary ? formatCurrency(summary.receivedThisMonth.value) : PENDING}
        hint={summary ? receivedHint(summary.receivedThisMonth.count) : undefined}
      />
    </StatGrid>
  )
}
