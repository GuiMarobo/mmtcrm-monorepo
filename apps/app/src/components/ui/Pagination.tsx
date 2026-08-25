import Box from '@mui/material/Box'
import TablePagination from '@mui/material/TablePagination'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, totalPages)

  return (
    <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
      <TablePagination
        component="div"
        count={total}
        page={total === 0 ? 0 : current - 1}
        onPageChange={(_, next) => onPageChange(next + 1)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(e) => onPageSizeChange(Number(e.target.value))}
        rowsPerPageOptions={pageSizeOptions}
        labelRowsPerPage="Por página"
        labelDisplayedRows={({ from, to, count }) =>
          count === 0 ? 'Nenhum registro' : `Mostrando ${from}-${to} de ${count}`
        }
        getItemAriaLabel={(type) =>
          type === 'previous' ? 'Página anterior' : 'Próxima página'
        }
        sx={{ '& .MuiTablePagination-toolbar': { minHeight: 54 } }}
      />
    </Box>
  )
}
