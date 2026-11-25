import Box from '@mui/material/Box'
import type { ReactNode } from 'react'
import { TONES } from '../../theme/tones'
import type { BadgeTone } from '../../theme/tones'

interface ToneChipProps {
  tone: BadgeTone
  dot?: boolean
  children: ReactNode
}

export function ToneChip({ tone, dot = false, children }: ToneChipProps) {
  const { color } = TONES[tone]

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        color,
        fontSize: 12.5,
        fontWeight: 700,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      {dot && (
        <Box
          component="span"
          aria-hidden
          sx={{ width: 6, height: 6, borderRadius: '999px', backgroundColor: color, flexShrink: 0 }}
        />
      )}
      {children}
    </Box>
  )
}
