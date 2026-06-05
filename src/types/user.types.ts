/** Tipos do domínio de Usuário, espelhando o que a API expõe. */

import type { Role, UserStatus } from './enums'

/** Usuário retornado pela API (sem o hash de senha). */
export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  role: Role
  status: UserStatus
  createdAt: string
  updatedAt: string
}

/** Payload para `POST /users`. Senha obrigatória. */
export interface CreateUserPayload {
  name: string
  email: string
  password: string
  phone?: string | null
  role?: Role
  status?: UserStatus
}

/** Payload para `PATCH /users/:id`. Todos os campos opcionais. */
export interface UpdateUserPayload {
  name?: string
  email?: string
  password?: string
  phone?: string | null
  role?: Role
  status?: UserStatus
}
