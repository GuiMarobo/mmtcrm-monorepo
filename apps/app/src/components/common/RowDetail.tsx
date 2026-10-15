import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Skeleton from '@mui/material/Skeleton'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ApiError } from '../../api'

export type RowDetailState<D> =
  | { status: 'loading' }
  | { status: 'ready'; data: D }
  | { status: 'error'; message: string }

interface DetailStore<K, D> {
  key: unknown
  map: ReadonlyMap<K, RowDetailState<D>>
}

export function useRowDetails<K, D>(
  load: (id: K) => Promise<D>,
  resetKey: unknown,
  fallbackError: string,
) {
  const [store, setStore] = useState<DetailStore<K, D>>({ key: resetKey, map: new Map() })
  const current = store.key === resetKey ? store.map : undefined

  const request = (id: K) => {
    const key = resetKey
    setStore((prev) => ({
      key,
      map: new Map(prev.key === key ? prev.map : []).set(id, { status: 'loading' }),
    }))
    const settle = (state: RowDetailState<D>) =>
      setStore((prev) =>
        prev.key === key ? { key, map: new Map(prev.map).set(id, state) } : prev,
      )
    load(id).then(
      (data) => settle({ status: 'ready', data }),
      (err: unknown) =>
        settle({
          status: 'error',
          message: err instanceof ApiError ? err.message : fallbackError,
        }),
    )
  }

  return {
    get: (id: K) => current?.get(id),
    request,
  }
}

interface RowDetailProps<D> {
  state: RowDetailState<D> | undefined
  onRequest: () => void
  children: (data: D) => ReactNode
}

export function RowDetail<D>({ state, onRequest, children }: RowDetailProps<D>) {
  useEffect(() => {
    if (!state) onRequest()
  }, [state, onRequest])

  if (!state || state.status === 'loading') {
    return (
      <Box sx={{ display: 'grid', gap: 1 }} aria-busy="true">
        <Skeleton />
        <Skeleton />
        <Skeleton width="60%" />
      </Box>
    )
  }

  if (state.status === 'error') {
    return (
      <Alert
        severity="error"
        action={
          <Button size="small" color="inherit" onClick={onRequest}>
            Tentar novamente
          </Button>
        }
      >
        {state.message}
      </Alert>
    )
  }

  return <>{children(state.data)}</>
}
