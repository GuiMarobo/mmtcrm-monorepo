/** Tipos relacionados a autenticação. */

import type { User } from './user.types'

export interface LoginPayload {
  email: string
  password: string
}

/** Resposta de `POST /auth/login`. */
export interface LoginResponse {
  access_token: string
  user: User
}

/** Usuário autenticado carregado pelo AuthContext. */
export type AuthUser = User
