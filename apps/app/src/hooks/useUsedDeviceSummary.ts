import { useCallback, useEffect, useRef, useState } from 'react'
import { usedDevicesApi } from '../api'
import type { UsedDeviceSummary } from '../types'

export function useUsedDeviceSummary() {
  const [summary, setSummary] = useState<UsedDeviceSummary | null>(null)
  const latest = useRef(0)

  const reload = useCallback(async () => {
    const request = ++latest.current
    try {
      const result = await usedDevicesApi.summary()
      if (request === latest.current) setSummary(result)
    } catch {
      if (request === latest.current) setSummary(null)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { summary, reload }
}
