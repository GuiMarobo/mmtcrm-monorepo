import { useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { I } from '../icons'
import { ApiError, clientsApi } from '../api'
import { Stat, StatGrid, TableCard, TableError, TableToolbar } from '../components/ui'
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
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
            Clientes recentes
          </Typography>
        </TableToolbar>

        {loadError && <TableError>{loadError}</TableError>}

        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                  E-mail
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Negociações</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                  Cadastro
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: 'text.disabled', py: 3 }}>
                    Carregando…
                  </TableCell>
                </TableRow>
              )}
              {!loading && recent.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: 'text.disabled', py: 3 }}>
                    Nenhum cliente cadastrado ainda.
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                recent.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      {c.email ?? '-'}
                    </TableCell>
                    <TableCell>
                      <ClientStatusBadge status={c.status} />
                    </TableCell>
                    <TableCell align="right">
                      <b>{c.negotiationsCount}</b>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      {formatDate(c.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Box>
      </TableCard>
    </div>
  )
}
