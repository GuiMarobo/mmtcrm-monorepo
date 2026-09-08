import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import type { ReactNode } from 'react'
import { TONES } from '../../theme/tones'
import type { BadgeTone } from '../../theme/tones'

interface ToneChipProps {
  tone: BadgeTone
  dot?: boolean
  children: ReactNode
}

export function ToneChip({ tone, dot = false, children }: ToneChipProps) {
  const { color, bg } = TONES[tone]

  return (
    <Chip
      size="small"
      label={children}
      icon={
        dot ? (
          <Box
            component="span"
            sx={{ width: 6, height: 6, borderRadius: '999px', backgroundColor: color, flexShrink: 0 }}
          />
        ) : undefined
      }
      sx={{ color, backgroundColor: bg, '& .MuiChip-icon': { ml: '10px', mr: '-4px' } }}
    />
  )
}
