import { I } from '../../icons'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
}

function pageItems(current: number, totalPages: number): (number | 'gap')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const items: (number | 'gap')[] = [1]
  if (current > 3) items.push('gap')
  const start = Math.max(2, current - 1)
  const end = Math.min(totalPages - 1, current + 1)
  for (let i = start; i <= end; i++) items.push(i)
  if (current < totalPages - 2) items.push('gap')
  items.push(totalPages)
  return items
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
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1
  const to = Math.min(current * pageSize, total)

  return (
    <div className="pagination">
      <div className="result">
        {total === 0 ? 'Nenhum registro' : `Mostrando ${from}–${to} de ${total}`}
      </div>
      <div className="page-controls">
        <select
          className="select"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {pageSizeOptions.map((n) => (
            <option key={n} value={n}>
              {n} por página
            </option>
          ))}
        </select>
        <button
          className="page-btn"
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
          aria-label="Página anterior"
        >
          {I.chevL}
        </button>
        {pageItems(current, totalPages).map((item, i) =>
          item === 'gap' ? (
            <span key={`gap-${i}`} className="page-ellipsis">
              …
            </span>
          ) : (
            <button
              key={item}
              className={item === current ? 'page-btn active' : 'page-btn'}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          ),
        )}
        <button
          className="page-btn"
          disabled={current >= totalPages}
          onClick={() => onPageChange(current + 1)}
          aria-label="Próxima página"
        >
          {I.chevR}
        </button>
      </div>
    </div>
  )
}
