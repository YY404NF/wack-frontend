import { request } from './client'
import type { AdminOperationLogItem, AttendanceDetailLogItem, PageResult } from './types'

export const logsApi = {
  listAdminOperationLogs() {
    return request<PageResult<AdminOperationLogItem>>('/admin/operation-logs?page=1&page_size=200')
  },
  listAttendanceDetailLogs() {
    return request<PageResult<AttendanceDetailLogItem>>('/admin/attendance-detail-logs?page=1&page_size=200')
  },
}
