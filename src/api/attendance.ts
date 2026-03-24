import { request } from './client'
import { apiPaths } from './paths'
import type {
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
  adminOverview() {
    return request<AdminOverviewData>(apiPaths.admin.overview).then((payload) => ({
      ...payload,
      course_rankings: Array.isArray(payload.course_rankings) ? payload.course_rankings : [],
      class_rankings: Array.isArray(payload.class_rankings) ? payload.class_rankings : [],
      student_rankings: Array.isArray(payload.student_rankings) ? payload.student_rankings : [],
      recent_sessions: Array.isArray(payload.recent_sessions) ? payload.recent_sessions : [],
      recent_abnormal_students: Array.isArray(payload.recent_abnormal_students) ? payload.recent_abnormal_students : [],
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
  adminAttendanceSessions(query: { page?: number; page_size?: number; keyword?: string; week_no?: string; status?: string } = {}) {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.page_size ?? 20))
    if (query.keyword?.trim()) params.set('keyword', query.keyword.trim())
    if (query.week_no?.trim()) params.set('week_no', query.week_no.trim())
    if (query.status?.trim()) params.set('status', query.status.trim())
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
  adminGetAttendanceSessionPage(sessionId: number, query: { page?: number; page_size?: number; keyword?: string; status?: string } = {}) {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.page_size ?? 20))
    if (query.keyword?.trim()) params.set('keyword', query.keyword.trim())
    if (query.status?.trim()) params.set('status', query.status.trim())
    return request<{
      attendance_records: AttendanceRecordStudentItem[] | null
      page: number
      page_size: number
      total: number
    }>(`${apiPaths.admin.attendanceSessions}/${sessionId}?${params.toString()}`).then((payload) => ({
      items: payload.attendance_records ?? [],
      page: payload.page,
      page_size: payload.page_size,
      total: payload.total,
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
