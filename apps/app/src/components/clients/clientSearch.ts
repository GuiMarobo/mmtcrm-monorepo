import { formatDate, maskCpf, maskPhone } from '../../utils/format'
import type { Client } from '../../types'
import {
  CLIENT_STATUS_LABELS,
  LEAD_ORIGIN_LABELS,
  LEAD_QUALIFICATION_LABELS,
} from '../../types'

export const clientSearchValues = (client: Client) => [
  client.name,
  client.email,
  client.cpf,
  client.cpf ? maskCpf(client.cpf) : null,
  client.phone,
  maskPhone(client.phone),
  client.origin ? LEAD_ORIGIN_LABELS[client.origin] : null,
  CLIENT_STATUS_LABELS[client.status],
  LEAD_QUALIFICATION_LABELS[client.qualification],
  client.lastContactAt ? formatDate(client.lastContactAt) : null,
]
