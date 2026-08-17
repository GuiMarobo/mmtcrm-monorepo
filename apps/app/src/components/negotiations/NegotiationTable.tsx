import { I } from '../../icons'
import { Menu, MenuItem, TableEmpty } from '../ui'
import { NegotiationStatusBadge, OrderStatusBadge } from './NegotiationBadges'
import { formatCurrency, formatDate } from '../../utils/format'
import type { Negotiation, NegotiationStatus } from '../../types'

const COLUMN_COUNT = 7

interface NegotiationTableProps {
  items: Negotiation[]
  loading: boolean
  empty: boolean
  menuFor: number | null
  onMenuToggle: (id: number | null) => void
  onEdit: (negotiation: Negotiation) => void
  onRequestTransition: (
    negotiation: Negotiation,
    target: NegotiationStatus,
  ) => void
  onDelete: (negotiation: Negotiation) => void
}

export function NegotiationTable({
  items,
  loading,
  empty,
  menuFor,
  onMenuToggle,
  onEdit,
  onRequestTransition,
  onDelete,
}: NegotiationTableProps) {
  return (
    <div className="table-scroll">
      <table className="tbl">
        <thead>
          <tr>
            <th>Cliente</th>
            <th className="col-sm">Vendedor</th>
            <th className="num">Valor</th>
            <th>Situação</th>
            <th className="col-md">Pedido</th>
            <th className="col-md">Atualizada</th>
            <th className="col-actions" />
          </tr>
        </thead>
        <tbody>
          {loading && (
            <TableEmpty colSpan={COLUMN_COUNT}>Carregando negociações…</TableEmpty>
          )}
          {!loading && empty && (
            <TableEmpty colSpan={COLUMN_COUNT}>
              Nenhuma negociação encontrada.
            </TableEmpty>
          )}
          {!loading &&
            items.map((n) => (
              <tr key={n.id}>
                <td>
                  <div className="cell-user">
                    <div>
                      <div className="name">{n.client?.name ?? '-'}</div>
                      {n.notes && <div className="sub">{n.notes}</div>}
                    </div>
                  </div>
                </td>
                <td className="col-sm">{n.vendedor?.name ?? '-'}</td>
                <td className="num">
                  <b>{formatCurrency(n.totalValue)}</b>
                </td>
                <td>
                  <NegotiationStatusBadge status={n.status} />
                </td>
                <td className="col-md">
                  {n.order ? (
                    <div className="cell-user">
                      <div>
                        <div className="name">{n.order.code}</div>
                        <div className="sub">
                          <OrderStatusBadge status={n.order.status} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="col-md">{formatDate(n.updatedAt)}</td>
                <td className="col-actions">
                  <Menu
                    open={menuFor === n.id}
                    onToggle={() => onMenuToggle(menuFor === n.id ? null : n.id)}
                    onClose={() => onMenuToggle(null)}
                  >
                    {n.status === 'ABERTA' && (
                      <MenuItem icon={I.edit} onClick={() => onEdit(n)}>
                        Editar
                      </MenuItem>
                    )}
                    {n.status === 'ABERTA' && (
                      <MenuItem
                        icon={I.orders}
                        onClick={() => onRequestTransition(n, 'GANHA')}
                      >
                        Converter em pedido
                      </MenuItem>
                    )}
                    {n.status === 'ABERTA' && (
                      <MenuItem
                        icon={I.ban}
                        onClick={() => onRequestTransition(n, 'PERDIDA')}
                      >
                        Marcar como perdida
                      </MenuItem>
                    )}
                    {n.status !== 'ABERTA' && (
                      <MenuItem
                        icon={I.reopen}
                        onClick={() => onRequestTransition(n, 'ABERTA')}
                      >
                        Reabrir negociação
                      </MenuItem>
                    )}
                    <MenuItem icon={I.trash} danger onClick={() => onDelete(n)}>
                      Excluir
                    </MenuItem>
                  </Menu>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
