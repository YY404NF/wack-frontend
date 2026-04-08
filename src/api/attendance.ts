import { request } from './client'
import { apiPaths } from './paths'
import type {
  AdminBulkUpdateAttendanceStatusesResult,
  AdminAttendanceSessionPageResult,
  AdminOverviewData,
  AttendanceRecordLogItem,
  AttendanceRecordStudentItem,
  AttendanceResultItem,
  AttendanceSessionDetail,
  AvailableCourseItem,
  DashboardSummary,
  PageResult,
  SubmitAttendanceStatusesResult,
} from './types'

function normalizeAttendanceSessionDetail(detail: AttendanceSessionDetail) {
  return {
    ...detail,
    class_groups: Array.isArray(detail.class_groups) ? detail.class_groups : [],
    students: Array.isArray(detail.students) ? detail.students : [],
  }
}

export const attendanceApi = {
  adminOverview(query: {
    section?: 'course_rankings' | 'class_rankings' | 'student_rankings' | 'recent_sessions' | 'recent_abnormal_students'
    offset?: number
    limit?: number
    order?: 'asc' | 'desc'
  } = {}) {
    const params = new URLSearchParams()
    if (query.section) params.set('section', query.section)
    if (typeof query.offset === 'number' && query.offset >= 0) params.set('offset', String(query.offset))
    if (typeof query.limit === 'number' && query.limit > 0) params.set('limit', String(query.limit))
    if (query.order === 'asc' || query.order === 'desc') params.set('order', query.order)
    const url = params.size > 0 ? `${apiPaths.admin.overview}?${params.toString()}` : apiPaths.admin.overview
    return request<AdminOverviewData>(url).then((payload) => ({
      ...payload,
      course_rankings: Array.isArray(payload.course_rankings) ? payload.course_rankings : [],
      course_rankings_total: payload.course_rankings_total ?? 0,
      course_rankings_has_more: payload.course_rankings_has_more ?? false,
      course_rankings_min_rate: payload.course_rankings_min_rate ?? 0,
      course_rankings_max_rate: payload.course_rankings_max_rate ?? 0,
      class_rankings: Array.isArray(payload.class_rankings) ? payload.class_rankings : [],
      class_rankings_total: payload.class_rankings_total ?? 0,
      class_rankings_has_more: payload.class_rankings_has_more ?? false,
      class_rankings_min_rate: payload.class_rankings_min_rate ?? 0,
      class_rankings_max_rate: payload.class_rankings_max_rate ?? 0,
      student_rankings: Array.isArray(payload.student_rankings) ? payload.student_rankings : [],
      student_rankings_total: payload.student_rankings_total ?? 0,
      student_rankings_has_more: payload.student_rankings_has_more ?? false,
      student_rankings_min_rate: payload.student_rankings_min_rate ?? 0,
      student_rankings_max_rate: payload.student_rankings_max_rate ?? 0,
      recent_sessions: Array.isArray(payload.recent_sessions) ? payload.recent_sessions : [],
      recent_sessions_total: payload.recent_sessions_total ?? 0,
      recent_sessions_has_more: payload.recent_sessions_has_more ?? false,
      recent_sessions_min_rate: payload.recent_sessions_min_rate ?? 0,
      recent_sessions_max_rate: payload.recent_sessions_max_rate ?? 0,
      recent_abnormal_students: Array.isArray(payload.recent_abnormal_students) ? payload.recent_abnormal_students : [],
      recent_abnormal_students_total: payload.recent_abnormal_students_total ?? 0,
      recent_abnormal_students_has_more: payload.recent_abnormal_students_has_more ?? false,
    }))
  },
  adminAttendanceDashboard() {
    return request<DashboardSummary>(apiPaths.admin.attendanceDashboard)
  },
  async adminAttendanceResults() {
    const pageSize = 200
    let page = 1
    let total = 0
    const items: AttendanceResultItem[] = []

    do {
      const result = await request<PageResult<AttendanceResultItem>>(
        `${apiPaths.admin.attendanceResults}?page=${page}&page_size=${pageSize}`,
      )
      items.push(...(result.items ?? []))
      total = result.total ?? items.length
      page += 1
    } while (items.length < total)

    return {
      items,
      page: 1,
      page_size: total || items.length || pageSize,
      total: items.length,
    }
  },
  adminAttendanceSessions(query: {
    page?: number
    page_size?: number
    term?: string
    keyword?: string
    lesson_date?: string
    lesson_date_from?: string
    lesson_date_to?: string
    course_name?: string
    teacher_name?: string
    week_no?: string
    weekday?: string
    section?: string
    class_id?: string
    class_name?: string
    status?: string
    include_unchecked?: boolean
  } = {}) {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.page_size ?? 20))
    if (query.term?.trim()) params.set('term', query.term.trim())
    if (query.keyword?.trim()) params.set('keyword', query.keyword.trim())
    if (query.lesson_date?.trim()) params.set('lesson_date', query.lesson_date.trim())
    if (query.lesson_date_from?.trim()) params.set('lesson_date_from', query.lesson_date_from.trim())
    if (query.lesson_date_to?.trim()) params.set('lesson_date_to', query.lesson_date_to.trim())
    if (query.course_name?.trim()) params.set('course_name', query.course_name.trim())
    if (query.teacher_name?.trim()) params.set('teacher_name', query.teacher_name.trim())
    if (query.week_no?.trim()) params.set('week_no', query.week_no.trim())
    if (query.weekday?.trim()) params.set('weekday', query.weekday.trim())
    if (query.section?.trim()) params.set('section', query.section.trim())
    if (query.class_id?.trim()) params.set('class_id', query.class_id.trim())
    if (query.class_name?.trim()) params.set('class_name', query.class_name.trim())
    if (query.status?.trim()) params.set('status', query.status.trim())
    if (query.include_unchecked) params.set('include_unchecked', '1')
    return request<PageResult<Record<string, unknown>>>(`${apiPaths.admin.attendanceSessions}?${params.toString()}`).then((page) => ({
      ...page,
      items: page.items ?? [],
    }))
  },
  adminGetAttendanceSession(sessionId: number) {
    return request<{ attendance_records: AttendanceRecordStudentItem[] | null }>(
      `${apiPaths.admin.attendanceSessions}/${sessionId}`,
    ).then((payload) => payload.attendance_records ?? [])
  },
  adminGetAttendanceSessionPage(sessionId: number, query: {
    page?: number
    page_size?: number
    student_id?: string
    real_name?: string
    class_name?: string
    status?: string
    operator_name?: string
    operated_date?: string
    focus_student_ref_id?: number
  } = {}) {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.page_size ?? 20))
    if (query.student_id?.trim()) params.set('student_id', query.student_id.trim())
    if (query.real_name?.trim()) params.set('real_name', query.real_name.trim())
    if (query.class_name?.trim()) params.set('class_name', query.class_name.trim())
    if (query.status?.trim()) params.set('status', query.status.trim())
    if (query.operator_name?.trim()) params.set('operator_name', query.operator_name.trim())
    if (query.operated_date?.trim()) params.set('operated_date', query.operated_date.trim())
    if (typeof query.focus_student_ref_id === 'number' && query.focus_student_ref_id > 0) {
      params.set('focus_student_ref_id', String(query.focus_student_ref_id))
    }
    return request<AdminAttendanceSessionPageResult>(`${apiPaths.admin.attendanceSessions}/${sessionId}?${params.toString()}`).then((payload) => ({
      ...payload,
      attendance_records: payload.attendance_records ?? [],
    }))
  },
  adminAttendanceRecordLogs(recordId: number) {
    return request<AttendanceRecordLogItem[] | null>(`${apiPaths.admin.attendanceRecords}/${recordId}/logs`).then((items) => items ?? [])
  },
  adminUpdateAttendanceStatus(sessionId: number, studentRefId: number, status: number) {
    return request<Record<string, never>>(`${apiPaths.admin.attendanceSessions}/${sessionId}/students/${studentRefId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
  adminBulkUpdateAttendanceStatuses(sessionId: number, studentRefIds: number[], status: number) {
    return request<AdminBulkUpdateAttendanceStatusesResult>(`${apiPaths.admin.attendanceSessions}/${sessionId}/students/statuses`, {
      method: 'PATCH',
      body: JSON.stringify({ student_ref_ids: studentRefIds, status }),
    }).then((result) => ({
      ...result,
      applied_items: Array.isArray(result.applied_items) ? result.applied_items : [],
      failed_items: Array.isArray(result.failed_items) ? result.failed_items : [],
      applied_count: result.applied_count ?? 0,
      failed_count: result.failed_count ?? 0,
    }))
  },
  adminUpdateAttendanceRecordStatus(recordId: number, status: number) {
    return request<Record<string, never>>(`${apiPaths.admin.attendanceRecords}/${recordId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
  studentAvailableCourses() {
    return request<AvailableCourseItem[] | null>(apiPaths.student.coursesAvailable)
  },
  enterAttendanceSession(courseGroupLessonId: number) {
    return request<AttendanceSessionDetail>(apiPaths.student.attendanceSessions, {
      method: 'POST',
      body: JSON.stringify({ course_group_lesson_id: courseGroupLessonId }),
    }).then(normalizeAttendanceSessionDetail)
  },
  updateAttendanceStatus(recordId: number, status: number) {
    return request<Record<string, never>>(`${apiPaths.student.attendanceRecords}/${recordId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
  submitAttendanceStatuses(sessionId: number, items: Array<{ student_ref_id: number; status: number }>) {
    return request<SubmitAttendanceStatusesResult>(`${apiPaths.student.attendanceSessions}/${sessionId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    }).then((result) => ({
      ...result,
      accepted_items: Array.isArray(result.accepted_items) ? result.accepted_items : [],
      ignored_items: Array.isArray(result.ignored_items) ? result.ignored_items : [],
    }))
  },
  completeAttendanceSession(sessionId: number) {
    return request<Record<string, never>>(`${apiPaths.student.attendanceSessions}/${sessionId}/complete`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
  },
  abandonAttendanceSession(sessionId: number) {
    return request<Record<string, never>>(`${apiPaths.student.attendanceSessions}/${sessionId}`, {
      method: 'DELETE',
    })
  },
}
