import { request } from './client'
import { apiPaths } from './paths'
import type { AttendanceCheckDetail, AttendanceResultItem, AvailableCourseItem, DashboardSummary, PageResult } from './types'

export const attendanceApi = {
  adminAttendanceDashboard() {
    return request<DashboardSummary>(apiPaths.admin.attendanceDashboard)
  },
  adminAttendanceResults() {
    return request<PageResult<AttendanceResultItem>>(`${apiPaths.admin.attendanceResults}?page=1&page_size=50`)
  },
  adminUpdateAttendanceStatus(detailId: number, status: number) {
    return request<Record<string, never>>(`${apiPaths.admin.attendanceDetails}/${detailId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
  studentAvailableCourses() {
    return request<AvailableCourseItem[] | null>(apiPaths.student.coursesAvailable)
  },
  enterAttendanceCheck(courseSessionId: number) {
    return request<AttendanceCheckDetail>(apiPaths.student.attendanceChecks, {
      method: 'POST',
      body: JSON.stringify({ course_session_id: courseSessionId }),
    })
  },
  updateAttendanceStatus(detailId: number, status: number) {
    return request<Record<string, never>>(`${apiPaths.student.attendanceDetails}/${detailId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
  completeAttendanceCheck(checkId: number) {
    return request<Record<string, never>>(`${apiPaths.student.attendanceChecks}/${checkId}/complete`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
  },
}
