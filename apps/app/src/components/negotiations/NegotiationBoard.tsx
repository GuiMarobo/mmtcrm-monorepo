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
import Box from '@mui/material/Box'
import Pagination from '@mui/material/Pagination'
import type { UsePaginationItem } from '@mui/material/usePagination'
import { useMemo, useState } from 'react'
import { NegotiationCard, NegotiationCardOverlay } from './NegotiationCard'
import { NegotiationColumn } from './NegotiationColumn'
import { canTransition } from './transitions'
import type { Negotiation, NegotiationStatus } from '../../types'
import { NEGOTIATION_STATUS_LABELS, NEGOTIATION_STATUSES } from '../../types'

export const BOARD_PAGE_SIZE = 3

const PAGINATION_ARIA: Record<Exclude<UsePaginationItem['type'], 'page'>, string> = {
  first: 'Primeira página',
  last: 'Última página',
  next: 'Próxima página',
  previous: 'Página anterior',
  'start-ellipsis': 'Páginas anteriores',
  'end-ellipsis': 'Páginas seguintes',
}

const FIRST_PAGES: Record<NegotiationStatus, number> = { ABERTA: 1, GANHA: 1, PERDIDA: 1 }

interface NegotiationBoardProps {
  items: Negotiation[]
  onMove: (negotiation: Negotiation, target: NegotiationStatus) => Promise<boolean>
  onRefuse: () => void
  onEdit: (negotiation: Negotiation) => void
  onDelete: (negotiation: Negotiation) => void
}

export function NegotiationBoard({
  items,
  onMove,
  onRefuse,
  onEdit,
  onDelete,
}: NegotiationBoardProps) {
  const [override, setOverride] = useState<Record<number, NegotiationStatus>>({})
  const [activeId, setActiveId] = useState<number | null>(null)
  const [pages, setPages] = useState<Record<NegotiationStatus, number>>(FIRST_PAGES)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
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

  const applyMove = async (negotiation: Negotiation, target: NegotiationStatus) => {
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

  const handleDragStart = (event: DragStartEvent) => setActiveId(Number(event.active.id))

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
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 2,
          alignItems: 'start',
        }}
      >
        {NEGOTIATION_STATUSES.map((status) => {
          const cards = columns[status]
          const pageCount = Math.max(1, Math.ceil(cards.length / BOARD_PAGE_SIZE))
          const page = Math.min(pages[status], pageCount)
          const pageCards = cards.slice((page - 1) * BOARD_PAGE_SIZE, page * BOARD_PAGE_SIZE)
          const accepting =
            activeNegotiation !== null && canTransition(statusOf(activeNegotiation), status)
          return (
            <NegotiationColumn
              key={status}
              status={status}
              count={cards.length}
              total={cards.reduce((acc, n) => acc + n.totalValue, 0)}
              accepting={accepting}
              footer={
                pageCount > 1 && (
                  <Pagination
                    size="small"
                    count={pageCount}
                    page={page}
                    siblingCount={0}
                    onChange={(_, next) => setPages((prev) => ({ ...prev, [status]: next }))}
                    aria-label={`Páginas de ${NEGOTIATION_STATUS_LABELS[status]}`}
                    getItemAriaLabel={(type, item) =>
                      type === 'page' ? `Página ${item}` : PAGINATION_ARIA[type]
                    }
                  />
                )
              }
            >
              {pageCards.map((n) => (
                <NegotiationCard
                  key={n.id}
                  negotiation={n}
                  status={status}
                  onMove={(negotiation, target) => void applyMove(negotiation, target)}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </NegotiationColumn>
          )
        })}
      </Box>

      <DragOverlay>
        {activeNegotiation && <NegotiationCardOverlay negotiation={activeNegotiation} />}
      </DragOverlay>
    </DndContext>
  )
}
