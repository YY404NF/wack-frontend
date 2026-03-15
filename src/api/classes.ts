import { request } from './client'
import type { ClassItem, PageResult } from './types'

export const classesApi = {
  listClasses() {
    return request<PageResult<ClassItem>>('/classes?page=1&page_size=200')
  },
  createClass(input: { class_name: string; grade: number; major_name: string }) {
    return request<ClassItem>('/classes', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  updateClass(id: number, input: { class_name: string; grade: number; major_name: string }) {
    return request<ClassItem>(`/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  },
  deleteClass(id: number) {
    return request<Record<string, never>>(`/classes/${id}`, {
      method: 'DELETE',
    })
  },
}
