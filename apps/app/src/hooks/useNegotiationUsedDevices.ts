import { useCallback, useRef, useState } from 'react'
import { ApiError, usedDevicesApi } from '../api'
import type { NegotiationTradeIn } from '../components/negotiations/NegotiationTradeInTab'
import type { UsedDevice } from '../types'

type Toast = (msg: string, type?: 'success' | 'error') => void

export function useNegotiationUsedDevices(toast: Toast) {
  const [devices, setDevices] = useState<UsedDevice[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const latest = useRef(0)

  const load = useCallback(async (negotiationId: number) => {
    const request = ++latest.current
    setDevices(null)
    setError(null)
    try {
      const result = await usedDevicesApi.listByNegotiation(negotiationId)
      if (request === latest.current) setDevices(result.devices)
    } catch (err) {
      if (request !== latest.current) return
      setError(err instanceof ApiError ? err.message : 'Falha ao carregar os aparelhos na troca.')
    }
  }, [])

  const withToast = async <T,>(action: () => Promise<T>, success: string, failure: string) => {
    try {
      const result = await action()
      toast(success)
      return result
    } catch (err) {
      toast(err instanceof ApiError ? err.message : failure, 'error')
      throw err
    }
  }

  const tradeInFor = (negotiationId: number): NegotiationTradeIn => ({
    devices,
    error,
    onCreate: (payload) =>
      withToast(
        async () => {
          const created = await usedDevicesApi.create(negotiationId, payload)
          setDevices((prev) => [...(prev ?? []), created])
          return created
        },
        'Aparelho cadastrado na troca',
        'Não foi possível cadastrar o aparelho.',
      ),
    onUpdate: (id, payload) =>
      withToast(
        async () => {
          const updated = await usedDevicesApi.update(id, payload)
          setDevices((prev) => prev?.map((device) => (device.id === id ? updated : device)) ?? null)
          return updated
        },
        'Aparelho corrigido',
        'Não foi possível corrigir o aparelho.',
      ),
    onRemove: (id) =>
      withToast(
        async () => {
          const removed = await usedDevicesApi.remove(id)
          setDevices((prev) => prev?.filter((device) => device.id !== id) ?? null)
          return removed
        },
        'Aparelho removido da troca',
        'Não foi possível remover o aparelho.',
      ),
  })

  return { load, tradeInFor }
}
