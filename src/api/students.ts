import { request } from './client'
import { apiPaths } from './paths'
import type { PageResult, StudentItem, StudentOptionItem } from './types'

export const studentsApi = {
  listStudents(query: {
    page?: number
    page_size?: number
    class_id?: number | ''
    keyword?: string
    student_id?: string
    real_name?: string
    class_name?: string
  } = {}) {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.page_size ?? 20))
    if (typeof query.class_id === 'number' && query.class_id > 0) {
      params.set('class_id', String(query.class_id))
    }
    if (query.keyword?.trim()) {
      params.set('keyword', query.keyword.trim())
    }
    if (query.student_id?.trim()) {
      params.set('student_id', query.student_id.trim())
    }
    if (query.real_name?.trim()) {
      params.set('real_name', query.real_name.trim())
    }
    if (query.class_name?.trim()) {
      params.set('class_name', query.class_name.trim())
    }
    return request<PageResult<StudentItem>>(`${apiPaths.admin.students}?${params.toString()}`).then((page) => ({
      ...page,
      items: page.items ?? [],
    }))
  },
  listStudentOptions(query: { keyword?: string; binding?: 'unbound' } = {}) {
    const params = new URLSearchParams()
    if (query.keyword?.trim()) params.set('keyword', query.keyword.trim())
    if (query.binding) params.set('binding', query.binding)
    const suffix = params.toString() ? `?${params.toString()}` : ''
    return request<StudentOptionItem[] | null>(`${apiPaths.admin.studentOptions}${suffix}`).then((items) => items ?? [])
  },
  createStudent(input: { student_id: string; real_name: string; class_id?: number | null }) {
    return request<StudentItem>(apiPaths.admin.students, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  updateStudent(id: number, input: { student_id: string; real_name: string; class_id?: number | null }) {
    return request<StudentItem>(`${apiPaths.admin.students}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  },
  deleteStudent(id: number) {
    return request<Record<string, never>>(`${apiPaths.admin.students}/${id}`, {
      method: 'DELETE',
    })
  },
}
