import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'
import { ApiError, settingsApi } from '../api'
import { PageHeader } from '../components/common/PageHeader'
import { ErrorBanner, SectionCard } from '../components/common/SectionCard'
import { CompanySettingsForm } from '../components/settings/CompanySettingsForm'
import { InstallmentRatesForm } from '../components/settings/InstallmentRatesForm'
import type {
  ReplaceCompanySettingsPayload,
  ReplaceInstallmentRatesPayload,
  Settings,
} from '../types'

interface ConfiguracoesProps {
  toast: (msg: string, type?: 'success' | 'error') => void
}

export function Configuracoes({ toast }: ConfiguracoesProps) {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const reload = async () => {
    setLoadError(null)
    try {
      setSettings(await settingsApi.find())
    } catch (err) {
      setLoadError(
        err instanceof ApiError ? err.message : 'Falha ao carregar as configurações.',
      )
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const saveCompany = async (payload: ReplaceCompanySettingsPayload) => {
    try {
      setSettings(await settingsApi.updateCompany(payload))
      toast('Dados da loja salvos')
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erro ao salvar os dados da loja', 'error')
    }
  }

  const saveRates = async (payload: ReplaceInstallmentRatesPayload) => {
    try {
      setSettings(await settingsApi.replaceInstallmentRates(payload))
      toast('Taxas de parcelamento salvas')
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erro ao salvar as taxas', 'error')
    }
  }

  return (
    <Box>
      <PageHeader
        title="Configurações"
        subtitle="Dados da loja, validade padrão e taxas usadas nos Orçamentos."
      />

      {loadError ? (
        <SectionCard>
          <ErrorBanner message={loadError} onRetry={() => void reload()} />
        </SectionCard>
      ) : !settings ? (
        <Typography sx={{ p: 6, textAlign: 'center', color: 'text.disabled', fontSize: 13 }}>
          Carregando…
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <CompanySettingsForm company={settings.company} onSave={saveCompany} />
          <InstallmentRatesForm rates={settings.installmentRates} onSave={saveRates} />
        </Box>
      )}
    </Box>
  )
}
