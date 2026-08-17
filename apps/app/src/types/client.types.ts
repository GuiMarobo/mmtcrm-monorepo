import type { ClientStatus, LeadOrigin, LeadQualification } from './enums'

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
  anonymizedAt: string | null
  negotiationsCount: number
  ordersCount: number
  revenue: number
}

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

export type UpdateClientPayload = Partial<CreateClientPayload>
