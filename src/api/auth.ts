import { request } from './client'
import type { LoginData, SessionUser, SetupStatus } from './types'

export const authApi = {
  setupStatus() {
    return request<SetupStatus>('/setup/status')
  },
  initializeSystem(input: { student_id: string; real_name: string; password: string }) {
    return request<{ initialized: boolean }>('/setup/initialize', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  login(studentId: string, password: string) {
    return request<LoginData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, password }),
    })
  },
  me() {
    return request<SessionUser>('/auth/me')
  },
  changePassword(oldPassword: string, newPassword: string) {
    return request<Record<string, never>>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    })
  },
  updateProfile(input: { student_id: string; real_name: string }) {
    return request<SessionUser>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  },
}
