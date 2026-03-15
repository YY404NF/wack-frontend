export type StatusCode = 0 | 1 | 2 | 3 | 4
export type AppTab =
  | 'overview'
  | 'attendance'
  | 'free-time-calendar'
  | 'free-time-manage'
  | 'course-calendar'
  | 'course-manage'
  | 'class-manage'
  | 'user-manage'
  | 'logs'
  | 'student'
  | 'availability'
  | 'settings'

export const roleLabels: Record<number, string> = {
  1: '管理员',
  2: '查课学生',
}

export const statusLabels: Record<StatusCode, string> = {
  0: '未设置',
  1: '签到',
  2: '迟到',
  3: '缺勤',
  4: '请假',
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
  { key: 'overview', label: '总览' },
  { key: 'attendance', label: '查课详情' },
  { key: 'free-time-calendar', label: '查课学生空余时间日历' },
  { key: 'free-time-manage', label: '查课学生空余时间管理' },
  { key: 'course-calendar', label: '全院课程表' },
  { key: 'course-manage', label: '课程管理' },
  { key: 'class-manage', label: '班级管理' },
  { key: 'user-manage', label: '系统用户管理' },
  { key: 'logs', label: '系统日志' },
  { key: 'settings', label: '设置' },
] as const

export const adminTabKeys = adminNavItems.map((item) => item.key)

export const studentTabKeys = ['student', 'availability', 'settings'] as const
