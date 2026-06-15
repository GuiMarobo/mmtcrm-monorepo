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
  children: ReactNode
}

export function FilterPopover({
  open,
  activeCount,
  onToggle,
  onClose,
  onClear,
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
            <Button onClick={onClear} disabled={activeCount === 0}>
              Limpar
            </Button>
            <Button variant="primary" onClick={onClose}>
              Aplicar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
