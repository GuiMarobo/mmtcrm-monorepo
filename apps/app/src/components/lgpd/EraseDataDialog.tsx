import Alert from '@mui/material/Alert'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { ConfirmDialog } from '../common/ConfirmDialog'

interface EraseDataDialogProps {
  subject: 'cliente' | 'usuário'
  name: string
  hasHistory?: boolean
  loading: boolean
  onConfirm: (reason: string) => void
  onCancel: () => void
}

export function EraseDataDialog({
  subject,
  name,
  hasHistory = true,
  loading,
  onConfirm,
  onCancel,
}: EraseDataDialogProps) {
  const [reason, setReason] = useState('')
  const historyLabel = subject === 'cliente' ? 'negociação' : 'negociação conduzida'
  const showWarning = hasHistory === false

  return (
    <ConfirmDialog
      title="Eliminar dados pessoais?"
      description={
        <>
          <Typography sx={{ fontSize: 13.5, lineHeight: 1.55 }}>
            Atende ao pedido do titular <b>{name}</b> pelo Art. 18, VI da LGPD.{' '}
            <b>Não há como desfazer.</b>
          </Typography>
          <Typography sx={{ fontSize: 13.5, lineHeight: 1.55, color: 'text.disabled', mt: 1 }}>
            Sem nenhuma {historyLabel}, o registro é eliminado do sistema. Havendo histórico, os
            dados pessoais são anonimizados e as negociações e pedidos são preservados, como exige a
            obrigação fiscal.
          </Typography>
          {showWarning && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <b>⚠️ Atenção:</b> Este {subject} não tem histórico comercial e será{' '}
              <b>removido permanentemente</b> do sistema.
            </Alert>
          )}
          <TextField
            label="Registro do pedido"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex.: solicitação por WhatsApp em 07/08/2026"
            slotProps={{ htmlInput: { maxLength: 500 } }}
            autoFocus
            fullWidth
            sx={{ mt: 2 }}
          />
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
