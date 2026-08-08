import { http } from './http'
import type { CreateUserPayload, EraseResult, UpdateUserPayload, User } from '../types'

export const usersApi = {
  list(): Promise<User[]> {
    return http.get<User[]>('/users')
  },

  findOne(id: number): Promise<User> {
    return http.get<User>(`/users/${id}`)
  },

  create(payload: CreateUserPayload): Promise<User> {
    return http.post<User>('/users', payload)
  },

  update(id: number, payload: UpdateUserPayload): Promise<User> {
    return http.patch<User>(`/users/${id}`, payload)
  },

  remove(id: number): Promise<User> {
    return http.delete<User>(`/users/${id}`)
  },

  erase(id: number, reason: string): Promise<EraseResult> {
    return http.post<EraseResult>(`/users/${id}/erase`, { reason })
  },

  activate(id: number): Promise<User> {
    return http.patch<User>(`/users/${id}/activate`)
  },

  deactivate(id: number): Promise<User> {
    return http.patch<User>(`/users/${id}/deactivate`)
  },

  changePassword(id: number, newPassword: string): Promise<User> {
    return http.patch<User>(`/users/${id}/change-password`, { newPassword })
  },
}
