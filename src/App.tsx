/* MMT Urbana CRM — App shell + roteamento */

import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { I } from './icons'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { Placeholder } from './components/Placeholder'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Clientes } from './pages/Clientes'
import { Usuarios } from './pages/Usuarios'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import type { Route } from './types'

/** Root: encapsula a árvore com o AuthProvider. */
export default function App() {
  return (
    <AuthProvider>
      <AppRoot />
    </AuthProvider>
  )
}

function AppRoot() {
  const { user, loading, logout } = useAuth()
  const [route, setRoute] = useState<Route>('dashboard')
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2400)
  }

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--text-3)',
          fontSize: 14,
        }}
      >
        Carregando…
      </div>
    )
  }

  if (!user) return <Login />

  // O acesso à tela de Usuários é restrito a ADMIN tanto na sidebar (oculta)
  // quanto aqui (fallback para Dashboard caso o role mude em runtime).
  const canManageUsers = user.role === 'ADMIN'
  const safeRoute: Route = route === 'usuarios' && !canManageUsers ? 'dashboard' : route

  const pages: Record<Route, ReactNode> = {
    dashboard: <Dashboard user={user} />,
    clientes: <Clientes toast={showToast} />,
    usuarios: canManageUsers
      ? <Usuarios toast={showToast} />
      : <Placeholder title="Acesso negado" hint="Apenas administradores podem gerenciar usuários." />,
    negociacoes: <Placeholder title="Negociações" hint="Pipeline de vendas com trade-in." />,
    orcamentos: <Placeholder title="Orçamentos" hint="Simulador de orçamento e propostas." />,
    pedidos: <Placeholder title="Pedidos" hint="Gerenciamento de pedidos e entregas." />,
    produtos: <Placeholder title="Produtos" hint="Catálogo de dispositivos Apple." />,
    usados: <Placeholder title="Dispositivos Usados" hint="Avaliação e laudo de trade-in." />,
  }

  return (
    <div className="app-shell">
      <Sidebar
        route={safeRoute}
        setRoute={setRoute}
        canManageUsers={canManageUsers}
        onLogout={() => {
          logout()
          setRoute('dashboard')
        }}
      />
      <div className="main-col" data-screen-label={'App / ' + safeRoute}>
        <Topbar user={user} />
        <div className="content">{pages[safeRoute]}</div>
      </div>
      {toastMsg && (
        <div className="toast">
          {I.check}
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  )
}
