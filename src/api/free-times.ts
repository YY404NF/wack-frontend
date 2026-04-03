import { request } from './client'
import { apiPaths } from './paths'
import type { FreeTimeEditorItem, FreeTimeInput, FreeTimeItem, FreeTimeQuery, PageResult } from './types'

export const freeTimesApi = {
  adminFreeTimeCalendar(term = '', weekNo?: number) {
    const params = new URLSearchParams()
    if (term.trim()) params.set('term', term.trim())
    if (typeof weekNo === 'number' && weekNo > 0) params.set('week_no', String(weekNo))
    const suffix = params.toString() ? `?${params.toString()}` : ''
    return request<FreeTimeItem[] | null>(`${apiPaths.admin.freeTimeCalendar}${suffix}`)
  },
  listFreeTimes(query: FreeTimeQuery = {}) {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.page_size ?? 50))
    if (query.term) params.set('term', query.term)
    if (query.login_id) params.set('login_id', query.login_id)
    return request<PageResult<FreeTimeItem>>(`${apiPaths.shared.freeTimes}?${params.toString()}`)
  },
  listFreeTimeEditor(query: { term: string; login_id?: string }) {
    const params = new URLSearchParams()
    params.set('term', query.term.trim())
    if (query.login_id?.trim()) params.set('login_id', query.login_id.trim())
    return request<FreeTimeEditorItem[] | null>(`${apiPaths.shared.freeTimeEditor}?${params.toString()}`).then((items) => items ?? [])
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
