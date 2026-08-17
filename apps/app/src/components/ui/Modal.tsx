import type { ReactNode } from 'react'
import { I } from '../../icons'

interface ModalProps {
  title: ReactNode
  subtitle?: ReactNode
  onClose: () => void
  width?: number
  children: ReactNode
  footer?: ReactNode
  closeOnBackdrop?: boolean
}

export function Modal({
  title,
  subtitle,
  onClose,
  width = 560,
  children,
  footer,
  closeOnBackdrop = true,
}: ModalProps) {
  return (
    <div className="modal-scrim" onClick={closeOnBackdrop ? onClose : undefined}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width }}>
        <div className="modal-head">
          <div className="modal-titles">
            <div className="modal-title">{title}</div>
            {subtitle && <div className="modal-sub">{subtitle}</div>}
          </div>
          <button className="row-action" onClick={onClose} aria-label="Fechar">
            {I.x}
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}
