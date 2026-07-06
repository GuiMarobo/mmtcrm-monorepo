import { useState } from 'react'
import { I } from '../../icons'
import { ApiError } from '../../api'
import { Button, Field, FieldRow, Modal } from '../ui'
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
      <Field label="Nome Completo" required error={displayError('name')}>
        <input
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          placeholder="Ex.: João da Silva"
        />
      </Field>
      <FieldRow>
        <Field label="E-mail" error={displayError('email')}>
          <input
            type="email"
            value={form.email ?? ''}
            onChange={(e) => set('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            placeholder="cliente@email.com"
          />
        </Field>
        <Field label="Telefone" required error={displayError('phone')}>
          <input
            value={maskPhone(form.phone)}
            onChange={(e) => set('phone', onlyDigits(e.target.value).slice(0, 11))}
            onBlur={() => handleBlur('phone')}
            placeholder="(00) 00000-0000"
            inputMode="numeric"
          />
        </Field>
      </FieldRow>
      <FieldRow>
        <Field label="CPF" error={displayError('cpf')}>
          <input
            value={maskCpf(form.cpf)}
            onChange={(e) => set('cpf', onlyDigits(e.target.value).slice(0, 11))}
            onBlur={() => handleBlur('cpf')}
            placeholder="000.000.000-00"
            inputMode="numeric"
          />
        </Field>
        <Field label="Canal de Origem" required>
          <select value={form.origin ?? 'WHATSAPP'} onChange={(e) => set('origin', e.target.value as LeadOrigin)}>
            {LEAD_ORIGIN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </FieldRow>
      <Field label="Endereço">
        <input
          value={form.address ?? ''}
          onChange={(e) => set('address', e.target.value)}
          placeholder="Rua, nº - Bairro, Cidade/UF"
        />
      </Field>
      <FieldRow>
        <Field label="Status" required>
          <select value={form.status ?? 'LEAD'} onChange={(e) => set('status', e.target.value as ClientStatus)}>
            {CLIENT_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Qualificação" required>
          <select
            value={form.qualification ?? 'NAO_QUALIFICADO'}
            onChange={(e) => set('qualification', e.target.value as LeadQualification)}
          >
            {LEAD_QUALIFICATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </FieldRow>
      {error && (
        <div className="form-alert" role="alert">
          {error}
        </div>
      )}
    </Modal>
  )
}
