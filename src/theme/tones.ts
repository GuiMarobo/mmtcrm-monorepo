export type BadgeTone = 'green' | 'amber' | 'red' | 'blue' | 'gray' | 'purple'

interface ToneStyle {
  color: string
  bg: string
}

export const TONES: Record<BadgeTone, ToneStyle> = {
  green: { color: '#16a34a', bg: '#dcfce7' },
  amber: { color: '#b45309', bg: '#fef3c7' },
  red: { color: '#dc2626', bg: '#fee2e2' },
  blue: { color: '#2563eb', bg: '#dbeafe' },
  gray: { color: '#475569', bg: '#f1f5f9' },
  purple: { color: '#7c3aed', bg: '#ede9fe' },
}
