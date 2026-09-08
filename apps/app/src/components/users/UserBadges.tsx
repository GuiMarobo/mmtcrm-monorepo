import { ToneChip } from '../common/ToneChip'
import type { BadgeTone } from '../../theme/tones'
import type { Role, UserStatus } from '../../types'
import { ROLE_LABELS, USER_STATUS_LABELS } from '../../types'

const ROLE_TONE: Record<Role, BadgeTone> = {
  ADMIN: 'purple',
  VENDEDOR: 'blue',
  ATENDENTE: 'amber',
  TECNICO: 'green',
}

export function UserRoleBadge({ role }: { role: Role }) {
  return (
    <ToneChip tone={ROLE_TONE[role]} dot>
      {ROLE_LABELS[role]}
    </ToneChip>
  )
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <ToneChip tone={status === 'ATIVO' ? 'green' : 'gray'} dot>
      {USER_STATUS_LABELS[status]}
    </ToneChip>
  )
}
