import { useDraggable } from '@dnd-kit/core'
import { I } from '../../icons'
import { Menu, MenuItem } from '../ui'
import { formatCurrency } from '../../utils/format'
import { ALLOWED_TRANSITIONS } from './transitions'
import type { Negotiation, NegotiationStatus } from '../../types'
import { NEGOTIATION_STATUS_LABELS } from '../../types'

const TARGET_ICON: Record<NegotiationStatus, typeof I.reopen> = {
  ABERTA: I.reopen,
  GANHA: I.orders,
  PERDIDA: I.ban,
}

interface NegotiationCardProps {
  negotiation: Negotiation
  status: NegotiationStatus
  menuOpen: boolean
  onMenuToggle: (id: number | null) => void
  onMove: (negotiation: Negotiation, target: NegotiationStatus) => void
  onEdit: (negotiation: Negotiation) => void
  onDelete: (negotiation: Negotiation) => void
}

export function NegotiationCard({
  negotiation,
  status,
  menuOpen,
  onMenuToggle,
  onMove,
  onEdit,
  onDelete,
}: NegotiationCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: negotiation.id,
    data: { status },
  })

  const clientName = negotiation.client?.name ?? 'Cliente removido'

  return (
    <div
      ref={setNodeRef}
      className={isDragging ? 'board-card dragging' : 'board-card'}
      aria-label={`Negociação de ${clientName}, ${NEGOTIATION_STATUS_LABELS[status]}, ${formatCurrency(negotiation.totalValue)}`}
      {...listeners}
      {...attributes}
    >
      <div className="board-card-head">
        <div className="board-card-client">{clientName}</div>
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Menu
            open={menuOpen}
            onToggle={() => onMenuToggle(menuOpen ? null : negotiation.id)}
            onClose={() => onMenuToggle(null)}
          >
            {status === 'ABERTA' && (
              <MenuItem icon={I.edit} onClick={() => onEdit(negotiation)}>
                Editar
              </MenuItem>
            )}
            {ALLOWED_TRANSITIONS[status].map((target) => (
              <MenuItem
                key={target}
                icon={TARGET_ICON[target]}
                onClick={() => onMove(negotiation, target)}
              >
                Mover para {NEGOTIATION_STATUS_LABELS[target]}
              </MenuItem>
            ))}
            <MenuItem icon={I.trash} danger onClick={() => onDelete(negotiation)}>
              Excluir
            </MenuItem>
          </Menu>
        </div>
      </div>

      <div className="board-card-value">
        {formatCurrency(negotiation.totalValue)}
      </div>

      <div className="board-card-foot">
        <span>{negotiation.vendedor?.name ?? 'Sem vendedor'}</span>
        {negotiation.order && (
          <span className="board-card-order">{negotiation.order.code}</span>
        )}
      </div>
    </div>
  )
}

export function NegotiationCardOverlay({
  negotiation,
}: {
  negotiation: Negotiation
}) {
  return (
    <div className="board-card overlay">
      <div className="board-card-head">
        <div className="board-card-client">
          {negotiation.client?.name ?? 'Cliente removido'}
        </div>
      </div>
      <div className="board-card-value">
        {formatCurrency(negotiation.totalValue)}
      </div>
    </div>
  )
}
