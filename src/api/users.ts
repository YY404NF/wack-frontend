import { request } from './client'
import { apiPaths } from './paths'
import type { PageResult, UserItem, UserPageQuery } from './types'

export const usersApi = {
  listUsers(query: UserPageQuery = {}) {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.page_size ?? 10))
    if (query.role) params.set('role', query.role)
    if (query.status) params.set('status', query.status)
    if (query.keyword) params.set('keyword', query.keyword)
    return request<PageResult<UserItem>>(`${apiPaths.admin.users}?${params.toString()}`)
  },
  async listAllUsers(query: Omit<UserPageQuery, 'page' | 'page_size'> = {}) {
    const pageSize = 100
    let page = 1
    let total = 0
    const items: UserItem[] = []

    do {
      const result = await this.listUsers({ ...query, page, page_size: pageSize })
      items.push(...(result.items ?? []))
      total = result.total ?? items.length
      page += 1
    } while (items.length < total)

    return items
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
