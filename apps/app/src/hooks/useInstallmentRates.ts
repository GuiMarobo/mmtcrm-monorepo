import { useCallback, useRef, useState } from 'react'
import { ApiError, settingsApi } from '../api'
import type { InstallmentRate } from '../types'

export function useInstallmentRates() {
  const [rates, setRates] = useState<InstallmentRate[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const latest = useRef(0)

  const load = useCallback(async () => {
    const request = ++latest.current
    setRates(null)
    setError(null)
    try {
      const settings = await settingsApi.find()
      if (request === latest.current) setRates(settings.installmentRates)
    } catch (err) {
      if (request !== latest.current) return
      setError(
        err instanceof ApiError ? err.message : 'Falha ao carregar as taxas de parcelamento.',
      )
    }
  }, [])

  return { rates, error, load }
}
