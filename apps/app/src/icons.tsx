import type { ReactNode } from 'react'

interface IconProps {
  d: string | ReactNode
  size?: number
  stroke?: number
  fill?: string
}

export function Icon({ d, size = 18, stroke = 1.7, fill = 'none' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {typeof d === 'string' ? <path d={d} /> : d}
    </svg>
  )
}

export const I = {
  dashboard: <Icon d={<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>} />,
  deal: <Icon d={<><path d="M3 7h18" /><path d="M5 7l1.5 11a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2L19 7" /><path d="M9 7V5a3 3 0 0 1 6 0v2" /></>} />,
  clients: <Icon d={<><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9.5" cy="7.5" r="3.5" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 4a4 4 0 0 1 0 7.75" /></>} />,
  quote: <Icon d={<><path d="M9 2h7l5 5v13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" /><path d="M14 3v5h6" /><path d="M11 14h6M11 18h4" /></>} />,
  orders: <Icon d={<><path d="M3 6h18l-2 13a2 2 0 0 1-2 1.7H7a2 2 0 0 1-2-1.7L3 6z" /><path d="M8 10V6a4 4 0 0 1 8 0v4" /></>} />,
  product: <Icon d={<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="M3.3 7l8.7 5 8.7-5M12 22V12" /></>} />,
  device: <Icon d={<><rect x="5" y="2" width="14" height="20" rx="3" /><line x1="11" y1="18" x2="13" y2="18" /></>} />,
  users: <Icon d={<><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M21 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>} />,
  search: <Icon d={<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>} />,
  bell: <Icon d={<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10 21a2 2 0 0 0 4 0" /></>} />,
  chat: <Icon d={<><path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 8.5 8.5 0 0 1-3.7-.8L3 21l1.8-5.3A8.4 8.4 0 1 1 21 11.5z" /></>} />,
  plus: <Icon d="M12 5v14M5 12h14" />,
  chev: <Icon d="M6 9l6 6 6-6" size={14} />,
  chevR: <Icon d="M9 18l6-6-6-6" size={14} />,
  chevL: <Icon d="M15 18l-6-6 6-6" size={14} />,
  more: <Icon d={<><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></>} fill="currentColor" stroke={0} />,
  upload: <Icon d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></>} />,
  download: <Icon d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></>} />,
  filter: <Icon d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />,
  calendar: <Icon d={<><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>} />,
  arrowUp: <Icon d="M7 17L17 7M7 7h10v10" />,
  arrowDown: <Icon d="M17 7L7 17M17 17H7V7" />,
  eye: <Icon d={<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>} />,
  eyeOff: <Icon d={<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-10-7-10-7a17.59 17.59 0 0 1 4.06-4.94M9.9 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a17.06 17.06 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /></>} />,
  mail: <Icon d={<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 6l-10 7L2 6" /></>} />,
  phone: <Icon d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />,
  check: <Icon d="M20 6L9 17l-5-5" />,
  x: <Icon d="M18 6L6 18M6 6l12 12" />,
  trend: <Icon d={<><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></>} />,
  edit: <Icon d={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>} />,
  trash: <Icon d={<><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>} />,
  star: <Icon d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
  spark: <Icon d="M12 2v6m0 8v6M4.93 4.93l4.24 4.24m5.66 5.66l4.24 4.24M2 12h6m8 0h6M4.93 19.07l4.24-4.24m5.66-5.66l4.24-4.24" />,
  power: <Icon d={<><path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" /></>} />,
  shield: <Icon d={<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><line x1="9" y1="12" x2="15" y2="12" /></>} />,
}
