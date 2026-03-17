import type { SystemSetting } from '../api'

export const scheduleMap = {
  summer: [
    { section: 1, label: '上午 1-2 节', lines: ['08:00-08:45', '08:55-09:40'] },
    { section: 2, label: '上午 3-4 节', lines: ['09:55-10:40', '10:50-11:35'] },
    { section: 3, label: '下午 5-6 节', lines: ['14:30-15:15', '15:25-16:10'] },
    { section: 4, label: '下午 7-8 节', lines: ['16:25-17:10', '17:20-18:05'] },
    { section: 5, label: '晚上 9-10 节', lines: ['19:00-19:45', '19:55-20:40'] },
  ],
  autumn: [
    { section: 1, label: '上午 1-2 节', lines: ['08:00-08:45', '08:55-09:40'] },
    { section: 2, label: '上午 3-4 节', lines: ['09:55-10:40', '10:50-11:35'] },
    { section: 3, label: '下午 5-6 节', lines: ['14:00-14:45', '14:55-15:40'] },
    { section: 4, label: '下午 7-8 节', lines: ['15:55-16:40', '16:50-17:35'] },
    { section: 5, label: '晚上 9-10 节', lines: ['19:00-19:45', '19:55-20:40'] },
  ],
} as const

export type ScheduleType = keyof typeof scheduleMap

export const scheduleLabelMap: Record<ScheduleType, string> = {
  summer: '夏季作息',
  autumn: '秋季作息',
}

function parseClockTime(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
}

function isScheduleType(value: unknown): value is ScheduleType {
  return typeof value === 'string' && value in scheduleMap
}

export function getScheduleType(systemSettings: SystemSetting | null | undefined) {
  return isScheduleType(systemSettings?.current_schedule) ? systemSettings.current_schedule : 'summer'
}

export function getSectionTimeRange(section: number, scheduleType: ScheduleType) {
  const schedule = scheduleMap[scheduleType] ?? scheduleMap.summer
  const target = schedule.find((item) => item.section === section)
  const startText = target?.lines[0]?.split('-')[0]
  const endText = target?.lines[target.lines.length - 1]?.split('-')[1]
  if (!startText || !endText) {
    return null
  }
  return {
    start: parseClockTime(startText),
    end: parseClockTime(endText),
  }
}

export function formatSectionTimeRange(section: number, scheduleType: ScheduleType) {
  const schedule = scheduleMap[scheduleType] ?? scheduleMap.summer
  const target = schedule.find((item) => item.section === section)
  if (!target) {
    return ''
  }
  return `${target.lines[0]?.split('-')[0]} - ${target.lines[target.lines.length - 1]?.split('-')[1]}`
}
