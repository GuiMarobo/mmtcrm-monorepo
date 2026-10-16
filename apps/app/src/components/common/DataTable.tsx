import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import Skeleton from '@mui/material/Skeleton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import { Fragment, useState } from 'react'
import type { ReactNode } from 'react'
import { sortRows } from './dataTableUtils'
import type { SortDirection, SortValue } from './dataTableUtils'

export type RowId = string | number

export interface DataTableColumn<T> {
  key: string
  label: string
  align?: 'left' | 'right'
  hidden?: boolean
  sortValue?: (row: T) => SortValue
  render: (row: T) => ReactNode
}

export interface DataTableSort {
  key: string
  direction: SortDirection
}

export interface DataTableSelection<T> {
  selected: ReadonlySet<RowId>
  onChange: (next: Set<RowId>) => void
  rowLabel: (row: T) => string
}

interface DataTableProps<T> {
  label: string
  rows: T[]
  columns: DataTableColumn<T>[]
  getRowId: (row: T) => RowId
  loading?: boolean
  size?: 'small' | 'medium'
  stickyHeader?: boolean
  paginated?: boolean
  initialSort?: DataTableSort
  emptyMessage?: string
  onRowClick?: (row: T) => void
  renderExpanded?: (row: T) => ReactNode
  expandLabel?: (row: T) => string
  renderActions?: (row: T) => ReactNode
  selection?: DataTableSelection<T>
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]
const SKELETON_ROWS = 5
const DETAIL_CELL = 'DataTable-detailCell'

const PAGINATION_ARIA: Record<'first' | 'last' | 'next' | 'previous', string> = {
  first: 'Primeira página',
  last: 'Última página',
  next: 'Próxima página',
  previous: 'Página anterior',
}

const stopPropagation = (event: { stopPropagation: () => void }) => event.stopPropagation()

