import type { User } from './user.types'

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  user: User
}

export type AuthUser = User
