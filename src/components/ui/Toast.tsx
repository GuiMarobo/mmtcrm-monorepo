import { I } from '../../icons'

export function Toast({ message }: { message: string }) {
  return (
    <div className="toast">
      {I.check}
      <span>{message}</span>
    </div>
  )
}
