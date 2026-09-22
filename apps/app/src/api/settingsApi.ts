import { http } from './http'
import type {
  ReplaceCompanySettingsPayload,
  ReplaceInstallmentRatesPayload,
  Settings,
} from '../types'

export const settingsApi = {
  find(): Promise<Settings> {
    return http.get<Settings>('/settings')
  },

  updateCompany(payload: ReplaceCompanySettingsPayload): Promise<Settings> {
    return http.put<Settings>('/settings/company', payload)
  },

  replaceInstallmentRates(
    payload: ReplaceInstallmentRatesPayload,
  ): Promise<Settings> {
    return http.put<Settings>('/settings/installment-rates', payload)
  },
}
