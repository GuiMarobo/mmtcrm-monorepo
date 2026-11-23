import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useExclusive } from './useExclusive'

describe('useExclusive', () => {
  it('ignora novas chamadas enquanto a anterior não termina, e libera depois', async () => {
    let finish: () => void = () => undefined
    const task = vi.fn(
      (_: string) =>
        new Promise<void>((resolve) => {
          finish = resolve
        }),
    )
    const { result } = renderHook(() => useExclusive(task))

    act(() => {
      void result.current.run('a')
      void result.current.run('b')
    })
    expect(task.mock.calls).toEqual([['a']])
    expect(result.current.busy).toBe(true)

    await act(async () => finish())
    expect(result.current.busy).toBe(false)

    act(() => {
      void result.current.run('c')
    })
    expect(task.mock.calls).toEqual([['a'], ['c']])
  })
})
