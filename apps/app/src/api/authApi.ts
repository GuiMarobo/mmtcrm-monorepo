import { http } from './http'
import type { LoginPayload, LoginResponse } from '../types'

export const authApi = {
  login(payload: LoginPayload): Promise<LoginResponse> {
    return http.post<LoginResponse>('/auth/login', payload, { skipAuth: true })
  },

  changePassword(currentPassword: string, newPassword: string): Promise<LoginResponse> {
    return http.patch<LoginResponse>('/auth/change-password', { currentPassword, newPassword })
  },
}
