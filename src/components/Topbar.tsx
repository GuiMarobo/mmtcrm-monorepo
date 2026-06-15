import type { AuthUser } from '../types'

interface TopbarProps {
  user: AuthUser
}

export function Topbar({ user }: TopbarProps) {
  return (
    <div className="topbar">
      <div className="topbar-actions">
        <span style={{ fontWeight: 600, fontSize: 14 }} title={user.email}>
          {user.name}
        </span>
      </div>
    </div>
  )
}
