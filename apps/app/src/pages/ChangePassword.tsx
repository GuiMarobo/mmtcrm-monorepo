import { useState } from 'react'
import type { FormEvent } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { AuthLayout } from '../components/auth/AuthLayout'
import { PasswordField } from '../components/auth/PasswordField'
import { useAuth } from '../contexts/AuthContext'
import { authApi, ApiError } from '../api'

export function ChangePassword() {
  const { refreshSession, logout } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    setError(null)

    if (!currentPassword) {
      setError('Informe a senha atual.')
      return
    }
    if (newPassword.length < 8) {
      setError('A nova senha deve ter ao menos 8 caracteres.')
      return
    }
    if (newPassword !== confirm) {
      setError('As senhas não conferem.')
      return
    }
    if (currentPassword === newPassword) {
      setError('A nova senha deve ser diferente da atual.')
      return
    }

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
    <AuthLayout
      headline="Sua conta foi criada com uma senha temporária."
      pitch="Por segurança, defina uma senha pessoal antes de continuar. Escolha algo forte e que você não use em outros serviços."
      title="Definir nova senha"
      lead="Você precisa alterar sua senha temporária para continuar."
      onSubmit={(e) => void submit(e)}
    >
      <PasswordField
        label="Senha atual (temporária)"
        value={currentPassword}
        onChange={setCurrentPassword}
        placeholder="Senha recebida do administrador"
        autoComplete="current-password"
        autoFocus
      />

      <PasswordField
        label="Nova senha"
        value={newPassword}
        onChange={setNewPassword}
        placeholder="Min. 8 caracteres"
        autoComplete="new-password"
      />

      <PasswordField
        label="Confirmar nova senha"
        value={confirm}
        onChange={setConfirm}
        placeholder="Repita a nova senha"
        autoComplete="new-password"
        revealable={false}
      />

      {error && (
        <Alert severity="error" sx={{ mt: 1.5, mb: 1.5 }}>
          {error}
        </Alert>
      )}

      <Button
        type="submit"
        variant="contained"
        disabled={loading}
        fullWidth
        sx={{ height: 46, fontSize: 14, mt: 2 }}
      >
        {loading ? 'Salvando…' : 'Definir senha e continuar'}
      </Button>

      <Typography
        sx={{
          mt: 1.75,
          p: '10px 12px',
          backgroundColor: 'primary.light',
          borderRadius: '9px',
          fontSize: 12,
          color: '#1d4ed8',
        }}
      >
        Ao definir sua senha, você poderá entrar no MMT Urbana CRM.{' '}
        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault()
            logout()
          }}
        >
          Sair
        </Link>
      </Typography>
    </AuthLayout>
  )
}
