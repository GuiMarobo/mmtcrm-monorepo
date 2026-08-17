import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { I } from '../icons'
import type { AuthUser } from '../types'

interface TopbarProps {
  user: AuthUser
  onMenuToggle: () => void
}

export function Topbar({ user, onMenuToggle }: TopbarProps) {
  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: 'background.default',
        color: 'text.primary',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ minHeight: 64, gap: 2, px: { xs: 2, lg: 3.5 } }}>
        <IconButton
          onClick={onMenuToggle}
          aria-label="Abrir menu"
          sx={{ display: { xs: 'inline-flex', lg: 'none' } }}
        >
          {I.menu}
        </IconButton>

        <Typography
          sx={{
            display: { xs: 'block', lg: 'none' },
            fontWeight: 800,
            fontSize: 15,
            letterSpacing: '-0.01em',
          }}
        >
          MMT Urbana
        </Typography>

        <Box sx={{ ml: 'auto' }}>
          <Typography sx={{ fontWeight: 600, fontSize: 14 }} title={user.email}>
            {user.name}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
