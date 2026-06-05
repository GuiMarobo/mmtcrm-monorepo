/* MMT Urbana CRM — Donut chart */

import type { TrafficItem } from '../../types'

interface DonutProps {
  items: TrafficItem[]
  size?: number
  total: number
}

export function Donut({ items, size = 180, total }: DonutProps) {
  const sum = items.reduce((a, b) => a + b.value, 0)
  const r = size / 2 - 16
  const c = size / 2
  const circ = 2 * Math.PI * r

  let offset = 0
  const segs = items.map((it, i) => {
    const len = (it.value / sum) * circ
    const dash = `${len} ${circ - len}`
    const seg = (
      <circle
        key={i}
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke={it.color}
        strokeWidth="14"
        strokeDasharray={dash}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${c} ${c})`}
      />
    )
    offset += len
    return seg
  })

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="#f1f3f5" strokeWidth="14" />
        {segs}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div style={{ color: 'var(--text-3)', fontSize: 11.5 }}>Total</div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>{total}</div>
        </div>
      </div>
    </div>
  )
}
