import { request } from './client'
import { apiPaths } from './paths'
import type { LoginData, SessionUser, SetupStatus } from './types'

export const authApi = {
  setupStatus() {
    return request<SetupStatus>(apiPaths.auth.setupStatus)
  },
  initializeSystem(input: { login_id: string; real_name: string; password: string }) {
    return request<{ initialized: boolean }>(apiPaths.auth.initializeSystem, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  login(studentId: string, password: string) {
    return request<LoginData>(apiPaths.auth.login, {
      method: 'POST',
      body: JSON.stringify({ login_id: studentId, password }),
    })
  },
  me() {
    return request<SessionUser>(apiPaths.auth.me)
  },
  logout() {
    return request<Record<string, never>>(apiPaths.auth.logout, {
      method: 'POST',
      body: JSON.stringify({}),
    })
  },
  changePassword(oldPassword: string, newPassword: string) {
    return request<Record<string, never>>(apiPaths.auth.changePassword, {
      method: 'POST',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    })
  },
  updateProfile(input: { login_id: string; real_name: string }) {
    return request<SessionUser>(apiPaths.auth.updateProfile, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  },
}
