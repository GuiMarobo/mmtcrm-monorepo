import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useEffect, useMemo, useState } from 'react'
import { ApiError, ordersApi } from '../api'
import { OrdersDataGrid } from '../components/orders/OrdersDataGrid'
import { OrderDetailDrawer } from '../components/orders/OrderDetailDrawer'
import { ApproveOrderDialog } from '../components/orders/ApproveOrderDialog'
import { summarizeAwaitingPayment } from '../components/orders/ordersSummary'
import { PageHeader } from '../components/common/PageHeader'
import { SearchField } from '../components/common/SearchField'
import { ErrorBanner, SectionCard, SectionToolbar } from '../components/common/SectionCard'
import type { Order, Route } from '../types'

interface PedidosProps {
  toast: (msg: string, type?: 'success' | 'error') => void
  onNavigate: (route: Route) => void
}

export function Pedidos({ toast, onNavigate }: PedidosProps) {
  const [list, setList] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Order | null>(null)
  const [pendingApprove, setPendingApprove] = useState<Order | null>(null)
  const [approving, setApproving] = useState(false)

  const reload = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      setList(await ordersApi.list())
    } catch (err) {
      setLoadError(
        err instanceof ApiError ? err.message : 'Falha ao carregar pedidos.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const summary = useMemo(() => summarizeAwaitingPayment(list), [list])

  const applyApprove = async () => {
    if (!pendingApprove) return
    setApproving(true)
    try {
      const updated = await ordersApi.approve(pendingApprove.id)
      setList((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
      setSelected((current) =>
        current && current.id === updated.id ? updated : current,
      )
      setPendingApprove(null)
      toast('Compra aprovada')
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : 'Erro ao aprovar a compra',
        'error',
      )
    } finally {
      setApproving(false)
    }
  }

  return (
    <Box>
      <PageHeader
        title="Pedidos"
        subtitle="A fila de cobrança: acompanhe e confirme o pagamento de cada pedido."
      />

      {loadError ? (
        <SectionCard>
          <ErrorBanner message={loadError} onRetry={() => void reload()} />
        </SectionCard>
      ) : (
        <SectionCard>
          <SectionToolbar>
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Buscar por código, cliente ou vendedor…"
            />
            <Typography
              sx={{
                ml: { sm: 'auto' },
                fontSize: 13,
                fontWeight: 600,
                color: 'text.secondary',
              }}
            >
              {summary.label}
            </Typography>
          </SectionToolbar>

          {!loading && list.length === 0 ? (
            <Typography
              sx={{
                p: 6,
                textAlign: 'center',
                color: 'text.disabled',
                fontSize: 13,
              }}
            >
              Nenhum pedido ainda
            </Typography>
          ) : (
            <OrdersDataGrid
              rows={list}
              loading={loading}
              quickFilter={query}
              onOpen={setSelected}
            />
          )}
        </SectionCard>
      )}

      {selected && (
        <OrderDetailDrawer
          order={selected}
          approving={approving}
          onApprove={() => setPendingApprove(selected)}
          onGoToNegotiations={() => {
            setSelected(null)
            onNavigate('negociacoes')
          }}
          onClose={() => setSelected(null)}
        />
      )}

      {pendingApprove && (
        <ApproveOrderDialog
          order={pendingApprove}
          loading={approving}
          onConfirm={() => void applyApprove()}
          onCancel={() => setPendingApprove(null)}
        />
      )}
    </Box>
  )
}
