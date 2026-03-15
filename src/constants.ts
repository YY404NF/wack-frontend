export type StatusCode = 0 | 1 | 2 | 3 | 4
export type AppTab = 'overview' | 'manage' | 'attendance' | 'student' | 'availability' | 'settings'

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
  { key: 'overview', label: '总览', desc: '课程表、统计和空闲视图' },
  { key: 'manage', label: '用户与课程', desc: '创建用户与录入排课' },
  { key: 'attendance', label: '查课结果', desc: '修正考勤明细状态' },
  { key: 'settings', label: '设置', desc: '修改密码与账号设置' },
] as const
