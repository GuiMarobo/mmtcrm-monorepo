import { useEffect, useMemo, useState } from 'react'
import { I } from '../icons'
import { ApiError, clientsApi } from '../api'
import { Stat, StatGrid, TableCard, TableEmpty, TableError, TableToolbar } from '../components/ui'
import { ClientStatusBadge } from '../components/clients/ClientBadges'
import { formatDate } from '../utils/format'
import type { Client } from '../types'

export function Dashboard() {
  const [list, setList] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const data = await clientsApi.list()
        if (active) setList(data)
      } catch (err) {
        if (active) setLoadError(err instanceof ApiError ? err.message : 'Falha ao carregar dados.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const stats = useMemo(() => {
    const total = list.length
    const leads = list.filter((c) => c.status === 'LEAD').length
    const ativos = list.filter((c) => c.status === 'ATIVO').length
    const alta = list.filter((c) => c.qualification === 'ALTA_INTENCAO').length
    const negociacoes = list.reduce((sum, c) => sum + (c.negotiationsCount ?? 0), 0)
    const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100))
    return { total, leads, ativos, alta, negociacoes, pct }
  }, [list])

  const recent = useMemo(
    () => [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 6),
    [list],
  )

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">Visão geral da sua base de clientes e negociações.</div>
        </div>
      </div>

      <StatGrid>
        <Stat
          label="Total de Clientes"
          value={stats.total}
          delta={<>{I.spark}<span>{stats.leads} leads em aberto</span></>}
        />
        <Stat
          label="Clientes Ativos"
          value={stats.ativos}
          delta={<>{I.spark}<span>{stats.pct(stats.ativos)}% do total</span></>}
        />
        <Stat
          label="Alta Intenção"
          value={stats.alta}
          delta={<>{I.spark}<span>{stats.pct(stats.alta)}% do total</span></>}
        />
        <Stat
          label="Negociações"
          value={stats.negociacoes}
          delta={<>{I.spark}<span>no total da base</span></>}
        />
      </StatGrid>

      <TableCard>
        <TableToolbar>
          <div className="chart-title">Clientes recentes</div>
        </TableToolbar>
        {loadError && <TableError>{loadError}</TableError>}
        <table className="tbl">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Status</th>
              <th className="num">Negociações</th>
              <th>Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {loading && <TableEmpty colSpan={5}>Carregando…</TableEmpty>}
            {!loading && recent.length === 0 && (
              <TableEmpty colSpan={5}>Nenhum cliente cadastrado ainda.</TableEmpty>
            )}
            {!loading &&
              recent.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="cell-user">
                        <div className="name">{c.name}</div>
                      </div>
                    </td>
                    <td>{c.email ?? '—'}</td>
                    <td>
                      <ClientStatusBadge status={c.status} />
                    </td>
                    <td className="num">
                      <b>{c.negotiationsCount}</b>
                    </td>
                    <td>{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  )
}
