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
  if (!summary) {
    return (
      <StatGrid columns={2}>
        <Stat label="Aguardando Avaliação" value={PENDING} />
        <Stat label="Recebidos no Mês" value={PENDING} />
      </StatGrid>
    )
  }

  const { awaiting, receivedThisMonth } = summary
  return (
    <StatGrid columns={2}>
      <Stat
        label="Aguardando Avaliação"
        value={awaiting}
        hint="na fila de negociações em aberto"
      />
      <Stat
        label="Recebidos no Mês"
        value={formatCurrency(receivedThisMonth.value)}
        hint={receivedHint(receivedThisMonth.count)}
      />
    </StatGrid>
  )
}
