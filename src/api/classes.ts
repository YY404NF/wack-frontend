import { request } from './client'
import type { ClassItem, ClassStudentCandidateItem, ClassStudentItem, PageResult } from './types'

export const classesApi = {
  listClasses() {
    return request<PageResult<ClassItem>>('/classes?page=1&page_size=200').then((page) => ({
      ...page,
      items: page.items ?? [],
    }))
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
  listClassStudents(id: number) {
    return request<ClassStudentItem[]>(`/classes/${id}/students`)
  },
  listClassStudentCandidates() {
    return request<ClassStudentCandidateItem[]>('/class-students')
  },
  createClassStudent(id: number, input: { student_id: string; real_name: string }) {
    return request<ClassStudentItem>(`/classes/${id}/students`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  importClassStudents(id: number, input: Array<{ student_id: string; real_name: string }>) {
    return request<Record<string, never>>(`/classes/${id}/students/import`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  updateClassStudent(classId: number, studentId: number, input: { student_id: string; real_name: string }) {
    return request<ClassStudentItem>(`/classes/${classId}/students/${studentId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  },
  deleteClassStudent(classId: number, studentId: number) {
    return request<Record<string, never>>(`/classes/${classId}/students/${studentId}`, {
      method: 'DELETE',
    })
  },
}
