import { useCallback, useRef, useState } from 'react'
import { ApiError, quotationsApi } from '../api'
import type { QuotationDetail } from '../types'

export function useQuotationDetail() {
  const [openId, setOpenId] = useState<number | null>(null)
  const [quotation, setQuotation] = useState<QuotationDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const latest = useRef(0)

  const open = useCallback(async (id: number) => {
    const request = ++latest.current
    setOpenId(id)
    setQuotation(null)
    setError(null)
    try {
      const detail = await quotationsApi.findOne(id)
      if (request === latest.current) setQuotation(detail)
    } catch (err) {
      if (request !== latest.current) return
      setError(err instanceof ApiError ? err.message : 'Falha ao carregar o orçamento.')
    }
  }, [])

  const close = useCallback(() => {
    latest.current++
    setOpenId(null)
    setQuotation(null)
    setError(null)
  }, [])

  return { openId, quotation, error, open, close }
}
