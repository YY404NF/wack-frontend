import { request } from './client'
import { apiPaths } from './paths'
import type { PageResult, UserItem, UserPageQuery } from './types'

export const usersApi = {
  listUsers(query: UserPageQuery & { login_id?: string; real_name?: string; managed_class_name?: string } = {}) {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.page_size ?? 20))
    if (query.role) params.set('role', query.role)
    if (query.status) params.set('status', query.status)
    if (query.keyword) params.set('keyword', query.keyword)
    if (query.login_id?.trim()) params.set('login_id', query.login_id.trim())
    if (query.real_name?.trim()) params.set('real_name', query.real_name.trim())
    if (query.managed_class_name?.trim()) params.set('managed_class_name', query.managed_class_name.trim())
    return request<PageResult<UserItem>>(`${apiPaths.admin.users}?${params.toString()}`)
  },
  createUser(input: { login_id: string; real_name: string; password: string; role: number; status: number; managed_class_id?: number | null }) {
    return request<UserItem>(apiPaths.admin.users, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  updateUser(
    loginId: string,
    input: {
      login_id: string
      real_name: string
      role: number
      status: number
      managed_class_id?: number | null
    },
  ) {
    return request<UserItem>(`${apiPaths.admin.users}/${loginId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  },
  updateUserStatus(loginId: string, status: number) {
    return request<Record<string, never>>(`${apiPaths.admin.users}/${loginId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
  resetUserPassword(loginId: string, newPassword: string) {
    return request<Record<string, never>>(`${apiPaths.admin.users}/${loginId}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ new_password: newPassword }),
    })
  },
}
