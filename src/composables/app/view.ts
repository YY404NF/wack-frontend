import { roleLabels, sectionLabels, statusLabels, type StatusCode, weekdayLabels } from '../../constants'

export const USER_PAGE_OPTIONS = [10, 20, 50, 100]

export function roleName(role?: number) {
  return role ? roleLabels[role] ?? `角色 ${role}` : '-'
}

export function statusName(status: number) {
  return statusLabels[status as StatusCode] ?? `状态 ${status}`
}

export function slotLabel(weekday: number, section: number) {
  return `${weekdayLabels[weekday] ?? `周${weekday}`} · ${sectionLabels[section] ?? `第 ${section} 段`}`
}

export function statusClass(status: number) {
  return {
    'tag-good': status === 0,
    'tag-warn': status === 1,
    'tag-bad': status === 2,
    'tag-calm': status === 3,
    'tag-muted': status < 0 || Number.isNaN(status),
  }
}
