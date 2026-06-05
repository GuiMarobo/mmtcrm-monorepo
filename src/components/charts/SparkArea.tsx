/* MMT Urbana CRM — Smooth area/line chart */

import type { SalesPoint } from '../../types'

interface SparkAreaProps {
  data: SalesPoint[]
  w?: number
  h?: number
  color?: string
}

export function SparkArea({ data, w = 720, h = 200, color = '#2f6dff' }: SparkAreaProps) {
  const max = Math.max(...data.map((d) => d.v))
  const min = Math.min(...data.map((d) => d.v))
  const padX = 16
  const padY = 14
  const stepX = (w - padX * 2) / (data.length - 1)
  const yFor = (v: number) => h - padY - ((v - min) / (max - min)) * (h - padY * 2)
  const pts: [number, number][] = data.map((d, i) => [padX + i * stepX, yFor(d.v)])

  // Smooth bezier path
  const path = pts
    .map((p, i) => {
      if (i === 0) return `M ${p[0]} ${p[1]}`
      const prev = pts[i - 1]
      const cx = (prev[0] + p[0]) / 2
      return `C ${cx} ${prev[1]}, ${cx} ${p[1]}, ${p[0]} ${p[1]}`
    })
    .join(' ')
  const area = path + ` L ${pts[pts.length - 1][0]} ${h - padY} L ${pts[0][0]} ${h - padY} Z`
  const gridY = [0, 0.25, 0.5, 0.75, 1].map((t) => padY + t * (h - padY * 2))

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridY.map((y, i) => (
        <line key={i} x1={padX} x2={w - padX} y1={y} y2={y} stroke="#eef0f3" strokeDasharray="3 4" />
      ))}
      <path d={area} fill="url(#lineFill)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.2" />
      {pts.map((p, i) => (
        <g key={i}>
          <text x={p[0]} y={h - 2} fontSize="10.5" fill="#8a8f98" textAnchor="middle">
            {data[i].m}
          </text>
        </g>
      ))}
      {/* highlight last point */}
      <circle
        cx={pts[pts.length - 1][0]}
        cy={pts[pts.length - 1][1]}
        r="5"
        fill="#fff"
        stroke={color}
        strokeWidth="2.5"
      />
    </svg>
  )
}
