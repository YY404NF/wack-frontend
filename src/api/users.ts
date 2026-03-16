import { request } from './client'
import type { PageResult, UserItem, UserPageQuery } from './types'

export const usersApi = {
  listUsers(query: UserPageQuery = {}) {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.page_size ?? 10))
    if (query.role) params.set('role', query.role)
    if (query.status) params.set('status', query.status)
    if (query.keyword) params.set('keyword', query.keyword)
    return request<PageResult<UserItem>>(`/users?${params.toString()}`)
  },
  createUser(input: { student_id: string; real_name: string; password: string; role: number; status: number }) {
    return request<UserItem>('/users', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  updateUser(
    studentId: string,
    input: {
      student_id: string
      real_name: string
      role: number
      status: number
    },
  ) {
    return request<UserItem>('/users/' + studentId, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  },
  updateUserStatus(studentId: string, status: number) {
    return request<Record<string, never>>(`/users/${studentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
  resetUserPassword(studentId: string, newPassword: string) {
    return request<Record<string, never>>(`/users/${studentId}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ new_password: newPassword }),
    })
  },
}
