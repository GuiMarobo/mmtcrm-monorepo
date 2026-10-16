import { formatDate, maskPhone } from '../../utils/format'
import type { User } from '../../types'
import { ROLE_LABELS, USER_STATUS_LABELS } from '../../types'

export const userSearchValues = (user: User) => [
  user.name,
  user.email,
  user.phone,
  maskPhone(user.phone),
  ROLE_LABELS[user.role],
  USER_STATUS_LABELS[user.status],
  formatDate(user.createdAt),
]
