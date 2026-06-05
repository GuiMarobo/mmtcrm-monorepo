/**
 * AuthContext — fonte única de verdade para autenticação no frontend.
 *
 * Persiste token + usuário em `localStorage` (sessão lembrada) ou
 * `sessionStorage` (apenas para a aba atual), conforme o flag `remember` da
 * tela de login. Configura o cliente HTTP global injetando o provedor de
 * token e o callback de 401 (logout automático).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { authApi, configureHttp } from '../api'
import type { AuthUser, LoginPayload } from '../types'

const TOKEN_KEY = 'mmt.auth.token'
const USER_KEY = 'mmt.auth.user'

interface PersistedSession {
  token: string
  user: AuthUser
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (payload: LoginPayload, remember: boolean) => Promise<AuthUser>
  logout: () => void
  /** Atualiza o usuário em memória + storage (ex: após editar o próprio perfil). */
  setUser: (user: AuthUser) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Lê uma sessão persistida, tentando local e depois session storage. */
function readPersistedSession(): PersistedSession | null {
  for (const storage of [window.localStorage, window.sessionStorage]) {
    const token = storage.getItem(TOKEN_KEY)
    const rawUser = storage.getItem(USER_KEY)
    if (token && rawUser) {
      try {
        const user = JSON.parse(rawUser) as AuthUser
        return { token, user }
      } catch {
        storage.removeItem(TOKEN_KEY)
        storage.removeItem(USER_KEY)
      }
    }
  }
  return null
}

function clearAllStorages() {
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(USER_KEY)
  window.sessionStorage.removeItem(TOKEN_KEY)
  window.sessionStorage.removeItem(USER_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PersistedSession | null>(null)
  const [loading, setLoading] = useState(true)

  /** Ref garante que o `configureHttp` use sempre o token vigente. */
  const tokenRef = useRef<string | null>(null)
  tokenRef.current = session?.token ?? null

  // Bootstrap: lê o storage e configura o http client uma única vez.
  useEffect(() => {
    const persisted = readPersistedSession()
    if (persisted) setSession(persisted)
    setLoading(false)
  }, [])

  const logout = useCallback(() => {
    clearAllStorages()
    setSession(null)
  }, [])

  // O HTTP client é configurado uma vez: a função tokenProvider lê o ref,
  // então sempre devolve o valor atual sem reconfigurar a cada render.
  useEffect(() => {
    configureHttp({
      tokenProvider: () => tokenRef.current,
      onUnauthorized: () => {
        clearAllStorages()
        setSession(null)
      },
    })
  }, [])

  const login = useCallback(
    async (payload: LoginPayload, remember: boolean): Promise<AuthUser> => {
      const { access_token, user } = await authApi.login(payload)
      const storage = remember ? window.localStorage : window.sessionStorage
      // Limpa o storage oposto para evitar dois tokens persistidos ao alternar.
      const other = remember ? window.sessionStorage : window.localStorage
      other.removeItem(TOKEN_KEY)
      other.removeItem(USER_KEY)
      storage.setItem(TOKEN_KEY, access_token)
      storage.setItem(USER_KEY, JSON.stringify(user))
      setSession({ token: access_token, user })
      return user
    },
    [],
  )

  const updateUser = useCallback((user: AuthUser) => {
    setSession((prev) => {
      if (!prev) return prev
      const next = { ...prev, user }
      const storage = window.localStorage.getItem(TOKEN_KEY)
        ? window.localStorage
        : window.sessionStorage
      storage.setItem(USER_KEY, JSON.stringify(user))
      return next
    })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      loading,
      login,
      logout,
      setUser: updateUser,
    }),
    [session, loading, login, logout, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  }
  return ctx
}
