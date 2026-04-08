import { request } from './client'
import { apiPaths } from './paths'
import type { ClassAttendancePageResult, ClassItem, ClassOptionItem, ClassStudentCandidateItem, ClassStudentImportResult, ClassStudentItem, ManagedClassSnapshot, PageResult } from './types'

export const classesApi = {
  listClasses(query: {
    page?: number
    page_size?: number
    grade?: string | number
    major_name?: string
    class_name?: string
    term?: string
    attendance_summary_status?: 'late' | 'absent' | 'leave' | ''
    focus_class_id?: number
  } = {}) {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.page_size ?? 20))
    const grade = query.grade === null || query.grade === undefined ? '' : String(query.grade).trim()
    if (grade) params.set('grade', grade)
    if (query.major_name?.trim()) params.set('major_name', query.major_name.trim())
    if (query.class_name?.trim()) params.set('class_name', query.class_name.trim())
    if (query.term?.trim()) params.set('term', query.term.trim())
    if (query.attendance_summary_status?.trim()) params.set('attendance_summary_status', query.attendance_summary_status.trim())
    if (typeof query.focus_class_id === 'number' && query.focus_class_id > 0) params.set('focus_class_id', String(query.focus_class_id))
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
  adminClassAttendanceRecords(classId: number, query: {
    page?: number
    page_size?: number
    term?: string
    lesson_date?: string
    section?: string
    course_name?: string
    teacher_name?: string
    student_id?: string
    real_name?: string
    status?: string
    operator_name?: string
    operated_date?: string
  } = {}) {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.page_size ?? 20))
    if (query.term?.trim()) params.set('term', query.term.trim())
    if (query.lesson_date?.trim()) params.set('lesson_date', query.lesson_date.trim())
    if (query.section?.trim()) params.set('section', query.section.trim())
    if (query.course_name?.trim()) params.set('course_name', query.course_name.trim())
    if (query.teacher_name?.trim()) params.set('teacher_name', query.teacher_name.trim())
    if (query.student_id?.trim()) params.set('student_id', query.student_id.trim())
    if (query.real_name?.trim()) params.set('real_name', query.real_name.trim())
    if (query.status?.trim()) params.set('status', query.status.trim())
    if (query.operator_name?.trim()) params.set('operator_name', query.operator_name.trim())
    if (query.operated_date?.trim()) params.set('operated_date', query.operated_date.trim())
    return request<ClassAttendancePageResult>(`${apiPaths.admin.classes}/${classId}/attendance-records?${params.toString()}`).then((payload) => ({
      ...payload,
      attendance_records: payload.attendance_records ?? [],
    }))
  },
  adminBulkUpdateClassAttendanceRecordStatuses(classId: number, attendanceRecordIds: number[], status: number) {
    return request<{ applied_items: number[]; failed_items: number[]; applied_count: number; failed_count: number }>(
      `${apiPaths.admin.classes}/${classId}/attendance-records/statuses`,
      {
        method: 'PATCH',
        body: JSON.stringify({ attendance_record_ids: attendanceRecordIds, status }),
      },
    ).then((result) => ({
      ...result,
      applied_items: Array.isArray(result.applied_items) ? result.applied_items : [],
      failed_items: Array.isArray(result.failed_items) ? result.failed_items : [],
      applied_count: result.applied_count ?? 0,
      failed_count: result.failed_count ?? 0,
    }))
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
