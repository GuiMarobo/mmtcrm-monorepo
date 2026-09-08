import { useDroppable } from '@dnd-kit/core'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { CANVAS } from '../../theme'
import { TONES } from '../../theme/tones'
import { formatCurrency } from '../../utils/format'
import type { NegotiationStatus } from '../../types'
import { NEGOTIATION_STATUS_LABELS } from '../../types'

const DOT_COLOR: Record<NegotiationStatus, string> = {
  ABERTA: TONES.blue.color,
  GANHA: TONES.green.color,
  PERDIDA: TONES.gray.color,
}

interface NegotiationColumnProps {
  status: NegotiationStatus
  count: number
  total: number
  accepting: boolean
  children: ReactNode
}

export function NegotiationColumn({
  status,
  count,
  total,
  accepting,
  children,
}: NegotiationColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const highlight = isOver && accepting

  return (
    <Paper
      ref={setNodeRef}
      component="section"
      variant="outlined"
      aria-label={NEGOTIATION_STATUS_LABELS[status]}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 220,
        overflow: 'hidden',
        boxShadow: 'none',
        backgroundColor: highlight ? 'primary.light' : CANVAS,
        borderColor: highlight ? 'primary.main' : 'divider',
      }}
    >
      <Box
        sx={{
          p: '12px 14px',
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '999px',
              backgroundColor: DOT_COLOR[status],
            }}
          />
          <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>
            {NEGOTIATION_STATUS_LABELS[status]}
          </Typography>
          <Typography
            sx={{
              ml: 'auto',
              fontSize: 11,
              fontWeight: 700,
              color: 'text.secondary',
              backgroundColor: TONES.gray.bg,
              borderRadius: '999px',
              p: '2px 8px',
            }}
          >
            {count}
          </Typography>
        </Box>
        <Typography sx={{ mt: 0.5, fontSize: 12, color: 'text.disabled' }}>
          {formatCurrency(total)}
        </Typography>
      </Box>

      <Box
        sx={{
          p: 1.25,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          maxHeight: { xs: 'none', md: '58vh' },
          overflow: 'auto',
        }}
      >
        {count === 0 ? (
          <Typography
            sx={{ p: '22px 10px', textAlign: 'center', color: 'text.disabled', fontSize: 12.5 }}
          >
            Nenhuma negociação aqui.
          </Typography>
        ) : (
          children
        )}
      </Box>
    </Paper>
  )
}
