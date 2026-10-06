import { useCallback, useRef, useState } from 'react'
import { ApiError, quotationsApi } from '../api'
import type { IssueQuotationPayload, Quotation } from '../types'

export function useNegotiationQuotations() {
  const [quotations, setQuotations] = useState<Quotation[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const latest = useRef(0)

  const load = useCallback(async (negotiationId: number) => {
    const request = ++latest.current
    setQuotations(null)
    setError(null)
    try {
      const list = await quotationsApi.listByNegotiation(negotiationId)
      if (request === latest.current) setQuotations(list)
    } catch (err) {
      if (request !== latest.current) return
      setError(err instanceof ApiError ? err.message : 'Falha ao carregar os orçamentos.')
    }
  }, [])

  const issue = useCallback(async (negotiationId: number, payload: IssueQuotationPayload) => {
    const issued = await quotationsApi.issue(negotiationId, payload)
    setQuotations((prev) => [issued, ...(prev ?? [])])
    return issued
  }, [])

  return { quotations, error, load, issue }
}
