import { request } from './client'
import { apiPaths } from './paths'
import type { FreeTimeInput, FreeTimeItem, FreeTimeQuery, PageResult } from './types'

export const freeTimesApi = {
  adminFreeTimeCalendar() {
    return request<FreeTimeItem[] | null>(apiPaths.admin.freeTimeCalendar)
  },
  listFreeTimes(query: FreeTimeQuery = {}) {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.page_size ?? 50))
    if (query.term) params.set('term', query.term)
    if (query.login_id) params.set('login_id', query.login_id)
    return request<PageResult<FreeTimeItem>>(`${apiPaths.shared.freeTimes}?${params.toString()}`)
  },
  async listAllFreeTimes(query: Omit<FreeTimeQuery, 'page' | 'page_size'> = {}) {
    const pageSize = 100
    let page = 1
    let total = 0
    const items: FreeTimeItem[] = []

    do {
      const result = await this.listFreeTimes({ ...query, page, page_size: pageSize })
      items.push(...(result.items ?? []))
      total = result.total ?? items.length
      page += 1
    } while (items.length < total)

    return items
  },
  createFreeTime(input: FreeTimeInput) {
    return request<FreeTimeItem>(apiPaths.shared.freeTimes, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  updateFreeTime(id: number, input: FreeTimeInput) {
    return request<Record<string, never>>(`${apiPaths.shared.freeTimes}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  },
  deleteFreeTime(id: number) {
    return request<Record<string, never>>(`${apiPaths.shared.freeTimes}/${id}`, {
      method: 'DELETE',
    })
  },
}
