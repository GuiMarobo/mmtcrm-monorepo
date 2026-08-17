import type { AuthUser } from '../types'

interface TopbarProps {
  user: AuthUser
  onMenuToggle: () => void
}

export function Topbar({ user, onMenuToggle }: TopbarProps) {
  return (
    <div className="topbar">
      <button className="topbar-menu-btn" onClick={onMenuToggle} aria-label="Abrir menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <div className="topbar-brand">MMT Urbana</div>
      <div className="topbar-actions">
        <span className="topbar-user" title={user.email}>
          {user.name}
        </span>
      </div>
    </div>
  )
}
