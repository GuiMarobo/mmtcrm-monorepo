import type { Role, UserStatus } from './enums'

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  role: Role
  status: UserStatus
  mustChangePassword: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  phone?: string | null
  role?: Role
  status?: UserStatus
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  password?: string
  phone?: string | null
  role?: Role
  status?: UserStatus
}
