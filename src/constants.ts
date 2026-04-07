export type StatusCode = 0 | 1 | 2 | 3
export type AdminTab =
  | 'overview'
  | 'attendance'
  | 'attendance-logs'
  | 'course-calendar'
  | 'course-manage'
  | 'class-manage'
  | 'student-manage'
  | 'user-manage'
  | 'settings'

export type StudentTab =
  | 'home'
  | 'student'
  | 'settings'

export const roleLabels: Record<number, string> = {
  1: '管理员',
  2: '查课学生',
  3: '学委',
}

export const statusLabels: Record<StatusCode, string> = {
  0: '签到',
  1: '迟到',
  2: '缺勤',
  3: '请假',
}

export function attendanceStatusBadgeClass(status?: number | null) {
  if (status === null || status === undefined) {
    return 'attendance-status-badge-unrecorded'
  }
  if (status === 0) {
    return 'attendance-status-badge-present'
  }
  if (status === 1) {
    return 'attendance-status-badge-late'
  }
  if (status === 2) {
    return 'attendance-status-badge-absent'
  }
  return 'attendance-status-badge-leave'
}

export function formatClassSummaryMultiline(value?: string | null, fallback = '-') {
  const items = String(value ?? '')
    .split(/[、,，]\s*/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
  return items.length > 0 ? items.join('\n') : fallback
}

export function formatClassNameListMultiline(values: string[], fallback = '未绑定班级') {
  const items = values
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
  return items.length > 0 ? items.join('\n') : fallback
}

export const weekdayLabels: Record<number, string> = {
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
  7: '周日',
}

export const sectionLabels: Record<number, string> = {
  1: '上午 1-2 节',
  2: '上午 3-4 节',
  3: '下午 5-6 节',
  4: '下午 7-8 节',
  5: '晚上 9-10 节',
}

export const adminNavItems = [
  { key: 'overview', label: '主页' },
  { key: 'course-calendar', label: '全院课程表' },
  { key: 'attendance', label: '考勤记录' },
  { key: 'attendance-logs', label: '考勤日志' },
  { key: 'course-manage', label: '课程管理' },
  { key: 'class-manage', label: '班级管理' },
  { key: 'student-manage', label: '学生管理' },
  { key: 'user-manage', label: '系统用户管理' },
  { key: 'settings', label: '设置' },
] as const satisfies ReadonlyArray<{ key: AdminTab; label: string }>

export const adminTabKeys = adminNavItems.map((item) => item.key) as AdminTab[]

export const studentTabKeys = ['home', 'student', 'settings'] as const satisfies readonly StudentTab[]
