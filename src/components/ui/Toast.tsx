import { I } from '../../icons'
import type { ToastType } from '../../hooks/useToast'

export function Toast({ text, type }: { text: string; type: ToastType }) {
  return (
    <div className={`toast toast-${type}`}>
      {type === 'error' ? I.x : I.check}
      <span>{text}</span>
    </div>
  )
}
