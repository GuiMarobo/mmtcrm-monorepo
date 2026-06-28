import type { ReactNode } from 'react'
import { I } from '../icons'
import type { Route } from '../types'

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
  canManageUsers: boolean
  onLogout: () => void
}

export function Sidebar({ route, setRoute, canManageUsers, onLogout }: SidebarProps) {
  const groups = buildGroups(canManageUsers)
  return (
    <aside className="sidebar">
      <div className="brand">
        <div>
          <div className="brand-name">MMT Urbana</div>
          <div className="brand-sub">CRM Comercial</div>
        </div>
      </div>
      {groups.map((group) => (
        <div className="nav-group" key={group.label}>
          <div className="nav-label">{group.label}</div>
          {group.items.map((item) => (
            <div
              key={item.id}
              className={'nav-item ' + (route === item.id ? 'active' : '')}
              onClick={() => setRoute(item.id)}
            >
              <span className="nav-ico">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      ))}
      <div style={{ marginTop: 'auto', padding: '8px 4px 0' }}>
        <div className="nav-item" onClick={onLogout}>
          <span className="nav-ico">{I.power}</span>
          <span>Sair</span>
        </div>
      </div>
    </aside>
  )
}
