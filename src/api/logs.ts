import { request } from './client'
import { apiPaths } from './paths'
import type { AttendanceRecordLogItem, PageResult } from './types'

export const logsApi = {
  listAttendanceRecordLogs(query: {
    page?: number
    page_size?: number
    term?: string
    course_group_lesson_id?: string
    student_id?: string
    operator_login_id?: string
    operation_type?: string
    new_status?: string
    operated_date?: string
  } = {}) {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.page_size ?? 20))
    if (query.term?.trim()) params.set('term', query.term.trim())
    if (query.course_group_lesson_id?.trim()) params.set('course_group_lesson_id', query.course_group_lesson_id.trim())
    if (query.student_id?.trim()) params.set('student_id', query.student_id.trim())
    if (query.operator_login_id?.trim()) params.set('operator_login_id', query.operator_login_id.trim())
    if (query.operation_type?.trim()) params.set('operation_type', query.operation_type.trim())
    if (query.new_status?.trim()) params.set('new_status', query.new_status.trim())
    if (query.operated_date?.trim()) params.set('operated_date', query.operated_date.trim())
    return request<PageResult<AttendanceRecordLogItem>>(`${apiPaths.admin.attendanceRecordLogs}?${params.toString()}`).then((page) => ({
      ...page,
      items: page.items ?? [],
    }))
  },
}
