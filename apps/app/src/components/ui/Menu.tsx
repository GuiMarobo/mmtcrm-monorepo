import { useRef } from 'react'
import MuiMenu from '@mui/material/Menu'
import MuiMenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import IconButton from '@mui/material/IconButton'
import type { ReactNode } from 'react'
import { I } from '../../icons'

interface MenuProps {
  open: boolean
  onToggle: () => void
  onClose: () => void
  children: ReactNode
}

export function Menu({ open, onToggle, onClose, children }: MenuProps) {
  const anchor = useRef<HTMLButtonElement>(null)

  return (
    <>
      <IconButton ref={anchor} onClick={onToggle} aria-label="Ações" size="small">
        {I.more}
      </IconButton>
      <MuiMenu
        open={open}
        anchorEl={anchor.current}
        onClose={onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {children}
      </MuiMenu>
    </>
  )
}

interface MenuItemProps {
  icon?: ReactNode
  danger?: boolean
  onClick: () => void
  children: ReactNode
}

export function MenuItem({
  icon,
  danger = false,
  onClick,
  children,
}: MenuItemProps) {
  return (
    <MuiMenuItem
      onClick={onClick}
      sx={
        danger
          ? {
              color: 'error.main',
              '&:hover': { backgroundColor: '#fee2e2', color: 'error.main' },
            }
          : undefined
      }
    >
      {icon && (
        <ListItemIcon sx={danger ? { color: 'error.main' } : undefined}>
          {icon}
        </ListItemIcon>
      )}
      {children}
    </MuiMenuItem>
  )
}
