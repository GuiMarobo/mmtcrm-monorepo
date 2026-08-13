import { useState } from 'react'
import type { DragEvent, ReactNode } from 'react'
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
  onDrop: (status: NegotiationStatus) => void
  children: ReactNode
}

export function NegotiationColumn({
  status,
  count,
  total,
  accepting,
  onDrop,
  children,
}: NegotiationColumnProps) {
  const [over, setOver] = useState(false)

  const handleDragOver = (event: DragEvent<HTMLElement>) => {
    if (!accepting) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setOver(true)
  }

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    setOver(false)
    if (accepting) onDrop(status)
  }

  return (
    <section
      className={over && accepting ? 'board-col over' : 'board-col'}
      aria-label={NEGOTIATION_STATUS_LABELS[status]}
      onDragOver={handleDragOver}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
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
