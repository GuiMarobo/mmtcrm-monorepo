/* MMT Urbana CRM — Tela de Login (integrada ao backend) */

import { useState } from 'react'
import type { FormEvent } from 'react'
import { I } from '../icons'
import { useAuth } from '../contexts/AuthContext'
import { ApiError } from '../api'

export function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
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
      // O AuthProvider atualiza o estado e o App rerenderiza a área autenticada.
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Não foi possível entrar. Tente novamente.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-shell">
      <div className="login-left">
        <div className="login-orb" />
        <div className="login-orb b" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="brand">
            <div className="brand-mark">M</div>
            <div>
              <div className="brand-name">MMT Urbana</div>
              <div className="brand-sub" style={{ color: 'rgba(255,255,255,0.6)' }}>CRM Comercial</div>
            </div>
          </div>
        </div>
        <div className="login-pitch" style={{ position: 'relative', zIndex: 1 }}>
          <h2>Gestão comercial completa para revendedores Apple.</h2>
          <p>
            Acompanhe negociações, orçamentos e trade-in em um único lugar. Da chegada do lead à
            entrega do dispositivo, tudo conectado.
          </p>
          <div className="kpi-strip">
            <div className="kpi">
              <div className="label">Vendas (mês)</div>
              <div className="value">R$ 1,42M</div>
            </div>
            <div className="kpi">
              <div className="label">Negociações ativas</div>
              <div className="value">128</div>
            </div>
            <div className="kpi">
              <div className="label">Trade-in avaliados</div>
              <div className="value">312</div>
            </div>
          </div>
        </div>
      </div>
      <div className="login-right">
        <form className="login-card" onSubmit={submit}>
          <h1>Entrar</h1>
          <div className="lead">Use suas credenciais corporativas para acessar o sistema.</div>
          <div style={{ height: 28 }} />
          <div className="field">
            <label>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@mmturbana.com.br"
              autoComplete="email"
              autoFocus
            />
          </div>
          <div className="field">
            <label>Senha</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                autoComplete="current-password"
                style={{ width: '100%', paddingRight: 42 }}
              />
              <div
                onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: 10, top: 10, color: 'var(--text-3)', cursor: 'pointer' }}
              >
                {showPw ? I.eyeOff : I.eye}
              </div>
            </div>
          </div>
          <div className="login-row">
            <label className="remember" onClick={() => setRemember(!remember)}>
              <span className={'checkbox ' + (remember ? 'checked' : '')}>{remember && I.check}</span>
              Lembrar de mim
            </label>
            <a className="forgot" href="#" onClick={(e) => e.preventDefault()}>
              Esqueci minha senha
            </a>
          </div>
          {error && (
            <div
              role="alert"
              style={{
                color: 'var(--red)',
                background: 'var(--red-bg)',
                border: '1px solid rgba(220,38,38,0.2)',
                padding: '10px 12px',
                borderRadius: 8,
                fontSize: 13,
                marginBottom: 10,
              }}
            >
              {error}
            </div>
          )}
          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
          <div className="login-hint">
            Acesso restrito a colaboradores MMT Urbana. Solicite credenciais ao administrador.
          </div>
        </form>
      </div>
    </div>
  )
}
