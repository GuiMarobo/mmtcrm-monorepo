import { lazy, Suspense, useState } from 'react'
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
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useToast } from './hooks/useToast'
import type { Route } from './types'

const Clientes = lazy(() =>
  import('./pages/Clientes').then((m) => ({ default: m.Clientes })),
)
const Negociacoes = lazy(() =>
  import('./pages/Negociacoes').then((m) => ({ default: m.Negociacoes })),
)
const Usuarios = lazy(() =>
  import('./pages/Usuarios').then((m) => ({ default: m.Usuarios })),
)

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
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        route={safeRoute}
        setRoute={navigate}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        canManageUsers={canManageUsers}
        onLogout={() => {
          logout()
          navigate('dashboard')
        }}
      />
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Topbar user={user} onMenuToggle={() => setMenuOpen((v) => !v)} />
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: { xs: '16px 12px 24px', sm: '20px 16px 28px', lg: '24px 28px 32px' } }}>
          <Suspense
            fallback={
              <Box sx={{ p: 6, textAlign: 'center', color: 'text.disabled' }}>
                Carregando…
              </Box>
            }
          >
            {pages[safeRoute]}
          </Suspense>
        </Box>
      </Box>
      {toast && <Toast text={toast.text} type={toast.type} />}
    </Box>
  )
}
