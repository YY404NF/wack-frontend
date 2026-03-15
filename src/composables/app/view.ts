import { roleLabels, sectionLabels, statusLabels, type StatusCode, weekdayLabels } from '../../constants'

export const USER_PAGE_OPTIONS = [5, 10, 20, 50]

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
    'tag-good': status === 1,
    'tag-warn': status === 2,
    'tag-bad': status === 3,
    'tag-calm': status === 4,
    'tag-muted': status === 0,
  }
}
