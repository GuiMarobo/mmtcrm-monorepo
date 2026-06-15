import type { ReactNode } from 'react'

export function TableCard({ children }: { children: ReactNode }) {
  return <div className="table-card">{children}</div>
}

export function TableToolbar({ children }: { children: ReactNode }) {
  return <div className="table-toolbar">{children}</div>
}

export function TableError({ children }: { children: ReactNode }) {
  return <div className="table-error">{children}</div>
}

export function TableEmpty({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="table-empty">
        {children}
      </td>
    </tr>
  )
}

export function TableResult({ children }: { children: ReactNode }) {
  return (
    <div className="pagination">
      <div className="result">{children}</div>
    </div>
  )
}
