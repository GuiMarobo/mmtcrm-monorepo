import { useState } from 'react'
import type { FormEvent } from 'react'
import { I } from '../icons'
import { useAuth } from '../contexts/AuthContext'
import { ApiError } from '../api'
import { Button, Checkbox, Field } from '../components/ui'

export function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    setError(null)
    if (!email || !password) {
      setError('Informe e-mail e senha.')
      return
    }
    setLoading(true)
    try {
      await login({ email, password }, remember)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-shell">
      <div className="login-left">
        <div className="login-orb" />
        <div className="login-orb b" />
        <div className="login-layer">
          <div className="brand">
            <div className="brand-mark">M</div>
            <div>
              <div className="brand-name">MMT Urbana</div>
              <div className="brand-sub">CRM Comercial</div>
            </div>
          </div>
        </div>
        <div className="login-pitch login-layer">
          <h2>Gestão comercial completa para revendedores Apple.</h2>
          <p>
            Acompanhe negociações, orçamentos e trade-in em um único lugar. Da chegada do lead à
            entrega do dispositivo, tudo conectado.
          </p>
        </div>
      </div>
      <div className="login-right">
        <form className="login-card" onSubmit={submit}>
          <h1>Entrar</h1>
          <div className="lead">Use suas credenciais corporativas para acessar o sistema.</div>
          <div className="login-spacer" />
          <Field label="E-mail">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@mmturbana.com.br"
              autoComplete="email"
              autoFocus
            />
          </Field>
          <Field label="Senha">
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? I.eyeOff : I.eye}
              </button>
            </div>
          </Field>
          <div className="login-row">
            <div className="remember">
              <Checkbox checked={remember} onChange={() => setRemember((v) => !v)} aria-label="Lembrar de mim" />
              <span onClick={() => setRemember((v) => !v)}>Lembrar de mim</span>
            </div>
            <a className="forgot" href="#" onClick={(e) => e.preventDefault()}>
              Esqueci minha senha
            </a>
          </div>
          {error && (
            <div className="form-alert" role="alert">
              {error}
            </div>
          )}
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>
          <div className="login-hint">
            Acesso restrito a colaboradores MMT Urbana. Solicite credenciais ao administrador.
          </div>
        </form>
      </div>
    </div>
  )
}
