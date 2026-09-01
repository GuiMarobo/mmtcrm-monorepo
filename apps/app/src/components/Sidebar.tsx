import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { I } from '../icons'
import type { Route } from '../types'

export const SIDEBAR_WIDTH = 248

interface NavEntry {
  id: Route
  label: string
  icon: ReactNode
}

interface NavGroup {
  label: string
  items: NavEntry[]
}

function buildGroups(canManageUsers: boolean): NavGroup[] {
  const groups: NavGroup[] = [
    {
      label: 'Principal',
      items: [{ id: 'dashboard', label: 'Dashboard', icon: I.dashboard }],
    },
    {
      label: 'Vendas',
      items: [
        { id: 'negociacoes', label: 'Negociações', icon: I.deal },
        { id: 'clientes', label: 'Clientes & Leads', icon: I.clients },
        { id: 'orcamentos', label: 'Orçamentos', icon: I.quote },
        { id: 'pedidos', label: 'Pedidos', icon: I.orders },
      ],
    },
    {
      label: 'Cadastros',
      items: [
        { id: 'produtos', label: 'Produtos', icon: I.product },
        { id: 'usados', label: 'Dispositivos Usados', icon: I.device },
      ],
    },
  ]
  if (canManageUsers) {
    groups.push({
      label: 'Sistema',
      items: [{ id: 'usuarios', label: 'Usuários', icon: I.users }],
    })
  }
  return groups
}

interface SidebarProps {
  route: Route
  setRoute: (route: Route) => void
  open: boolean
  onClose: () => void
  canManageUsers: boolean
  onLogout: () => void
}

export function Sidebar({
  route,
  setRoute,
  open,
  onClose,
  canManageUsers,
  onLogout,
}: SidebarProps) {
  const groups = buildGroups(canManageUsers)

  const itemSx = {
    borderRadius: '8px',
    py: '9px',
    px: '10px',
    gap: 1.25,
    color: 'text.secondary',
    fontSize: 13.5,
    '&:hover': { backgroundColor: '#f6f7f9', color: 'text.primary' },
    '&.Mui-selected': {
      backgroundColor: 'text.primary',
      color: '#fff',
      '& .MuiListItemIcon-root': { color: '#fff' },
      '&:hover': { backgroundColor: 'text.primary' },
    },
  }

  const content = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: '18px 14px 16px',
        gap: 1.75,
        overflow: 'auto',
      }}
    >
      <Box sx={{ px: 1, pb: 1 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em', lineHeight: 1 }}>
          MMT Urbana
        </Typography>
        <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: '3px' }}>
          CRM Comercial
        </Typography>
      </Box>

      {groups.map((group) => (
        <Box key={group.label}>
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'text.disabled',
              px: '10px',
              py: '6px',
            }}
          >
            {group.label}
          </Typography>
          <List disablePadding>
            {group.items.map((item) => (
              <ListItemButton
                key={item.id}
                selected={route === item.id}
                onClick={() => setRoute(item.id)}
                sx={itemSx}
              >
                <ListItemIcon sx={{ minWidth: 0 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{ primary: { sx: { fontSize: 13.5, fontWeight: 500 } } }}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      ))}

      <Box sx={{ mt: 'auto', pt: 1 }}>
        <ListItemButton onClick={onLogout} sx={itemSx}>
          <ListItemIcon sx={{ minWidth: 0 }}>{I.power}</ListItemIcon>
          <ListItemText
            primary="Sair"
            slotProps={{ primary: { sx: { fontSize: 13.5, fontWeight: 500 } } }}
          />
        </ListItemButton>
      </Box>
    </Box>
  )

  const paperSx = {
    width: SIDEBAR_WIDTH,
    backgroundColor: 'background.paper',
    borderRight: 1,
    borderColor: 'divider',
  }

  return (
    <>
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', lg: 'block' },
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
        }}
        slotProps={{ paper: { sx: paperSx } }}
      >
        {content}
      </Drawer>
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', lg: 'none' } }}
        slotProps={{ paper: { sx: { ...paperSx, width: 264 } } }}
      >
        {content}
      </Drawer>
    </>
  )
}
