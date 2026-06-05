/* MMT Urbana CRM — Top bar */

import { displayProfile } from '../utils/avatar'
import type { AuthUser } from '../types'

interface TopbarProps {
  user: AuthUser
}

export function Topbar({ user }: TopbarProps) {
  const profile = displayProfile(user.name, user.id)
  return (
    <div className="topbar">
      <div style={{ marginLeft: 'auto' }}>
        <div
          className="avatar"
          title={`${user.name} · ${user.email}`}
          style={{ background: profile.color, color: '#fff' }}
        >
          {profile.initials}
        </div>
      </div>
    </div>
  )
}
