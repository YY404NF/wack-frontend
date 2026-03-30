import { request } from './client'
import { apiPaths } from './paths'
import type { AttendanceRecordLogListItem, PageResult } from './types'

export const logsApi = {
  listAttendanceRecordLogs(query: {
    page?: number
    page_size?: number
    term?: string
    course_group_lesson_id?: string
    lesson_date?: string
    section?: string
    course_name?: string
    teacher_name?: string
    student_id?: string
    real_name?: string
    class_name?: string
    old_status?: string
    new_status?: string
    operator_name?: string
    operated_date?: string
  } = {}) {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.page_size ?? 20))
    if (query.term?.trim()) params.set('term', query.term.trim())
    if (query.course_group_lesson_id?.trim()) params.set('course_group_lesson_id', query.course_group_lesson_id.trim())
    if (query.lesson_date?.trim()) params.set('lesson_date', query.lesson_date.trim())
    if (query.section?.trim()) params.set('section', query.section.trim())
    if (query.course_name?.trim()) params.set('course_name', query.course_name.trim())
    if (query.teacher_name?.trim()) params.set('teacher_name', query.teacher_name.trim())
    if (query.student_id?.trim()) params.set('student_id', query.student_id.trim())
    if (query.real_name?.trim()) params.set('real_name', query.real_name.trim())
    if (query.class_name?.trim()) params.set('class_name', query.class_name.trim())
    if (query.old_status?.trim()) params.set('old_status', query.old_status.trim())
    if (query.new_status?.trim()) params.set('new_status', query.new_status.trim())
    if (query.operator_name?.trim()) params.set('operator_name', query.operator_name.trim())
    if (query.operated_date?.trim()) params.set('operated_date', query.operated_date.trim())
    return request<PageResult<AttendanceRecordLogListItem>>(`${apiPaths.admin.attendanceRecordLogs}?${params.toString()}`).then((page) => ({
      ...page,
      items: page.items ?? [],
    }))
  },
}
