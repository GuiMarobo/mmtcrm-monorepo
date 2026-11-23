import { describe, expect, it } from 'vitest'
import { ApiError } from '../../api'
import { runBatch, summarizeBatch } from './productsBatch'
import type { BatchAction, BatchOutcome } from './productsBatch'

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
})

const outcomes = (succeeded: number, skipped: number, failed: number) =>
  [
    ...Array<BatchOutcome>(succeeded).fill('succeeded'),
    ...Array<BatchOutcome>(skipped).fill('skipped'),
    ...Array<BatchOutcome>(failed).fill('failed'),
  ].map((outcome) => ({ outcome }))

describe('summarizeBatch', () => {
  it.each([
    ['discontinue', [3, 1, 1], '3 descontinuados · 1 ignorado (já inativo) · 1 falhou', 'error'],
    ['discontinue', [1, 2, 0], '1 descontinuado · 2 ignorados (já inativos)', 'success'],
    ['reactivate', [2, 0, 0], '2 reativados', 'success'],
    ['reactivate', [0, 1, 0], '1 ignorado (já ativo)', 'success'],
    ['delete', [1, 1, 0], '1 excluído · 1 ignorado (já excluído)', 'success'],
    ['delete', [0, 0, 2], '2 falharam', 'error'],
  ] as const)('%s %j → "%s" (%s)', (action, [succeeded, skipped, failed], message, type) => {
    expect(summarizeBatch(action, outcomes(succeeded, skipped, failed))).toEqual({ message, type })
  })
})
