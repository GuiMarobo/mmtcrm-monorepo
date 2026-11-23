import { ApiError } from '../../api'

export type BatchAction = 'discontinue' | 'reactivate' | 'delete'

export type BatchOutcome = 'succeeded' | 'skipped' | 'failed'

export type BatchResult<T, V> =
  | { item: T; outcome: 'succeeded'; value: V }
  | { item: T; outcome: 'skipped' | 'failed' }

const SKIPPED_STATUS: Record<BatchAction, number> = {
  discontinue: 409,
  reactivate: 409,
  delete: 404,
}

function outcomeOfError(action: BatchAction, error: unknown): 'skipped' | 'failed' {
  return error instanceof ApiError && error.status === SKIPPED_STATUS[action]
    ? 'skipped'
    : 'failed'
}

export async function runBatch<T, V>(
  action: BatchAction,
  items: T[],
  call: (item: T) => Promise<V>,
): Promise<BatchResult<T, V>[]> {
  const results: BatchResult<T, V>[] = []
  for (const item of items) {
    try {
      results.push({ item, outcome: 'succeeded', value: await call(item) })
    } catch (error) {
      results.push({ item, outcome: outcomeOfError(action, error) })
    }
  }
  return results
}

const SUMMARY_WORDS: Record<BatchAction, { done: [string, string]; already: [string, string] }> = {
  discontinue: { done: ['descontinuado', 'descontinuados'], already: ['inativo', 'inativos'] },
  reactivate: { done: ['reativado', 'reativados'], already: ['ativo', 'ativos'] },
  delete: { done: ['excluído', 'excluídos'], already: ['excluído', 'excluídos'] },
}

const plural = (count: number, [one, many]: [string, string]) => (count === 1 ? one : many)

export function summarizeBatch(
  action: BatchAction,
  results: { outcome: BatchOutcome }[],
): { message: string; type: 'success' | 'error' } {
  const count = (outcome: BatchOutcome) =>
    results.filter((result) => result.outcome === outcome).length
  const succeeded = count('succeeded')
  const skipped = count('skipped')
  const failed = count('failed')
  const words = SUMMARY_WORDS[action]
  const parts = [
    succeeded > 0 && `${succeeded} ${plural(succeeded, words.done)}`,
    skipped > 0 &&
      `${skipped} ${plural(skipped, ['ignorado', 'ignorados'])} (já ${plural(skipped, words.already)})`,
    failed > 0 && `${failed} ${plural(failed, ['falhou', 'falharam'])}`,
  ].filter((part): part is string => typeof part === 'string')
  return { message: parts.join(' · '), type: failed > 0 ? 'error' : 'success' }
}
