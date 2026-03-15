import { request } from './client'
import type { AttendanceCheckDetail, AttendanceResultItem, AvailableCourseItem, DashboardSummary, PageResult } from './types'

export const attendanceApi = {
  adminAttendanceDashboard() {
    return request<DashboardSummary>('/admin/attendance-dashboard')
  },
  adminAttendanceResults() {
    return request<PageResult<AttendanceResultItem>>('/admin/attendance-results?page=1&page_size=50')
  },
  adminUpdateAttendanceStatus(detailId: number, status: number) {
    return request<Record<string, never>>(`/admin/attendance-details/${detailId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
  studentAvailableCourses() {
    return request<AvailableCourseItem[] | null>('/student/courses/available')
  },
  enterAttendanceCheck(courseSessionId: number) {
    return request<AttendanceCheckDetail>('/student/attendance-checks', {
      method: 'POST',
      body: JSON.stringify({ course_session_id: courseSessionId }),
    })
  },
  updateAttendanceStatus(detailId: number, status: number) {
    return request<Record<string, never>>(`/student/attendance-details/${detailId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
  completeAttendanceCheck(checkId: number) {
    return request<Record<string, never>>(`/student/attendance-checks/${checkId}/complete`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
  },
}
