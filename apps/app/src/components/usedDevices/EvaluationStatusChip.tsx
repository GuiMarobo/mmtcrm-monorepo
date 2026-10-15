import { ToneChip } from '../common/ToneChip'
import { EVALUATION_STATUS_LABELS } from '../../types'
import type { BadgeTone } from '../../theme/tones'
import type { EvaluationStatus } from '../../types'

const EVALUATION_STATUS_TONES: Record<EvaluationStatus, BadgeTone> = {
  AGUARDANDO: 'amber',
  AVALIADO: 'green',
  RECUSADO: 'red',
}

export function EvaluationStatusChip({ status }: { status: EvaluationStatus }) {
  return <ToneChip tone={EVALUATION_STATUS_TONES[status]}>{EVALUATION_STATUS_LABELS[status]}</ToneChip>
}
