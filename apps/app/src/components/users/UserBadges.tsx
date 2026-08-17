import { Badge } from '../ui'
import type { BadgeTone } from '../ui'
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
    <Badge tone={ROLE_TONE[role]} dot>
      {ROLE_LABELS[role]}
    </Badge>
  )
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <Badge tone={status === 'ATIVO' ? 'green' : 'gray'} dot>
      {USER_STATUS_LABELS[status]}
    </Badge>
  )
}
