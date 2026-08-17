import { useCallback, useRef, useState } from 'react'

export type ToastType = 'success' | 'error'

export interface ToastState {
  text: string
  type: ToastType
}

export function useToast(duration = 2800) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const show = useCallback(
    (text: string, type: ToastType = 'success') => {
      setToast({ text, type })
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setToast(null), duration)
    },
    [duration],
  )

  return { toast, show }
}
