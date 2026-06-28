import type { ReactNode } from 'react'
import { I } from '../../icons'
import { Button } from './Button'
import { useClickOutside } from '../../hooks/useClickOutside'

interface FilterPopoverProps {
  open: boolean
  activeCount: number
  onToggle: () => void
  onClose: () => void
  onClear: () => void
  onApply: () => void
  children: ReactNode
}

export function FilterPopover({
  open,
  activeCount,
  onToggle,
  onClose,
  onClear,
  onApply,
  children,
}: FilterPopoverProps) {
  const ref = useClickOutside<HTMLDivElement>(open, onClose)
  return (
    <div className="anchor" ref={ref}>
      <button className="btn" onClick={onToggle}>
        {I.filter}
        <span>Filtros</span>
        {activeCount > 0 && <span className="count-badge">{activeCount}</span>}
      </button>
      {open && (
        <div className="popover">
          {children}
          <div className="popover-actions">
            <Button onClick={onClear}>Limpar</Button>
            <Button variant="primary" onClick={onApply}>
              Aplicar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
