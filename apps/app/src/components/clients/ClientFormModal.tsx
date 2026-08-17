import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { I } from '../../icons'
import { ApiError } from '../../api'
import { Button, Modal } from '../ui'
import { maskCpf, maskPhone, onlyDigits } from '../../utils/format'
import { isValidCpf, isValidEmail, isValidPhone } from '../../utils/validators'
import type { Client, ClientStatus, CreateClientPayload, LeadOrigin, LeadQualification } from '../../types'
import {
  CLIENT_STATUS_OPTIONS,
  LEAD_ORIGIN_OPTIONS,
  LEAD_QUALIFICATION_OPTIONS,
} from '../../types'

const EMPTY_FORM: CreateClientPayload = {
  name: '',
  email: '',
  phone: '',
  cpf: '',
  address: '',
  origin: 'WHATSAPP',
  status: 'LEAD',
  qualification: 'NAO_QUALIFICADO',
  notes: '',
}

function toForm(client: Client): CreateClientPayload {
  return {
    name: client.name,
    email: client.email ?? '',
    phone: onlyDigits(client.phone),
    cpf: onlyDigits(client.cpf),
    address: client.address ?? '',
    origin: client.origin ?? 'WHATSAPP',
    status: client.status,
    qualification: client.qualification,
    notes: client.notes ?? '',
  }
}

function normalize(form: CreateClientPayload): CreateClientPayload {
  const trimmed = (value?: string | null) => (value?.trim() ? value.trim() : null)
  return {
    ...form,
    email: trimmed(form.email),
    phone: trimmed(form.phone),
    cpf: trimmed(form.cpf),
    address: trimmed(form.address),
    notes: trimmed(form.notes),
  }
}

interface ClientFormModalProps {
  client: Client | null
  onClose: () => void
  onSave: (payload: CreateClientPayload) => Promise<void>
}

type FieldKey = 'name' | 'email' | 'phone' | 'cpf'

const ALL_FIELDS: FieldKey[] = ['name', 'email', 'phone', 'cpf']

function computeError(key: FieldKey, form: CreateClientPayload): string | undefined {
  switch (key) {
    case 'name':
      return form.name.trim() ? undefined : 'Informe o nome do cliente.'
    case 'phone':
      if (!form.phone) return 'Informe o telefone.'
      return isValidPhone(form.phone) ? undefined : 'Telefone inválido - informe DDD + número.'
    case 'email':
      return !form.email || isValidEmail(form.email) ? undefined : 'E-mail inválido.'
    case 'cpf':
      return !form.cpf || isValidCpf(form.cpf) ? undefined : 'CPF inválido.'
  }
}

function isComplete(key: FieldKey, form: CreateClientPayload): boolean {
  if (key === 'cpf') return onlyDigits(form.cpf).length === 11
  if (key === 'phone') return onlyDigits(form.phone).length >= 10
  return false
}

export function FormRow({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 1.75,
      }}
    >
      {children}
    </Box>
  )
}

export function ClientFormModal({ client, onClose, onSave }: ClientFormModalProps) {
  const [form, setForm] = useState<CreateClientPayload>(client ? toForm(client) : EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({})
  const isEdit = !!client

  const set = <K extends keyof CreateClientPayload>(key: K, value: CreateClientPayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const displayError = (key: FieldKey): string | undefined => {
    if (!touched[key] && !isComplete(key, form)) return undefined
    return computeError(key, form)
  }

  const handleBlur = (key: FieldKey) => {
    setTouched((prev) => ({ ...prev, [key]: true }))
  }

  const validateAll = (): boolean => {
    setTouched({ name: true, email: true, phone: true, cpf: true })
    return ALL_FIELDS.every((key) => !computeError(key, form))
  }

  const submit = async () => {
    if (!validateAll()) return
    setError(null)
    setSaving(true)
    try {
      await onSave(normalize(form))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar cliente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Editar Cliente' : 'Novo Cliente / Lead'}
      subtitle="Preencha os dados de contato e classificação."
      onClose={onClose}
      width={640}
      closeOnBackdrop={false}
      footer={
        <>
          <Button onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" icon={I.check} onClick={submit} disabled={saving}>
            {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Cadastrar cliente'}
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
            label="E-mail"
            type="email"
            value={form.email ?? ''}
            onChange={(e) => set('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            placeholder="cliente@email.com"
            error={!!displayError('email')}
            helperText={displayError('email')}
            fullWidth
          />
          <TextField
            label="Telefone"
            required
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
            label="CPF"
            value={maskCpf(form.cpf)}
            onChange={(e) => set('cpf', onlyDigits(e.target.value).slice(0, 11))}
            onBlur={() => handleBlur('cpf')}
            placeholder="000.000.000-00"
            error={!!displayError('cpf')}
            helperText={displayError('cpf')}
            slotProps={{ htmlInput: { inputMode: 'numeric' } }}
            fullWidth
          />
          <TextField
            select
            label="Canal de Origem"
            required
            value={form.origin ?? 'WHATSAPP'}
            onChange={(e) => set('origin', e.target.value as LeadOrigin)}
            fullWidth
          >
            {LEAD_ORIGIN_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </FormRow>

        <TextField
          label="Endereço"
          value={form.address ?? ''}
          onChange={(e) => set('address', e.target.value)}
          placeholder="Rua, nº - Bairro, Cidade/UF"
          fullWidth
        />

        <FormRow>
          <TextField
            select
            label="Status"
            required
            value={form.status ?? 'LEAD'}
            onChange={(e) => set('status', e.target.value as ClientStatus)}
            fullWidth
          >
            {CLIENT_STATUS_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Qualificação"
            required
            value={form.qualification ?? 'NAO_QUALIFICADO'}
            onChange={(e) => set('qualification', e.target.value as LeadQualification)}
            fullWidth
          >
            {LEAD_QUALIFICATION_OPTIONS.map((o) => (
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
