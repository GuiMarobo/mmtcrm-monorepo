import { useMemo } from 'react'
import { Stat, StatGrid } from '../common/StatGrid'
import { formatCurrency } from '../../utils/format'
import type { Negotiation } from '../../types'

export function NegotiationStats({ list }: { list: Negotiation[] }) {
  const stats = useMemo(() => {
    const abertas = list.filter((n) => n.status === 'ABERTA')
    const ganhas = list.filter((n) => n.status === 'GANHA')
    const perdidas = list.filter((n) => n.status === 'PERDIDA')
    const sum = (items: Negotiation[]) => items.reduce((acc, n) => acc + n.totalValue, 0)
    const decididas = ganhas.length + perdidas.length
    return {
      pipeline: sum(abertas),
      abertas: abertas.length,
      ganhas: ganhas.length,
      ganhoTotal: sum(ganhas),
      conversao: decididas === 0 ? 0 : Math.round((ganhas.length / decididas) * 100),
    }
  }, [list])

  return (
    <StatGrid>
      <Stat
        label="Pipeline em Aberto"
        value={formatCurrency(stats.pipeline)}
        hint={`${stats.abertas} em andamento`}
      />
      <Stat
        label="Negociações Abertas"
        value={stats.abertas}
        hint={`de ${list.length} no total`}
      />
      <Stat label="Ganhas" value={stats.ganhas} hint={formatCurrency(stats.ganhoTotal)} />
      <Stat
        label="Taxa de Conversão"
        value={`${stats.conversao}%`}
        hint="entre as já decididas"
      />
    </StatGrid>
  )
}
