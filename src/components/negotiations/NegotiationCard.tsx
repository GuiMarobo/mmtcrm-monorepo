import type { DragEvent } from 'react'
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
  dragging: boolean
  menuOpen: boolean
  onMenuToggle: (id: number | null) => void
  onDragStart: (negotiation: Negotiation) => void
  onDragEnd: () => void
  onMove: (negotiation: Negotiation, target: NegotiationStatus) => void
  onEdit: (negotiation: Negotiation) => void
  onDelete: (negotiation: Negotiation) => void
}

export function NegotiationCard({
  negotiation,
  status,
  dragging,
  menuOpen,
  onMenuToggle,
  onDragStart,
  onDragEnd,
  onMove,
  onEdit,
  onDelete,
}: NegotiationCardProps) {
  const targets = ALLOWED_TRANSITIONS[status]

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(negotiation.id))
    onDragStart(negotiation)
  }

  return (
    <div
      className={dragging ? 'board-card dragging' : 'board-card'}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      aria-label={`Negociação de ${negotiation.client?.name ?? 'cliente removido'}, ${NEGOTIATION_STATUS_LABELS[status]}`}
    >
      <div className="board-card-head">
        <div className="board-card-client">
          {negotiation.client?.name ?? 'Cliente removido'}
        </div>
        <div onDragStart={(e) => e.preventDefault()} draggable={false}>
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
            {targets.map((target) => (
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
