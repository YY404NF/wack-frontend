import { request } from './client'
import { apiPaths } from './paths'
import type {
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
  adminGetAttendanceSession(sessionId: number) {
    return request<{ attendance_records: AttendanceRecordStudentItem[] | null }>(
      `${apiPaths.admin.attendanceSessions}/${sessionId}`,
    ).then((payload) => payload.attendance_records ?? [])
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
    })
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
