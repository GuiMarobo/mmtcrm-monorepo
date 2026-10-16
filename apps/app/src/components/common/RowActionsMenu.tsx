import MoreVertIcon from '@mui/icons-material/MoreVert'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import { useState } from 'react'
import type { ReactNode } from 'react'

export interface RowAction {
  key: string
  label: string
  icon: ReactNode
  onClick: () => void
  disabledReason?: string
}

interface RowActionsMenuProps {
  label: string
  actions: RowAction[]
}

export function RowActionsMenu({ label, actions }: RowActionsMenuProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  return (
    <>
      <IconButton
        size="small"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={anchor ? 'true' : undefined}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={anchor !== null}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ list: { disabledItemsFocusable: true } }}
      >
        {actions.map((action) => {
          const content = (
            <>
              <ListItemIcon>{action.icon}</ListItemIcon>
              {action.label}
            </>
          )
          return action.disabledReason ? (
            <Tooltip key={action.key} title={action.disabledReason} placement="left" describeChild>
              <MenuItem disabled sx={{ '&.Mui-disabled': { pointerEvents: 'auto' } }}>
                {content}
              </MenuItem>
            </Tooltip>
          ) : (
            <MenuItem
              key={action.key}
              onClick={() => {
                setAnchor(null)
                action.onClick()
              }}
            >
              {content}
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
}
