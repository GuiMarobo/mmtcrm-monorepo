import { useState } from 'react'
import { ConfirmDialog, Field } from '../ui'

interface EraseDataDialogProps {
  subject: 'cliente' | 'usuário'
  name: string
  loading: boolean
  onConfirm: (reason: string) => void
  onCancel: () => void
}

export function EraseDataDialog({
  subject,
  name,
  loading,
  onConfirm,
  onCancel,
}: EraseDataDialogProps) {
  const [reason, setReason] = useState('')
  const historyLabel = subject === 'cliente' ? 'negociação' : 'negociação conduzida'

  return (
    <ConfirmDialog
      title="Eliminar dados pessoais?"
      description={
        <>
          <p>
            Atende ao pedido do titular <b>{name}</b> pelo Art. 18, VI da LGPD.{' '}
            <b>Não há como desfazer.</b>
          </p>
          <p className="erase-rule">
            Sem nenhuma {historyLabel}, o registro é eliminado do sistema. Havendo
            histórico, os dados pessoais são anonimizados e as negociações e pedidos são
            preservados, como exige a obrigação fiscal.
          </p>
          <Field label="Registro do pedido" required>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex.: solicitação por WhatsApp em 07/08/2026"
              maxLength={500}
              autoFocus
            />
          </Field>
        </>
      }
      confirmLabel="Eliminar dados"
      danger
      loading={loading}
      confirmDisabled={!reason.trim()}
      onConfirm={() => onConfirm(reason.trim())}
      onCancel={onCancel}
    />
  )
}
