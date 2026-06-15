import { useState } from 'react'
import { I } from '../../icons'
import { ApiError } from '../../api'
import { Button, Field, FieldRow, Modal } from '../ui'
import { maskPhone, onlyDigits } from '../../utils/format'
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

export function UserFormModal({ user, onClose, onSubmit }: UserFormModalProps) {
  const [form, setForm] = useState<FormState>(user ? toForm(user) : EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const isEdit = !!user

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const validate = (): string | null => {
    if (!form.name.trim()) return 'Informe o nome.'
    if (!form.email.trim()) return 'Informe o e-mail.'
    if (!isEdit || form.password) {
      if (form.password.length < 8) {
        return isEdit
          ? 'A nova senha deve ter ao menos 8 caracteres.'
          : 'A senha deve ter ao menos 8 caracteres.'
      }
      if (form.password !== form.confirm) return 'As senhas não conferem.'
    }
    return null
  }

  const submit = async () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
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
      <Field label="Nome Completo">
        <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex: Fernanda Costa" />
      </Field>
      <FieldRow>
        <Field label="E-mail corporativo">
          <input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="nome@mmturbana.com.br"
          />
        </Field>
        <Field label="Telefone">
          <input
            value={maskPhone(form.phone)}
            onChange={(e) => set('phone', onlyDigits(e.target.value).slice(0, 11))}
            placeholder="(11) 90000-0000"
            inputMode="numeric"
          />
        </Field>
      </FieldRow>
      <FieldRow>
        <Field label={isEdit ? 'Nova senha (opcional)' : 'Senha'}>
          <input
            type="password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            placeholder="Mín. 8 caracteres"
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirmar Senha">
          <input
            type="password"
            value={form.confirm}
            onChange={(e) => set('confirm', e.target.value)}
            placeholder="Repita a senha"
            autoComplete="new-password"
          />
        </Field>
      </FieldRow>
      <FieldRow>
        <Field label="Perfil">
          <select value={form.role} onChange={(e) => set('role', e.target.value as Role)}>
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={(e) => set('status', e.target.value as UserStatus)}>
            {USER_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </FieldRow>
      {error && <div className="form-error">{error}</div>}
    </Modal>
  )
}
