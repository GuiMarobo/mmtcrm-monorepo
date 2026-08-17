import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import type { ReactNode } from 'react'
import { TONES } from '../../theme/tones'
import type { BadgeTone } from '../../theme/tones'

export type { BadgeTone }

interface BadgeProps {
  tone: BadgeTone
  dot?: boolean
  children: ReactNode
}

export function Badge({ tone, dot = false, children }: BadgeProps) {
  const { color, bg } = TONES[tone]

  return (
    <Chip
      size="small"
      label={children}
      icon={
        dot ? (
          <Box
            component="span"
            sx={{
              width: 6,
              height: 6,
              borderRadius: '999px',
              backgroundColor: color,
              flexShrink: 0,
            }}
          />
        ) : undefined
      }
      sx={{
        color,
        backgroundColor: bg,
        '& .MuiChip-icon': { marginLeft: '10px', marginRight: '-4px' },
      }}
    />
  )
}
