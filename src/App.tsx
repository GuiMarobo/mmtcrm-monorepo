import { useState } from 'react'
import type { ReactNode } from 'react'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { Placeholder } from './components/Placeholder'
import { Toast } from './components/ui'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Clientes } from './pages/Clientes'
import { Usuarios } from './pages/Usuarios'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useToast } from './hooks/useToast'
import type { Route } from './types'

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
  const { toast, show } = useToast()

  if (loading) return <div className="app-loading">Carregando…</div>
  if (!user) return <Login />

  const canManageUsers = user.role === 'ADMIN'
  const safeRoute: Route = route === 'usuarios' && !canManageUsers ? 'dashboard' : route

  const pages: Record<Route, ReactNode> = {
    dashboard: <Dashboard />,
    clientes: <Clientes toast={show} />,
    usuarios: canManageUsers ? (
      <Usuarios toast={show} />
    ) : (
      <Placeholder title="Acesso negado" hint="Apenas administradores podem gerenciar usuários." />
    ),
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
      {toast && <Toast text={toast.text} type={toast.type} />}
    </div>
  )
}
