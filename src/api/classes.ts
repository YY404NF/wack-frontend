import { request } from './client'
import { apiPaths } from './paths'
import type { ClassItem, ClassStudentCandidateItem, ClassStudentItem, ManagedClassSnapshot, PageResult } from './types'

export const classesApi = {
  listClasses(query: { page?: number; page_size?: number } = {}) {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.page_size ?? 100))
    return request<PageResult<ClassItem>>(`${apiPaths.admin.classes}?${params.toString()}`).then((page) => ({
      ...page,
      items: page.items ?? [],
    }))
  },
  async listAllClasses() {
    const pageSize = 100
    let page = 1
    let total = 0
    const items: ClassItem[] = []

    do {
      const result = await this.listClasses({ page, page_size: pageSize })
      items.push(...(result.items ?? []))
      total = result.total ?? items.length
      page += 1
    } while (items.length < total)

    return items
  },
  createClass(input: { class_name: string; grade: number; major_name: string }) {
    return request<ClassItem>(apiPaths.admin.classes, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  updateClass(id: number, input: { class_name: string; grade: number; major_name: string }) {
    return request<ClassItem>(`${apiPaths.admin.classes}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  },
  deleteClass(id: number) {
    return request<Record<string, never>>(`${apiPaths.admin.classes}/${id}`, {
      method: 'DELETE',
    })
  },
  listClassStudents(id: number) {
    return request<ClassStudentItem[]>(`${apiPaths.admin.classes}/${id}/students`)
  },
  getManagedClassSnapshot() {
    return request<ManagedClassSnapshot>(apiPaths.student.managedClass).then((payload) => ({
      managed_class: payload.managed_class ?? null,
      class_students: payload.class_students ?? [],
    }))
  },
  listClassStudentCandidates() {
    return request<ClassStudentCandidateItem[]>(apiPaths.admin.classStudents)
  },
  createClassStudent(id: number, input: { student_id: string; real_name: string }) {
    return request<ClassStudentItem>(`${apiPaths.admin.classes}/${id}/students`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  updateClassStudent(classId: number, studentId: number, input: { student_id: string; real_name: string }) {
    return request<ClassStudentItem>(`${apiPaths.admin.classes}/${classId}/students/${studentId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  },
  deleteClassStudent(classId: number, studentId: number) {
    return request<Record<string, never>>(`${apiPaths.admin.classes}/${classId}/students/${studentId}`, {
      method: 'DELETE',
    })
  },
}
