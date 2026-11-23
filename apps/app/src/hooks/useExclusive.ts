import { useRef, useState } from 'react'

export function useExclusive<A extends unknown[]>(task: (...args: A) => Promise<void>) {
  const running = useRef(false)
  const [busy, setBusy] = useState(false)

  const run = async (...args: A) => {
    if (running.current) return
    running.current = true
    setBusy(true)
    try {
      await task(...args)
    } finally {
      running.current = false
      setBusy(false)
    }
  }

  return { busy, run }
}
