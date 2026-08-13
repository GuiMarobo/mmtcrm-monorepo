import { useMemo } from 'react'
import { I } from '../../icons'
import { Stat, StatGrid } from '../ui'
import { formatCurrency } from '../../utils/format'
import type { Negotiation } from '../../types'

export function NegotiationStats({ list }: { list: Negotiation[] }) {
  const stats = useMemo(() => {
    const abertas = list.filter((n) => n.status === 'ABERTA')
    const ganhas = list.filter((n) => n.status === 'GANHA')
    const perdidas = list.filter((n) => n.status === 'PERDIDA')
    const sum = (items: Negotiation[]) =>
      items.reduce((acc, n) => acc + n.totalValue, 0)
    const decididas = ganhas.length + perdidas.length
    return {
      pipeline: sum(abertas),
      abertas: abertas.length,
      ganhas: ganhas.length,
      ganhoTotal: sum(ganhas),
      conversao:
        decididas === 0 ? 0 : Math.round((ganhas.length / decididas) * 100),
    }
  }, [list])

  return (
    <StatGrid>
      <Stat
        label="Pipeline em Aberto"
        value={formatCurrency(stats.pipeline)}
        delta={<>{I.spark}<span>{stats.abertas} em andamento</span></>}
      />
      <Stat
        label="Negociações Abertas"
        value={stats.abertas}
        delta={<>{I.spark}<span>de {list.length} no total</span></>}
      />
      <Stat
        label="Ganhas"
        value={stats.ganhas}
        delta={<>{I.spark}<span>{formatCurrency(stats.ganhoTotal)}</span></>}
      />
      <Stat
        label="Taxa de Conversão"
        value={`${stats.conversao}%`}
        delta={<>{I.spark}<span>entre as já decididas</span></>}
      />
    </StatGrid>
  )
}
