import { request } from './client'
import type { FreeTimeInput, FreeTimeItem, FreeTimeQuery, PageResult } from './types'

export const freeTimesApi = {
  adminFreeTimeCalendar() {
    return request<FreeTimeItem[] | null>('/admin/free-time-calendar')
  },
  listFreeTimes(query: FreeTimeQuery = {}) {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.page_size ?? 50))
    if (query.term) params.set('term', query.term)
    if (query.student_id) params.set('student_id', query.student_id)
    return request<PageResult<FreeTimeItem>>(`/free-times?${params.toString()}`)
  },
  createFreeTime(input: FreeTimeInput) {
    return request<FreeTimeItem>('/free-times', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  updateFreeTime(id: number, input: FreeTimeInput) {
    return request<Record<string, never>>(`/free-times/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  },
  deleteFreeTime(id: number) {
    return request<Record<string, never>>(`/free-times/${id}`, {
      method: 'DELETE',
    })
  },
}
