import { request } from './client'
import type { FreeTimeInput, FreeTimeItem, PageResult } from './types'

export const freeTimesApi = {
  adminFreeTimeCalendar() {
    return request<FreeTimeItem[] | null>('/admin/free-time-calendar')
  },
  listFreeTimes() {
    return request<PageResult<FreeTimeItem>>('/free-times?page=1&page_size=50')
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
