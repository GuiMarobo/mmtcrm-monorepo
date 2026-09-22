export interface CompanySettings {
  name: string
  cnpj: string | null
  address: string | null
  phone: string | null
  defaultValidityDays: number
}

export interface InstallmentRate {
  installments: number
  ratePercent: number
}

export interface Settings {
  company: CompanySettings
  installmentRates: InstallmentRate[]
}

export type ReplaceCompanySettingsPayload = CompanySettings

export interface ReplaceInstallmentRatesPayload {
  rates: InstallmentRate[]
}
