import { request } from './client'
import { apiPaths } from './paths'
import type { PageResult, StudentAttendancePageResult, StudentItem, StudentOptionItem } from './types'

export const studentsApi = {
  listStudents(query: {
    page?: number
    page_size?: number
    class_id?: number | ''
    keyword?: string
    student_id?: string
    real_name?: string
    class_name?: string
    term?: string
    attendance_summary_status?: 'late' | 'absent' | 'leave' | ''
    focus_student_ref_id?: number
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
    if (query.term?.trim()) {
      params.set('term', query.term.trim())
    }
    if (query.attendance_summary_status?.trim()) {
      params.set('attendance_summary_status', query.attendance_summary_status.trim())
    }
    if (typeof query.focus_student_ref_id === 'number' && query.focus_student_ref_id > 0) {
      params.set('focus_student_ref_id', String(query.focus_student_ref_id))
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
  adminStudentAttendanceRecords(studentId: number, query: {
    page?: number
    page_size?: number
    term?: string
    lesson_date?: string
    section?: string
    course_name?: string
    teacher_name?: string
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
    if (query.status?.trim()) params.set('status', query.status.trim())
    if (query.operator_name?.trim()) params.set('operator_name', query.operator_name.trim())
    if (query.operated_date?.trim()) params.set('operated_date', query.operated_date.trim())
    return request<StudentAttendancePageResult>(`${apiPaths.admin.students}/${studentId}/attendance-records?${params.toString()}`).then((payload) => ({
      ...payload,
      attendance_records: payload.attendance_records ?? [],
    }))
  },
  adminBulkUpdateStudentAttendanceRecordStatuses(studentId: number, attendanceRecordIds: number[], status: number) {
    return request<{ applied_items: number[]; failed_items: number[]; applied_count: number; failed_count: number }>(
      `${apiPaths.admin.students}/${studentId}/attendance-records/statuses`,
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
}
