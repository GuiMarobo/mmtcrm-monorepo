import { ApiError, productsApi } from '../../api'
import type { Product, ProductDetail } from '../../types'

export type BatchAction = 'discontinue' | 'reactivate' | 'delete'

export type BatchOutcome = 'succeeded' | 'skipped' | 'failed' | 'notRun'

export type BatchResult<T, V> =
  | { item: T; outcome: 'succeeded'; value: V }
  | { item: T; outcome: 'skipped' | 'failed' | 'notRun' }

const SKIPPED_STATUS: Record<BatchAction, number> = {
  discontinue: 409,
  reactivate: 409,
  delete: 404,
}

const interruptsBatch = (error: unknown) =>
  !(error instanceof ApiError) || error.status === 401

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
  for (const [index, item] of items.entries()) {
    try {
      results.push({ item, outcome: 'succeeded', value: await call(item) })
    } catch (error) {
      results.push({ item, outcome: outcomeOfError(action, error) })
      if (interruptsBatch(error)) {
        for (const rest of items.slice(index + 1)) results.push({ item: rest, outcome: 'notRun' })
        break
      }
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
  const notRun = count('notRun')
  const words = SUMMARY_WORDS[action]
  const parts = [
    succeeded > 0 && `${succeeded} ${plural(succeeded, words.done)}`,
    skipped > 0 &&
      `${skipped} ${plural(skipped, ['ignorado', 'ignorados'])} (já ${plural(skipped, words.already)})`,
    failed > 0 && `${failed} ${plural(failed, ['falhou', 'falharam'])}`,
    notRun > 0 && `${notRun} ${plural(notRun, ['não executado', 'não executados'])}`,
  ].filter((part): part is string => typeof part === 'string')
  return { message: parts.join(' · '), type: failed > 0 ? 'error' : 'success' }
}

export interface ProductsBatchEffects {
  applyDetail: (updated: ProductDetail) => void
  drop: (ids: Set<string>) => void
  reload: () => Promise<void>
  toast: (message: string, type: 'success' | 'error') => void
}

async function executeProductsBatch(
  action: BatchAction,
  products: Product[],
  effects: ProductsBatchEffects,
): Promise<{ outcome: BatchOutcome }[]> {
  if (action === 'delete') {
    const results = await runBatch(action, products, (product) => productsApi.remove(product.id))
    effects.drop(
      new Set(
        results
          .filter((result) => result.outcome === 'succeeded' || result.outcome === 'skipped')
          .map((result) => result.item.id),
      ),
    )
    return results
  }
  const results = await runBatch(action, products, (product) =>
    action === 'discontinue'
      ? productsApi.discontinue(product.id)
      : productsApi.reactivate(product.id),
  )
  for (const result of results) {
    if (result.outcome === 'succeeded') effects.applyDetail(result.value)
  }
  if (results.some((result) => result.outcome === 'skipped')) await effects.reload()
  return results
}

export async function runProductsBatch(
  action: BatchAction,
  products: Product[],
  effects: ProductsBatchEffects,
): Promise<void> {
  try {
    const summary = summarizeBatch(action, await executeProductsBatch(action, products, effects))
    effects.toast(summary.message, summary.type)
  } catch {
    effects.toast('Não foi possível concluir as ações em massa.', 'error')
  }
}
