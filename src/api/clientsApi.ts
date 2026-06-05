import { http } from './http'
import type {
  Client,
  CreateClientPayload,
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

  /**
   * Importa um CSV de clientes.
   * `dryRun = true` → valida sem persistir.
   * `dryRun = false` → executa de fato.
   */
  importCsv(file: File, dryRun: boolean): Promise<ImportReport> {
    const formData = new FormData()
    formData.append('file', file)
    const qs = dryRun ? '?dryRun=true' : ''
    return http.post<ImportReport>(`/clients/import${qs}`, formData)
  },
}
