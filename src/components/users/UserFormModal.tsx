import { useState } from 'react'
import { I } from '../../icons'
import { ApiError } from '../../api'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { Button, Modal } from '../ui'
import { FormRow } from '../clients/ClientFormModal'
import { maskPhone, onlyDigits } from '../../utils/format'
import { isValidEmail, isValidPhone } from '../../utils/validators'
import type { CreateUserPayload, Role, UpdateUserPayload, User, UserStatus } from '../../types'
import { ROLE_OPTIONS, USER_STATUS_OPTIONS } from '../../types'

interface FormState {
  name: string
  email: string
  phone: string
  password: string
  confirm: string
  role: Role
  status: UserStatus
}

const EMPTY_FORM: FormState = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirm: '',
  role: 'VENDEDOR',
  status: 'ATIVO',
}

function toForm(user: User): FormState {
  return {
    name: user.name,
    email: user.email,
    phone: onlyDigits(user.phone),
    password: '',
    confirm: '',
    role: user.role,
    status: user.status,
  }
}

interface UserFormModalProps {
  user: User | null
  onClose: () => void
  onSubmit: (user: User | null, payload: CreateUserPayload | UpdateUserPayload) => Promise<void>
}

type FieldKey = 'name' | 'email' | 'phone' | 'password' | 'confirm'

const ALL_FIELDS: FieldKey[] = ['name', 'email', 'phone', 'password', 'confirm']

export function UserFormModal({ user, onClose, onSubmit }: UserFormModalProps) {
  const [form, setForm] = useState<FormState>(user ? toForm(user) : EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({})
  const [saving, setSaving] = useState(false)
  const isEdit = !!user

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const computeError = (key: FieldKey): string | undefined => {
    switch (key) {
      case 'name':
        return form.name.trim() ? undefined : 'Informe o nome.'
      case 'email':
        if (!form.email.trim()) return 'Informe o e-mail.'
        return isValidEmail(form.email) ? undefined : 'E-mail inválido.'
      case 'phone':
        return !form.phone || isValidPhone(form.phone)
          ? undefined
          : 'Telefone inválido - informe DDD + número.'
      case 'password':
        if (isEdit && !form.password) return undefined
        return form.password.length >= 8
          ? undefined
          : isEdit
            ? 'A nova senha deve ter ao menos 8 caracteres.'
            : 'A senha deve ter ao menos 8 caracteres.'
      case 'confirm':
        if (isEdit && !form.password) return undefined
        return form.password === form.confirm ? undefined : 'As senhas não conferem.'
    }
  }

  const isComplete = (key: FieldKey): boolean => {
    if (key === 'phone') return onlyDigits(form.phone).length >= 10
    return false
  }

  const displayError = (key: FieldKey): string | undefined => {
    if (!touched[key] && !isComplete(key)) return undefined
    return computeError(key)
  }

  const handleBlur = (key: FieldKey) => {
    setTouched((prev) => ({ ...prev, [key]: true }))
  }

  const validateAll = (): boolean => {
    setTouched({ name: true, email: true, phone: true, password: true, confirm: true })
    return ALL_FIELDS.every((key) => !computeError(key))
  }

  const submit = async () => {
    if (!validateAll()) return
    setError(null)
    setSaving(true)
    try {
      if (isEdit) {
        const payload: UpdateUserPayload = {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          role: form.role,
          status: form.status,
        }
        if (form.password) payload.password = form.password
        await onSubmit(user, payload)
      } else {
        const payload: CreateUserPayload = {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim() || null,
          role: form.role,
          status: form.status,
        }
        await onSubmit(null, payload)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar usuário.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Editar Usuário' : 'Novo Usuário'}
      subtitle="Defina credenciais, perfil de acesso e status."
      onClose={onClose}
      width={640}
      closeOnBackdrop={false}
      footer={
        <>
          <Button onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" icon={I.check} onClick={submit} disabled={saving}>
            {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar usuário'}
          </Button>
        </>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
        <TextField
          label="Nome Completo"
          required
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          placeholder="Ex.: João da Silva"
          error={!!displayError('name')}
          helperText={displayError('name')}
          fullWidth
        />

        <FormRow>
          <TextField
            label="E-mail corporativo"
            type="email"
            required
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            placeholder="nome@mmturbana.com"
            error={!!displayError('email')}
            helperText={displayError('email')}
            fullWidth
          />
          <TextField
            label="Telefone"
            value={maskPhone(form.phone)}
            onChange={(e) => set('phone', onlyDigits(e.target.value).slice(0, 11))}
            onBlur={() => handleBlur('phone')}
            placeholder="(00) 00000-0000"
            error={!!displayError('phone')}
            helperText={displayError('phone')}
            slotProps={{ htmlInput: { inputMode: 'numeric' } }}
            fullWidth
          />
        </FormRow>

        <FormRow>
          <TextField
            label={isEdit ? 'Nova senha (opcional)' : 'Senha'}
            type="password"
            required={!isEdit}
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            onBlur={() => handleBlur('password')}
            placeholder="Mín. 8 caracteres"
            autoComplete="new-password"
            error={!!displayError('password')}
            helperText={displayError('password')}
            fullWidth
          />
          <TextField
            label="Confirmar Senha"
            type="password"
            value={form.confirm}
            onChange={(e) => set('confirm', e.target.value)}
            onBlur={() => handleBlur('confirm')}
            placeholder="Repita a senha"
            autoComplete="new-password"
            error={!!displayError('confirm')}
            helperText={displayError('confirm')}
            fullWidth
          />
        </FormRow>

        <FormRow>
          <TextField
            select
            label="Perfil"
            value={form.role}
            onChange={(e) => set('role', e.target.value as Role)}
            fullWidth
          >
            {ROLE_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Status"
            value={form.status}
            onChange={(e) => set('status', e.target.value as UserStatus)}
            fullWidth
          >
            {USER_STATUS_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </FormRow>

        {error && <Alert severity="error">{error}</Alert>}
      </Box>
    </Modal>
  )
}
