import { useRef } from 'react'
import Popover from '@mui/material/Popover'
import Box from '@mui/material/Box'
import Badge from '@mui/material/Badge'
import type { ReactNode } from 'react'
import { I } from '../../icons'
import { Button } from './Button'

interface FilterPopoverProps {
  open: boolean
  activeCount: number
  onToggle: () => void
  onClose: () => void
  onClear: () => void
  onApply: () => void
  children: ReactNode
}

export function FilterPopover({
  open,
  activeCount,
  onToggle,
  onClose,
  onClear,
  onApply,
  children,
}: FilterPopoverProps) {
  const anchor = useRef<HTMLDivElement>(null)

  return (
    <Box ref={anchor} sx={{ position: 'relative' }}>
      <Badge badgeContent={activeCount} color="primary">
        <Button icon={I.filter} onClick={onToggle}>
          Filtros
        </Button>
      </Badge>

      <Popover
        open={open}
        anchorEl={anchor.current}
        onClose={onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { mt: '6px', minWidth: 280, p: '14px' } } }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {children}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
            <Button onClick={onClear}>Limpar</Button>
            <Button variant="primary" onClick={onApply}>
              Aplicar
            </Button>
          </Box>
        </Box>
      </Popover>
    </Box>
  )
}
