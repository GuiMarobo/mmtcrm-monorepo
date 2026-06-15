import type { ReactNode } from 'react'

export type BadgeTone = 'green' | 'amber' | 'red' | 'blue' | 'gray' | 'purple'

interface BadgeProps {
  tone: BadgeTone
  dot?: boolean
  children: ReactNode
}

export function Badge({ tone, dot = false, children }: BadgeProps) {
  return (
    <span className={`badge b-${tone}`}>
      {dot && <span className="dotb" />}
      {children}
    </span>
  )
}
