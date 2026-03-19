import { request } from './client'
import { apiPaths } from './paths'
import type { AttendanceRecordLogItem, PageResult } from './types'

export const logsApi = {
  listAttendanceRecordLogs() {
    return request<PageResult<AttendanceRecordLogItem>>(`${apiPaths.admin.attendanceRecordLogs}?page=1&page_size=200`)
  },
}
