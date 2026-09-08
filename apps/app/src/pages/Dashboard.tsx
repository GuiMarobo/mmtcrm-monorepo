import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { useEffect, useMemo, useState } from 'react'
import { ApiError, clientsApi } from '../api'
import { ClientStatusBadge } from '../components/clients/ClientBadges'
import { PageHeader } from '../components/common/PageHeader'
import { ErrorBanner, SectionCard, SectionToolbar } from '../components/common/SectionCard'
import { Stat, StatGrid } from '../components/common/StatGrid'
import { formatDate } from '../utils/format'
import type { Client } from '../types'

const COLUMN_COUNT = 5

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
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral da sua base de clientes e negociações."
      />

      <StatGrid>
        <Stat
          label="Total de Clientes"
          value={stats.total}
          hint={`${stats.leads} leads em aberto`}
        />
        <Stat
          label="Clientes Ativos"
          value={stats.ativos}
          hint={`${stats.pct(stats.ativos)}% do total`}
        />
        <Stat
          label="Alta Intenção"
          value={stats.alta}
          hint={`${stats.pct(stats.alta)}% do total`}
        />
        <Stat label="Negociações" value={stats.negociacoes} hint="no total da base" />
      </StatGrid>

      <SectionCard>
        <SectionToolbar>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Clientes recentes</Typography>
        </SectionToolbar>

        {loadError && <ErrorBanner message={loadError} />}

        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>E-mail</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Negociações</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Cadastro</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell
                    colSpan={COLUMN_COUNT}
                    align="center"
                    sx={{ color: 'text.disabled', py: 3 }}
                  >
                    Carregando…
                  </TableCell>
                </TableRow>
              )}
              {!loading && recent.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={COLUMN_COUNT}
                    align="center"
                    sx={{ color: 'text.disabled', py: 3 }}
                  >
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
      </SectionCard>
    </Box>
  )
}
