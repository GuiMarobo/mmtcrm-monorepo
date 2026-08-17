import type { ReactNode } from 'react'

export function StatGrid({ children, columns = 4 }: { children: ReactNode; columns?: 2 | 4 }) {
  return <div className={columns === 2 ? 'stats-row cols-2' : 'stats-row'}>{children}</div>
}

interface StatProps {
  label: ReactNode
  value: ReactNode
  delta?: ReactNode
  deltaTone?: 'up' | 'down'
}

export function Stat({ label, value, delta, deltaTone = 'up' }: StatProps) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {delta != null && <div className={`stat-delta delta-${deltaTone}`}>{delta}</div>}
    </div>
  )
}
