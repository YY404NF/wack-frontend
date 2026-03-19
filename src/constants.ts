export type StatusCode = 0 | 1 | 2 | 3
export type AppTab =
  | 'home'
  | 'overview'
  | 'attendance'
  | 'attendance-logs'
  | 'course-calendar'
  | 'course-manage'
  | 'class-manage'
  | 'user-manage'
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
  { key: 'student', label: '学生管理' },
  { key: 'user-manage', label: '系统用户管理' },
  { key: 'settings', label: '设置' },
] as const

export const adminTabKeys = adminNavItems.map((item) => item.key)

export const studentTabKeys = ['home', 'student', 'settings'] as const
