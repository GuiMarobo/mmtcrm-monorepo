import { useDraggable } from '@dnd-kit/core'
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined'
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined'
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { ALLOWED_TRANSITIONS } from './transitions'
import { BORDER_STRONG, SHADOW_MD, SHADOW_SM } from '../../theme'
import { formatCurrency } from '../../utils/format'
import type { Negotiation, NegotiationStatus } from '../../types'
import { NEGOTIATION_STATUS_LABELS } from '../../types'

const TARGET_ICON: Record<NegotiationStatus, ReactNode> = {
  ABERTA: <ReplayOutlinedIcon />,
  GANHA: <ShoppingBagOutlinedIcon />,
  PERDIDA: <BlockOutlinedIcon />,
}

const CARD_SX = {
  p: '10px 12px',
  borderColor: BORDER_STRONG,
  borderRadius: 2,
  boxShadow: SHADOW_SM,
  position: 'relative',
} as const

interface NegotiationCardProps {
  negotiation: Negotiation
  status: NegotiationStatus
  onMove: (negotiation: Negotiation, target: NegotiationStatus) => void
  onEdit: (negotiation: Negotiation) => void
  onDelete: (negotiation: Negotiation) => void
}

export function NegotiationCard({
  negotiation,
  status,
  onMove,
  onEdit,
  onDelete,
}: NegotiationCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: negotiation.id,
    data: { status },
  })
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const clientName = negotiation.client?.name ?? 'Cliente removido'
  const close = () => setAnchorEl(null)

  const run = (action: () => void) => () => {
    close()
    action()
  }

  return (
    <Paper
      ref={setNodeRef}
      variant="outlined"
      aria-label={`Negociação de ${clientName}, ${NEGOTIATION_STATUS_LABELS[status]}, ${formatCurrency(negotiation.totalValue)}`}
      sx={{ ...CARD_SX, cursor: 'grab', opacity: isDragging ? 0.4 : 1 }}
      {...listeners}
      {...attributes}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Typography
          sx={{
            flex: 1,
            minWidth: 0,
            fontWeight: 600,
            fontSize: 13,
            lineHeight: 1.3,
            overflowWrap: 'anywhere',
          }}
        >
          {clientName}
        </Typography>
        <Box onPointerDown={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <IconButton
            size="small"
            aria-label="Ações"
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            <MoreHorizOutlinedIcon />
          </IconButton>
          <Menu
            open={!!anchorEl}
            anchorEl={anchorEl}
            onClose={close}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            {status === 'ABERTA' && (
              <MenuItem onClick={run(() => onEdit(negotiation))}>
                <ListItemIcon>
                  <EditOutlinedIcon />
                </ListItemIcon>
                Editar
              </MenuItem>
            )}
            {ALLOWED_TRANSITIONS[status].map((target) => (
              <MenuItem key={target} onClick={run(() => onMove(negotiation, target))}>
                <ListItemIcon>{TARGET_ICON[target]}</ListItemIcon>
                Mover para {NEGOTIATION_STATUS_LABELS[target]}
              </MenuItem>
            ))}
            <MenuItem
              onClick={run(() => onDelete(negotiation))}
              sx={{ color: 'error.main', '&:hover': { color: 'error.main' } }}
            >
              <ListItemIcon sx={{ color: 'error.main' }}>
                <DeleteOutlineIcon />
              </ListItemIcon>
              Excluir
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <CardValue value={negotiation.totalValue} />

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mt: 1,
          fontSize: 11.5,
          color: 'text.disabled',
        }}
      >
        <span>{negotiation.vendedor?.name ?? 'Sem vendedor'}</span>
        {negotiation.order && (
          <Box component="span" sx={{ ml: 'auto', fontWeight: 600, color: 'text.secondary' }}>
            {negotiation.order.code}
          </Box>
        )}
      </Box>
    </Paper>
  )
}

export function NegotiationCardOverlay({ negotiation }: { negotiation: Negotiation }) {
  return (
    <Paper
      variant="outlined"
      sx={{ ...CARD_SX, cursor: 'grabbing', boxShadow: SHADOW_MD, transform: 'rotate(1.5deg)' }}
    >
      <Typography sx={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>
        {negotiation.client?.name ?? 'Cliente removido'}
      </Typography>
      <CardValue value={negotiation.totalValue} />
    </Paper>
  )
}

function CardValue({ value }: { value: number }) {
  return (
    <Typography sx={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', mt: 0.75 }}>
      {formatCurrency(value)}
    </Typography>
  )
}
