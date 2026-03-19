import { request } from './client'
import { apiPaths } from './paths'
import type { ClassItem, ClassOptionItem, ClassStudentCandidateItem, ClassStudentImportResult, ClassStudentItem, ManagedClassSnapshot, PageResult } from './types'

export const classesApi = {
  listClasses(query: { page?: number; page_size?: number; grade?: string; major_name?: string; class_name?: string } = {}) {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.page_size ?? 100))
    if (query.grade?.trim()) params.set('grade', query.grade.trim())
    if (query.major_name?.trim()) params.set('major_name', query.major_name.trim())
    if (query.class_name?.trim()) params.set('class_name', query.class_name.trim())
    return request<PageResult<ClassItem>>(`${apiPaths.admin.classes}?${params.toString()}`).then((page) => ({
      ...page,
      items: page.items ?? [],
    }))
  },
  listClassOptions(keyword = '') {
    const params = new URLSearchParams()
    if (keyword.trim()) params.set('keyword', keyword.trim())
    const suffix = params.toString() ? `?${params.toString()}` : ''
    return request<ClassOptionItem[] | null>(`${apiPaths.admin.classOptions}${suffix}`).then((items) => items ?? [])
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
    return request<ClassStudentItem[] | null>(`${apiPaths.admin.classes}/${id}/students`).then((items) => items ?? [])
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
  importClassStudents(id: number, file: File) {
    const body = new FormData()
    body.append('file', file)
    return request<ClassStudentImportResult>(`${apiPaths.admin.classes}/${id}/students/import`, {
      method: 'POST',
      body,
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
