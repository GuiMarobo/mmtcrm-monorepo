import { useState } from 'react'
import type { FormEvent } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Link from '@mui/material/Link'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { AuthLayout } from '../components/auth/AuthLayout'
import { PasswordField } from '../components/auth/PasswordField'
import { useAuth } from '../contexts/AuthContext'
import { ApiError } from '../api'

export function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <AuthLayout
      headline="Gestão comercial completa para revendedores Apple."
      pitch="Acompanhe negociações, orçamentos e trade-in em um único lugar. Da chegada do lead à entrega do dispositivo, tudo conectado."
      title="Entrar"
      lead="Use suas credenciais corporativas para acessar o sistema."
      onSubmit={(e) => void submit(e)}
    >
      <TextField
        label="E-mail"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="seu.email@mmturbana.com.br"
        autoComplete="email"
        autoFocus
        fullWidth
        margin="dense"
      />

      <PasswordField
        label="Senha"
        value={password}
        onChange={setPassword}
        placeholder="Sua senha"
        autoComplete="current-password"
      />

      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
          }
          label="Lembrar de mim"
          slotProps={{ typography: { sx: { fontSize: 12.5, color: 'text.secondary' } } }}
        />
        <Link
          href="#"
          onClick={(e) => e.preventDefault()}
          sx={{ ml: 'auto', fontSize: 12.5, textDecoration: 'none' }}
        >
          Esqueci minha senha
        </Link>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}

      <Button
        type="submit"
        variant="contained"
        disabled={loading}
        fullWidth
        sx={{ height: 46, fontSize: 14 }}
      >
        {loading ? 'Entrando…' : 'Entrar'}
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
        Acesso restrito a colaboradores MMT Urbana. Solicite credenciais ao administrador.
      </Typography>
    </AuthLayout>
  )
}
