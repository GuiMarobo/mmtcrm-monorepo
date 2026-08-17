import { useState } from 'react'
import { Field, FilterPopover, SearchInput, TableToolbar } from '../ui'
import type { NegotiationStatus } from '../../types'
import { NEGOTIATION_STATUS_OPTIONS } from '../../types'

type StatusFilter = 'ALL' | NegotiationStatus

interface NegotiationToolbarProps {
  query: string
  onQueryChange: (value: string) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (value: StatusFilter) => void
}

export function NegotiationToolbar({
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
}: NegotiationToolbarProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<StatusFilter>(statusFilter)

  return (
    <TableToolbar>
      <SearchInput
        value={query}
        onChange={onQueryChange}
        placeholder="Buscar por cliente, vendedor ou pedido…"
      />
      <FilterPopover
        open={open}
        activeCount={statusFilter !== 'ALL' ? 1 : 0}
        onToggle={() => {
          if (open) setOpen(false)
          else {
            setDraft(statusFilter)
            setOpen(true)
          }
        }}
        onClose={() => setOpen(false)}
        onClear={() => setDraft('ALL')}
        onApply={() => {
          onStatusFilterChange(draft)
          setOpen(false)
        }}
      >
        <Field label="Situação" inline>
          <select
            value={draft}
            onChange={(e) => setDraft(e.target.value as StatusFilter)}
          >
            <option value="ALL">Todas</option>
            {NEGOTIATION_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </FilterPopover>
    </TableToolbar>
  )
}
