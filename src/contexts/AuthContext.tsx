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
  setUser: (user: AuthUser) => void
  refreshSession: (token: string, user: AuthUser) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

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

  const tokenRef = useRef<string | null>(null)
  tokenRef.current = session?.token ?? null

  useEffect(() => {
    const persisted = readPersistedSession()
    if (persisted) setSession(persisted)
    setLoading(false)
  }, [])

  const logout = useCallback(() => {
    clearAllStorages()
    setSession(null)
  }, [])

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

  const refreshSession = useCallback((token: string, user: AuthUser) => {
    const storage = window.localStorage.getItem(TOKEN_KEY)
      ? window.localStorage
      : window.sessionStorage
    storage.setItem(TOKEN_KEY, token)
    storage.setItem(USER_KEY, JSON.stringify(user))
    setSession({ token, user })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      loading,
      login,
      logout,
      setUser: updateUser,
      refreshSession,
    }),
    [session, loading, login, logout, updateUser, refreshSession],
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
