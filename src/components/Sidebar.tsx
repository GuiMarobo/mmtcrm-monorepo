/* MMT Urbana CRM — Sidebar navigation */

import type { ReactNode } from 'react'
import { I } from '../icons'
import type { Route } from '../types'

interface NavEntry {
  id: Route
  label: string
  icon: ReactNode
  badge?: string
}

interface NavGroup {
  label: string
  items: NavEntry[]
}

/** Grupos da sidebar.
 *  Itens condicionais (ex: Usuários — só ADMIN) são filtrados em runtime. */
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
        <div className="brand-mark">M</div>
        <div>
          <div className="brand-name">MMT Urbana</div>
          <div className="brand-sub">CRM Comercial</div>
        </div>
      </div>
      <div className="org-switch">
        <div className="org-mark">PR</div>
        <div style={{ minWidth: 0 }}>
          <div className="org-name">Loja State-CoWork</div>
          <div className="org-meta">Londrina · Matriz</div>
        </div>
        <span className="chev">{I.chev}</span>
      </div>
      {groups.map((g) => (
        <div className="nav-group" key={g.label}>
          <div className="nav-label">{g.label}</div>
          {g.items.map((it) => (
            <div
              key={it.id}
              className={'nav-item ' + (route === it.id ? 'active' : '')}
              onClick={() => setRoute(it.id)}
            >
              <span className="nav-ico">{it.icon}</span>
              <span>{it.label}</span>
              {it.badge && <span className="nav-badge">{it.badge}</span>}
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
