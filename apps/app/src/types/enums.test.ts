import { describe, expect, it } from 'vitest'
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from './enums'

describe('ORDER_STATUS_LABELS', () => {
  it('exibe EM_NEGOCIACAO como "Aguardando Pagamento" (RN9/D8)', () => {
    expect(ORDER_STATUS_LABELS.EM_NEGOCIACAO).toBe('Aguardando Pagamento')
  })

  it('mantém o valor do enum EM_NEGOCIACAO — só o rótulo muda', () => {
    expect(ORDER_STATUSES).toContain('EM_NEGOCIACAO')
  })
})
