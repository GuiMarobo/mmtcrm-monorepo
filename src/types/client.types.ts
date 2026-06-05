/** Tipos do domínio de Cliente/Lead, espelhando o que a API expõe. */

import type {
  ClientStatus,
  LeadOrigin,
  LeadQualification,
} from './enums'

/** Cliente/Lead retornado pela API. */
export interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  cpf: string | null
  address: string | null
  status: ClientStatus
  qualification: LeadQualification
  origin: LeadOrigin | null
  notes: string | null
  lastContactAt: string | null
  createdAt: string
  updatedAt: string
}

/** Payload para `POST /clients`. */
export interface CreateClientPayload {
  name: string
  email?: string | null
  phone?: string | null
  cpf?: string | null
  address?: string | null
  status?: ClientStatus
  qualification?: LeadQualification
  origin?: LeadOrigin | null
  notes?: string | null
}

/** Payload para `PATCH /clients/:id`. */
export type UpdateClientPayload = Partial<CreateClientPayload>
