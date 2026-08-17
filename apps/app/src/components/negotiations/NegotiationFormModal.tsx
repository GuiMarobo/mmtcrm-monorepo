import { useState } from 'react'
import { ApiError } from '../../api'
import { Button, Field, Modal } from '../ui'
import { formatCurrency } from '../../utils/format'
import type {
  Client,
  CreateNegotiationPayload,
  Negotiation,
} from '../../types'

interface NegotiationFormModalProps {
  negotiation: Negotiation | null
  clients: Client[]
  onClose: () => void
  onSave: (payload: CreateNegotiationPayload) => Promise<void>
}

export function NegotiationFormModal({
  negotiation,
  clients,
  onClose,
  onSave,
}: NegotiationFormModalProps) {
  const isEdit = !!negotiation
  const [clientId, setClientId] = useState(negotiation?.clientId ?? '')
  const [totalValue, setTotalValue] = useState(
    negotiation ? String(negotiation.totalValue) : '',
  )
  const [notes, setNotes] = useState(negotiation?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const parsed = Number(totalValue.replace(',', '.'))
  const valueInvalid = totalValue.trim() !== '' && (Number.isNaN(parsed) || parsed < 0)

  const submit = async () => {
    setError(null)
    if (!clientId) {
      setError('Selecione o cliente da negociação.')
      return
    }
    if (totalValue.trim() === '' || Number.isNaN(parsed) || parsed < 0) {
      setError('Informe um valor total válido, igual ou maior que zero.')
      return
    }

    setSaving(true)
    try {
      await onSave({
        clientId,
        totalValue: Math.round(parsed * 100) / 100,
        notes: notes.trim() || null,
      })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível salvar a negociação.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Editar negociação' : 'Nova negociação'}
      subtitle={
        isEdit
          ? 'Altere os dados da tratativa em aberto.'
          : 'A negociação nasce em aberto, com você como vendedor responsável.'
      }
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={() => void submit()} disabled={saving}>
            {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Abrir negociação'}
          </Button>
        </>
      }
    >
      {error && (
        <div className="form-alert" role="alert">
          {error}
        </div>
      )}

      <Field label="Cliente" required>
        <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">Selecione um cliente…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Valor total"
        required
        error={valueInvalid ? 'Valor inválido' : null}
      >
        <input
          type="number"
          min="0"
          step="0.01"
          value={totalValue}
          onChange={(e) => setTotalValue(e.target.value)}
          placeholder="0,00"
          autoFocus={!isEdit}
        />
      </Field>

      {!valueInvalid && totalValue.trim() !== '' && (
        <div className="muted">{formatCurrency(parsed)}</div>
      )}

      <Field label="Observações">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Contexto da tratativa, condições combinadas…"
          maxLength={1000}
        />
      </Field>
    </Modal>
  )
}
