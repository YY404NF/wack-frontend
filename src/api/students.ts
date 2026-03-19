import { request } from './client'
import { apiPaths } from './paths'
import type { PageResult, StudentItem } from './types'

export const studentsApi = {
  listStudents(query: { page?: number; page_size?: number; class_id?: number | ''; keyword?: string } = {}) {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.page_size ?? 100))
    if (typeof query.class_id === 'number' && query.class_id > 0) {
      params.set('class_id', String(query.class_id))
    }
    if (query.keyword?.trim()) {
      params.set('keyword', query.keyword.trim())
    }
    return request<PageResult<StudentItem>>(`${apiPaths.admin.students}?${params.toString()}`).then((page) => ({
      ...page,
      items: page.items ?? [],
    }))
  },
  async listAllStudents() {
    const pageSize = 100
    let page = 1
    let total = 0
    const items: StudentItem[] = []

    do {
      const result = await this.listStudents({ page, page_size: pageSize })
      items.push(...(result.items ?? []))
      total = result.total ?? items.length
      page += 1
    } while (items.length < total)

    return items
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
