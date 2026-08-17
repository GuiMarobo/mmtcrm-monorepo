import type { ReactNode } from 'react'
import { I } from '../../icons'
import { useClickOutside } from '../../hooks/useClickOutside'

interface MenuProps {
  open: boolean
  onToggle: () => void
  onClose: () => void
  children: ReactNode
}

export function Menu({ open, onToggle, onClose, children }: MenuProps) {
  const ref = useClickOutside<HTMLDivElement>(open, onClose)
  return (
    <div className="anchor" ref={ref}>
      <button className="row-action" onClick={onToggle} aria-label="Ações">
        {I.more}
      </button>
      {open && <div className="menu right">{children}</div>}
    </div>
  )
}

interface MenuItemProps {
  icon?: ReactNode
  danger?: boolean
  onClick: () => void
  children: ReactNode
}

export function MenuItem({ icon, danger = false, onClick, children }: MenuItemProps) {
  return (
    <button className={danger ? 'menu-item danger' : 'menu-item'} onClick={onClick}>
      {icon && <span className="menu-ico">{icon}</span>}
      <span>{children}</span>
    </button>
  )
}
