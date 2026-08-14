import { useDroppable } from '@dnd-kit/core'
import type { ReactNode } from 'react'
import { formatCurrency } from '../../utils/format'
import type { NegotiationStatus } from '../../types'
import { NEGOTIATION_STATUS_LABELS } from '../../types'

const DOT_CLASS: Record<NegotiationStatus, string> = {
  ABERTA: 'aberta',
  GANHA: 'ganha',
  PERDIDA: 'perdida',
}

interface NegotiationColumnProps {
  status: NegotiationStatus
  count: number
  total: number
  accepting: boolean
  children: ReactNode
}

export function NegotiationColumn({
  status,
  count,
  total,
  accepting,
  children,
}: NegotiationColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const highlight = isOver && accepting

  return (
    <section
      ref={setNodeRef}
      className={highlight ? 'board-col over' : 'board-col'}
      aria-label={NEGOTIATION_STATUS_LABELS[status]}
    >
      <div className="board-col-head">
        <div className="board-col-title">
          <span className={`board-col-dot ${DOT_CLASS[status]}`} />
          <span>{NEGOTIATION_STATUS_LABELS[status]}</span>
          <span className="board-col-count">{count}</span>
        </div>
        <div className="board-col-total">{formatCurrency(total)}</div>
      </div>
      <div className="board-col-body">
        {count === 0 ? (
          <div className="board-empty">Nenhuma negociação aqui.</div>
        ) : (
          children
        )}
      </div>
    </section>
  )
}
