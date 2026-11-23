import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api'
import { runBatch, runProductsBatch, summarizeBatch } from './productsBatch'
import type { BatchAction, BatchOutcome } from './productsBatch'
import type { Product } from '../../types'

const item = (id: string) => ({ id })

describe('runBatch', () => {
  it.each([
    ['discontinue', 'ok', 'succeeded'],
    ['discontinue', 409, 'skipped'],
    ['discontinue', 404, 'failed'],
    ['reactivate', 'ok', 'succeeded'],
    ['reactivate', 409, 'skipped'],
    ['reactivate', 500, 'failed'],
    ['delete', 'ok', 'succeeded'],
    ['delete', 404, 'skipped'],
    ['delete', 409, 'failed'],
    ['delete', 'network', 'failed'],
  ] as const)('%s com resposta %s → %s', async (action, response, outcome) => {
    const results = await runBatch(action as BatchAction, [item('a')], async () => {
      if (response === 'ok') return 'feito'
      if (response === 'network') throw new TypeError('Failed to fetch')
      throw new ApiError(response, 'erro')
    })

    expect(results).toEqual([
      expect.objectContaining({ item: { id: 'a' }, outcome }),
    ])
  })

  it('executa item a item, um depois do outro, e devolve o resultado de cada um', async () => {
    const started: string[] = []
    let running = 0
    const results = await runBatch('discontinue', [item('a'), item('b'), item('c')], async ({ id }) => {
      running += 1
      started.push(`${id}:${running}`)
      await Promise.resolve()
      running -= 1
      if (id === 'b') throw new ApiError(409, 'já inativo')
      return `${id}-novo`
    })

    expect(started).toEqual(['a:1', 'b:1', 'c:1'])
    expect(results).toEqual([
      { item: { id: 'a' }, outcome: 'succeeded', value: 'a-novo' },
      { item: { id: 'b' }, outcome: 'skipped' },
      { item: { id: 'c' }, outcome: 'succeeded', value: 'c-novo' },
    ])
  })

  it.each([
    ['sessão expirada (401)', () => new ApiError(401, 'sessão expirada')],
    ['queda de rede', () => new TypeError('Failed to fetch')],
  ])('%s interrompe o lote: o resto não é executado', async (_, error) => {
    const call = vi.fn(async ({ id }: { id: string }) => {
      if (id === 'b') throw error()
      return id
    })

    const results = await runBatch('delete', [item('a'), item('b'), item('c'), item('d')], call)

    expect(call).toHaveBeenCalledTimes(2)
    expect(results).toEqual([
      { item: { id: 'a' }, outcome: 'succeeded', value: 'a' },
      { item: { id: 'b' }, outcome: 'failed' },
      { item: { id: 'c' }, outcome: 'notRun' },
      { item: { id: 'd' }, outcome: 'notRun' },
    ])
  })
})

const outcomes = (succeeded: number, skipped: number, failed: number, notRun = 0) =>
  [
    ...Array<BatchOutcome>(succeeded).fill('succeeded'),
    ...Array<BatchOutcome>(skipped).fill('skipped'),
    ...Array<BatchOutcome>(failed).fill('failed'),
    ...Array<BatchOutcome>(notRun).fill('notRun'),
  ].map((outcome) => ({ outcome }))

describe('summarizeBatch', () => {
  it.each([
    ['discontinue', [3, 1, 1, 0], '3 descontinuados · 1 ignorado (já inativo) · 1 falhou', 'error'],
    ['discontinue', [1, 2, 0, 0], '1 descontinuado · 2 ignorados (já inativos)', 'success'],
    ['reactivate', [2, 0, 0, 0], '2 reativados', 'success'],
    ['reactivate', [0, 1, 0, 0], '1 ignorado (já ativo)', 'success'],
    ['delete', [1, 1, 0, 0], '1 excluído · 1 ignorado (já excluído)', 'success'],
    ['delete', [0, 0, 2, 0], '2 falharam', 'error'],
    ['delete', [1, 0, 1, 1], '1 excluído · 1 falhou · 1 não executado', 'error'],
    ['discontinue', [0, 0, 1, 3], '1 falhou · 3 não executados', 'error'],
  ] as const)('%s %j → "%s" (%s)', (action, [succeeded, skipped, failed, notRun], message, type) => {
    expect(summarizeBatch(action, outcomes(succeeded, skipped, failed, notRun))).toEqual({ message, type })
  })
})

const productsApiMock = vi.hoisted(() => ({
  remove: vi.fn(),
  discontinue: vi.fn(),
  reactivate: vi.fn(),
}))

vi.mock('../../api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api')>()),
  productsApi: productsApiMock,
}))

describe('runProductsBatch', () => {
  const productItem = (id: string): Product => ({
    id,
    name: `Produto ${id}`,
    sku: id.toUpperCase(),
    description: null,
    category: 'IPHONE',
    price: 100,
    stock: 1,
    status: 'ATIVO',
    createdAt: '2026-09-11T12:00:00Z',
    updatedAt: '2026-09-11T12:00:00Z',
  })
  const effects = () => ({
    applyDetail: vi.fn(),
    drop: vi.fn(),
    reload: vi.fn().mockResolvedValue(undefined),
    toast: vi.fn(),
  })

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it.each([
    ['nenhum ignorado não recarrega', ['ok', 'ok'], 0, '2 descontinuados'],
    ['algum ignorado recarrega a lista', ['ok', 409], 1, '1 descontinuado · 1 ignorado (já inativo)'],
  ] as const)('%s', async (_, responses, reloads, message) => {
    responses.forEach((response) =>
      productsApiMock.discontinue.mockImplementationOnce(async (id: string) => {
        if (response === 409) throw new ApiError(409, 'já inativo')
        return { id, stockMovements: [] }
      }),
    )
    const fx = effects()

    await runProductsBatch('discontinue', [productItem('a'), productItem('b')], fx)

    expect(fx.applyDetail).toHaveBeenCalledWith({ id: 'a', stockMovements: [] })
    expect(fx.reload).toHaveBeenCalledTimes(reloads)
    expect(fx.toast).toHaveBeenCalledWith(message, 'success')
  })

  it('erro fora das chamadas à API vira toast de erro, sem rejeitar', async () => {
    productsApiMock.reactivate.mockResolvedValue({ id: 'a', stockMovements: [] })
    const fx = effects()
    fx.applyDetail.mockImplementation(() => {
      throw new Error('quebrou')
    })

    await expect(runProductsBatch('reactivate', [productItem('a')], fx)).resolves.toBeUndefined()
    expect(fx.toast).toHaveBeenCalledWith('Não foi possível concluir as ações em massa.', 'error')
  })
})
