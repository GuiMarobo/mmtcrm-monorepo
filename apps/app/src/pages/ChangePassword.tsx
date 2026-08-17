import { useState } from 'react'
import type { FormEvent } from 'react'
import { I } from '../icons'
import { useAuth } from '../contexts/AuthContext'
import { authApi, ApiError } from '../api'
import { Button, Field } from '../components/ui'

export function ChangePassword() {
  const { refreshSession, logout } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    setError(null)

    if (!currentPassword) { setError('Informe a senha atual.'); return }
    if (newPassword.length < 8) { setError('A nova senha deve ter ao menos 8 caracteres.'); return }
    if (newPassword !== confirm) { setError('As senhas não conferem.'); return }
    if (currentPassword === newPassword) { setError('A nova senha deve ser diferente da atual.'); return }

    setLoading(true)
    try {
      const { access_token, user } = await authApi.changePassword(currentPassword, newPassword)
      refreshSession(access_token, user)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao alterar senha. Tente novamente.')
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
            <div>
              <div className="brand-name">MMT Urbana</div>
              <div className="brand-sub">CRM Comercial</div>
            </div>
          </div>
        </div>
        <div className="login-pitch login-layer">
          <h2>Sua conta foi criada com uma senha temporária.</h2>
          <p>
            Por segurança, defina uma senha pessoal antes de continuar. Escolha algo forte e que
            você não use em outros serviços.
          </p>
        </div>
      </div>
      <div className="login-right">
        <form className="login-card" onSubmit={submit}>
          <h1>Definir nova senha</h1>
          <div className="lead">Você precisa alterar sua senha temporária para continuar.</div>
          <div className="login-spacer" />
          <Field label="Senha atual (temporária)">
            <div className="password-field">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Senha recebida do administrador"
                autoComplete="current-password"
                autoFocus
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowCurrent((v) => !v)}
                aria-label={showCurrent ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showCurrent ? I.eyeOff : I.eye}
              </button>
            </div>
          </Field>
          <Field label="Nova senha">
            <div className="password-field">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 caracteres"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowNew((v) => !v)}
                aria-label={showNew ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showNew ? I.eyeOff : I.eye}
              </button>
            </div>
          </Field>
          <Field label="Confirmar nova senha">
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repita a nova senha"
              autoComplete="new-password"
            />
          </Field>
          {error && (
            <div className="form-alert" role="alert">
              {error}
            </div>
          )}
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Salvando…' : 'Definir senha e continuar'}
          </Button>
          <div className="login-hint">
            Ao definir sua senha, você poderá entrar no MMT Urbana CRM.{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); logout() }}>Sair</a>
          </div>
        </form>
      </div>
    </div>
  )
}
