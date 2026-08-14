import { useState } from 'react'
import type { ReactNode } from 'react'
import { Box, CssBaseline, ThemeProvider } from '@mui/material'
import { theme } from './theme'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { Placeholder } from './components/Placeholder'
import { Toast } from './components/ui'
import { Login } from './pages/Login'
import { ChangePassword } from './pages/ChangePassword'
import { Dashboard } from './pages/Dashboard'
import { Clientes } from './pages/Clientes'
import { Negociacoes } from './pages/Negociacoes'
import { Usuarios } from './pages/Usuarios'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useToast } from './hooks/useToast'
import type { Route } from './types'

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppRoot />
      </AuthProvider>
    </ThemeProvider>
  )
}

function AppRoot() {
  const { user, loading, logout } = useAuth()
  const [route, setRoute] = useState<Route>('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const { toast, show } = useToast()

  if (loading)
    return (
      <Box sx={{ height: '100vh', display: 'grid', placeItems: 'center', color: 'text.disabled' }}>
        Carregando…
      </Box>
    )
  if (!user) return <Login />
  if (user.mustChangePassword) return <ChangePassword />

  const canManageUsers = user.role === 'ADMIN'
  const safeRoute: Route = route === 'usuarios' && !canManageUsers ? 'dashboard' : route

  const navigate = (next: Route) => {
    setRoute(next)
    setMenuOpen(false)
  }

  const pages: Record<Route, ReactNode> = {
    dashboard: <Dashboard />,
    clientes: <Clientes toast={show} />,
    usuarios: canManageUsers ? (
      <Usuarios toast={show} />
    ) : (
      <Placeholder title="Acesso negado" hint="Apenas administradores podem gerenciar usuários." />
    ),
    negociacoes: <Negociacoes toast={show} />,
    orcamentos: <Placeholder title="Orçamentos" hint="Simulador de orçamento e propostas." />,
    pedidos: <Placeholder title="Pedidos" hint="Gerenciamento de pedidos e entregas." />,
    produtos: <Placeholder title="Produtos" hint="Catálogo de dispositivos Apple." />,
    usados: <Placeholder title="Dispositivos Usados" hint="Avaliação e laudo de trade-in." />,
  }

  return (
    <div className={'app-shell' + (menuOpen ? ' menu-open' : '')}>
      <Sidebar
        route={safeRoute}
        setRoute={navigate}
        open={menuOpen}
        canManageUsers={canManageUsers}
        onLogout={() => {
          logout()
          navigate('dashboard')
        }}
      />
      <div
        className="sidebar-scrim"
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
      <div className="main-col" data-screen-label={'App / ' + safeRoute}>
        <Topbar user={user} onMenuToggle={() => setMenuOpen((v) => !v)} />
        <div className="content">{pages[safeRoute]}</div>
      </div>
      {toast && <Toast text={toast.text} type={toast.type} />}
    </div>
  )
}
