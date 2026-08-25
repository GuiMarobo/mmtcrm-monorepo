import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { NegotiationColumn } from './NegotiationColumn'
import { NegotiationCard, NegotiationCardOverlay } from './NegotiationCard'
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
  const [activeId, setActiveId] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
    useSensor(KeyboardSensor),
  )

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

  const handleDragStart = (event: DragStartEvent) =>
    setActiveId(Number(event.active.id))

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const negotiation = items.find((n) => n.id === Number(active.id))
    if (negotiation) void applyMove(negotiation, over.id as NegotiationStatus)
  }

  const activeNegotiation = items.find((n) => n.id === activeId) ?? null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="board">
        {NEGOTIATION_STATUSES.map((status) => {
          const cards = columns[status]
          const accepting =
            activeNegotiation !== null &&
            canTransition(statusOf(activeNegotiation), status)
          return (
            <NegotiationColumn
              key={status}
              status={status}
              count={cards.length}
              total={cards.reduce((acc, n) => acc + n.totalValue, 0)}
              accepting={accepting}
            >
              {cards.map((n) => (
                <NegotiationCard
                  key={n.id}
                  negotiation={n}
                  status={status}
                  menuOpen={menuFor === n.id}
                  onMenuToggle={onMenuToggle}
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

      <DragOverlay>
        {activeNegotiation && (
          <NegotiationCardOverlay negotiation={activeNegotiation} />
        )}
      </DragOverlay>
    </DndContext>
  )
}
