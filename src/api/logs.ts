import { request } from './client'
import { apiPaths } from './paths'
import type { AdminOperationLogItem, AttendanceDetailLogItem, PageResult } from './types'

export const logsApi = {
  listAdminOperationLogs() {
    return request<PageResult<AdminOperationLogItem>>(`${apiPaths.admin.operationLogs}?page=1&page_size=200`)
  },
  listAttendanceDetailLogs() {
    return request<PageResult<AttendanceDetailLogItem>>(`${apiPaths.admin.attendanceDetailLogs}?page=1&page_size=200`)
  },
}