export function DataTable<T>({
  label,
  rows,
  columns,
  getRowId,
  loading = false,
  size = 'medium',
  stickyHeader = false,
  paginated = true,
  initialSort,
  emptyMessage = 'Nenhum registro encontrado',
  onRowClick,
  renderExpanded,
  expandLabel,
  renderActions,
  selection,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<DataTableSort | null>(initialSort ?? null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(PAGE_SIZE_OPTIONS[0])
  const [expanded, setExpanded] = useState<ReadonlySet<RowId>>(new Set())

  const visibleColumns = columns.filter((column) => !column.hidden)
  const sortBy = sort ? columns.find((column) => column.key === sort.key)?.sortValue : undefined
  const sorted = sort && sortBy ? sortRows(rows, sortBy, sort.direction) : rows

  const lastPage = Math.max(0, Math.ceil(sorted.length / rowsPerPage) - 1)
  const currentPage = Math.min(page, lastPage)
  const pageRows = paginated
    ? sorted.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage)
    : sorted

  const expandable = renderExpanded !== undefined
  const clickable = expandable || onRowClick !== undefined
  const columnCount =
    visibleColumns.length +
    (selection ? 1 : 0) +
    (expandable ? 1 : 0) +
    (renderActions ? 1 : 0)

  const toggleSort = (key: string) => {
    setSort((current) =>
      current?.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' },
    )
    setPage(0)
  }

  const toggleExpanded = (id: RowId) =>
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const handleRowClick = (row: T) => {
    if (expandable) toggleExpanded(getRowId(row))
    else onRowClick?.(row)
  }

  const allIds = rows.map(getRowId)
  const selectedCount = selection ? allIds.filter((id) => selection.selected.has(id)).length : 0
  const allSelected = selectedCount > 0 && selectedCount === allIds.length

  const toggleAll = () => {
    if (!selection) return
    const next = new Set(selection.selected)
    allIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)))
    selection.onChange(next)
  }

  const toggleOne = (id: RowId) => {
    if (!selection) return
    const next = new Set(selection.selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selection.onChange(next)
  }

  const cells = '& > thead > tr > th, & > tbody > tr > td'

  return (
    <Box>
      <TableContainer sx={stickyHeader ? { maxHeight: '65vh' } : undefined}>
        <Table
          size={size}
          stickyHeader={stickyHeader}
          aria-label={label}
          sx={{
            [cells]: { whiteSpace: 'nowrap' },
            '& > thead > tr > .MuiTableCell-paddingCheckbox, & > tbody > tr > .MuiTableCell-paddingCheckbox':
              { py: 0, px: 1, width: 48 },
            ...(size === 'small' && {
              [`& > thead > tr > th:not(.MuiTableCell-paddingCheckbox), & > tbody > tr > td:not(.MuiTableCell-paddingCheckbox):not(.${DETAIL_CELL})`]:
                { py: 1 },
            }),
          }}
        >
          <TableHead>
            <TableRow>
              {selection && (
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={selectedCount > 0 && !allSelected}
                    disabled={rows.length === 0}
                    onChange={toggleAll}
                    slotProps={{ input: { 'aria-label': 'Selecionar todos' } }}
                  />
                </TableCell>
              )}
              {expandable && <TableCell padding="checkbox" />}
              {visibleColumns.map((column) => {
                const active = sort?.key === column.key
                return (
                  <TableCell
                    key={column.key}
                    align={column.align}
                    sortDirection={active && sort ? sort.direction : false}
                  >
                    {column.sortValue ? (
                      <TableSortLabel
                        active={active}
                        direction={active && sort ? sort.direction : 'asc'}
                        onClick={() => toggleSort(column.key)}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                  </TableCell>
                )
              })}
              {renderActions && <TableCell padding="checkbox" />}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && rows.length === 0 &&
              Array.from({ length: SKELETON_ROWS }, (_, index) => (
                <TableRow key={index} data-testid="data-table-skeleton-row">
                  {Array.from({ length: columnCount }, (_, cell) => (
                    <TableCell key={cell}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  align="center"
                  sx={{ py: 6, color: 'text.disabled', fontSize: 13, borderBottom: 0 }}
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}

            {pageRows.map((row) => {
              const id = getRowId(row)
              const open = expanded.has(id)
              const selected = selection?.selected.has(id) ?? false
              return (
                <Fragment key={id}>
                  <TableRow
                    hover={clickable}
                    selected={selected}
                    onClick={clickable ? () => handleRowClick(row) : undefined}
                    sx={{
                      ...(clickable && { cursor: 'pointer' }),
                      ...(expandable && { '& > td': { borderBottom: 'unset' } }),
                    }}
                  >
                    {selection && (
                      <TableCell padding="checkbox" onClick={stopPropagation}>
                        <Checkbox
                          checked={selected}
                          onChange={() => toggleOne(id)}
                          slotProps={{
                            input: { 'aria-label': `Selecionar ${selection.rowLabel(row)}` },
                          }}
                        />
                      </TableCell>
                    )}
                    {expandable && (
                      <TableCell padding="checkbox">
                        <IconButton
                          size="small"
                          aria-label={expandLabel?.(row) ?? 'Expandir linha'}
                          aria-expanded={open}
                          onClick={(event) => {
                            event.stopPropagation()
                            toggleExpanded(id)
                          }}
                        >
                          {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                      </TableCell>
                    )}
                    {visibleColumns.map((column) => (
                      <TableCell key={column.key} align={column.align}>
                        {column.render(row)}
                      </TableCell>
                    ))}
                    {renderActions && (
                      <TableCell padding="checkbox" align="right" onClick={stopPropagation}>
                        {renderActions(row)}
                      </TableCell>
                    )}
                  </TableRow>
                  {renderExpanded && (
                    <TableRow>
                      <TableCell colSpan={columnCount} className={DETAIL_CELL} sx={{ p: 0 }}>
                        <Collapse in={open} timeout="auto" unmountOnExit>
                          <Box
                            sx={{
                              px: 2,
                              py: 2,
                              bgcolor: 'background.default',
                              whiteSpace: 'normal',
                            }}
                          >
                            {renderExpanded(row)}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {paginated && rows.length > 0 && (
        <TablePagination
          component="div"
          count={sorted.length}
          page={currentPage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={PAGE_SIZE_OPTIONS}
          onPageChange={(_, next) => setPage(next)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value))
            setPage(0)
          }}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          getItemAriaLabel={(type) => PAGINATION_ARIA[type]}
        />
      )}
    </Box>
  )
}
