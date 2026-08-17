import { http } from './http'
import type {
  Client,
  CreateClientPayload,
  EraseResult,
  ImportReport,
  LeadQualification,
  UpdateClientPayload,
} from '../types'

export const clientsApi = {
  list(): Promise<Client[]> {
    return http.get<Client[]>('/clients')
  },

  findOne(id: string): Promise<Client> {
    return http.get<Client>(`/clients/${id}`)
  },

  isLead(id: string): Promise<{ isLead: boolean }> {
    return http.get<{ isLead: boolean }>(`/clients/${id}/is-lead`)
  },

  create(payload: CreateClientPayload): Promise<Client> {
    return http.post<Client>('/clients', payload)
  },

  update(id: string, payload: UpdateClientPayload): Promise<Client> {
    return http.patch<Client>(`/clients/${id}`, payload)
  },

  remove(id: string): Promise<Client> {
    return http.delete<Client>(`/clients/${id}`)
  },

  erase(id: string, reason: string): Promise<EraseResult> {
    return http.post<EraseResult>(`/clients/${id}/erase`, { reason })
  },

  qualify(id: string, qualification: LeadQualification): Promise<Client> {
    return http.patch<Client>(`/clients/${id}/qualify`, { qualification })
  },

  registerContact(id: string): Promise<Client> {
    return http.patch<Client>(`/clients/${id}/contact`)
  },

  activate(id: string): Promise<Client> {
    return http.patch<Client>(`/clients/${id}/activate`)
  },

  deactivate(id: string): Promise<Client> {
    return http.patch<Client>(`/clients/${id}/deactivate`)
  },

  importCsv(file: File, dryRun: boolean): Promise<ImportReport> {
    const formData = new FormData()
    formData.append('file', file)
    const qs = dryRun ? '?dryRun=true' : ''
    return http.post<ImportReport>(`/clients/import${qs}`, formData)
  },
}
