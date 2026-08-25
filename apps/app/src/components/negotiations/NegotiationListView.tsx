import { useEffect, useMemo, useState } from 'react'
import { NegotiationToolbar } from './NegotiationToolbar'
import { NegotiationTable } from './NegotiationTable'
import { Pagination, TableCard } from '../ui'
import type { Negotiation, NegotiationStatus } from '../../types'

interface NegotiationListViewProps {
  items: Negotiation[]
  loading: boolean
  menuFor: number | null
  onMenuToggle: (id: number | null) => void
  onEdit: (negotiation: Negotiation) => void
  onRequestTransition: (
    negotiation: Negotiation,
    target: NegotiationStatus,
  ) => void
  onDelete: (negotiation: Negotiation) => void
}

export function NegotiationListView({
  items,
  loading,
  menuFor,
  onMenuToggle,
  onEdit,
  onRequestTransition,
  onDelete,
}: NegotiationListViewProps) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | NegotiationStatus>('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    setPage(1)
  }, [query, statusFilter, pageSize])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return items.filter((n) => {
      const matchesTerm =
        !term ||
        (n.client?.name ?? '').toLowerCase().includes(term) ||
        (n.vendedor?.name ?? '').toLowerCase().includes(term) ||
        (n.order?.code ?? '').toLowerCase().includes(term)
      const matchesStatus = statusFilter === 'ALL' || n.status === statusFilter
      return matchesTerm && matchesStatus
    })
  }, [items, query, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )

  return (
    <TableCard>
      <NegotiationToolbar
        query={query}
        onQueryChange={setQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <NegotiationTable
        items={paged}
        loading={loading}
        empty={filtered.length === 0}
        menuFor={menuFor}
        onMenuToggle={onMenuToggle}
        onEdit={onEdit}
        onRequestTransition={onRequestTransition}
        onDelete={onDelete}
      />

      <Pagination
        page={currentPage}
        pageSize={pageSize}
        total={filtered.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </TableCard>
  )
}
