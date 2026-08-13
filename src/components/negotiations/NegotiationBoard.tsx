import { useMemo, useState } from 'react'
import { NegotiationColumn } from './NegotiationColumn'
import { NegotiationCard } from './NegotiationCard'
import { canTransition } from './transitions'
import type { Negotiation, NegotiationStatus } from '../../types'
import { NEGOTIATION_STATUSES } from '../../types'

interface NegotiationBoardProps {
  items: Negotiation[]
  menuFor: number | null
  onMenuToggle: (id: number | null) => void
  onMove: (
    negotiation: Negotiation,
    target: NegotiationStatus,
  ) => Promise<boolean>
  onRefuse: () => void
  onEdit: (negotiation: Negotiation) => void
  onDelete: (negotiation: Negotiation) => void
}

export function NegotiationBoard({
  items,
  menuFor,
  onMenuToggle,
  onMove,
  onRefuse,
  onEdit,
  onDelete,
}: NegotiationBoardProps) {
  const [override, setOverride] = useState<Record<number, NegotiationStatus>>({})
  const [dragging, setDragging] = useState<Negotiation | null>(null)

  const statusOf = (negotiation: Negotiation): NegotiationStatus =>
    override[negotiation.id] ?? negotiation.status

  const columns = useMemo(() => {
    const grouped: Record<NegotiationStatus, Negotiation[]> = {
      ABERTA: [],
      GANHA: [],
      PERDIDA: [],
    }
    items.forEach((n) => grouped[override[n.id] ?? n.status].push(n))
    return grouped
  }, [items, override])

  const applyMove = async (
    negotiation: Negotiation,
    target: NegotiationStatus,
  ) => {
    const current = statusOf(negotiation)
    if (current === target) return
    if (!canTransition(current, target)) {
      onRefuse()
      return
    }

    setOverride((prev) => ({ ...prev, [negotiation.id]: target }))
    await onMove(negotiation, target)
    setOverride((prev) => {
      const next = { ...prev }
      delete next[negotiation.id]
      return next
    })
  }

  const handleDrop = (target: NegotiationStatus) => {
    const negotiation = dragging
    setDragging(null)
    if (negotiation) void applyMove(negotiation, target)
  }

  return (
    <div className="board">
      {NEGOTIATION_STATUSES.map((status) => {
        const cards = columns[status]
        const accepting =
          dragging !== null && canTransition(statusOf(dragging), status)
        return (
          <NegotiationColumn
            key={status}
            status={status}
            count={cards.length}
            total={cards.reduce((acc, n) => acc + n.totalValue, 0)}
            accepting={accepting}
            onDrop={handleDrop}
          >
            {cards.map((n) => (
              <NegotiationCard
                key={n.id}
                negotiation={n}
                status={status}
                dragging={dragging?.id === n.id}
                menuOpen={menuFor === n.id}
                onMenuToggle={onMenuToggle}
                onDragStart={setDragging}
                onDragEnd={() => setDragging(null)}
                onMove={(negotiation, target) => {
                  onMenuToggle(null)
                  void applyMove(negotiation, target)
                }}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </NegotiationColumn>
        )
      })}
    </div>
  )
}
