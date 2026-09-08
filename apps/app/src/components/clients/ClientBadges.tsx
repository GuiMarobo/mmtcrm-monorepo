import { ToneChip } from '../common/ToneChip'
import type { BadgeTone } from '../../theme/tones'
import type { ClientStatus, LeadQualification } from '../../types'
import { CLIENT_STATUS_LABELS, LEAD_QUALIFICATION_LABELS } from '../../types'

const STATUS_TONE: Record<ClientStatus, BadgeTone> = {
  LEAD: 'blue',
  ATIVO: 'green',
  INATIVO: 'gray',
}

const QUALIFICATION_TONE: Record<LeadQualification, BadgeTone> = {
  ALTA_INTENCAO: 'purple',
  QUALIFICADO: 'amber',
  NAO_QUALIFICADO: 'gray',
}

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return (
    <ToneChip tone={STATUS_TONE[status]} dot>
      {CLIENT_STATUS_LABELS[status]}
    </ToneChip>
  )
}

export function ClientQualificationBadge({ value }: { value: LeadQualification }) {
  return <ToneChip tone={QUALIFICATION_TONE[value]}>{LEAD_QUALIFICATION_LABELS[value]}</ToneChip>
}
