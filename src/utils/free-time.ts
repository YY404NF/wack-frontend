export const FREE_TIME_WEEK_COUNT = 16
export const FREE_TIME_VISIBLE_WEEKDAYS = [1, 2, 3, 4, 5] as const
export const FREE_TIME_VISIBLE_SECTIONS = [1, 2, 3, 4, 5] as const

export function buildFreeTimeCellKey(weekday: number, section: number) {
  return `${weekday}-${section}`
}

export function parseFreeWeeks(value: string) {
  const result = new Set<number>()

  for (const chunk of value.split(',')) {
    const part = chunk.trim()
    if (!part) {
      continue
    }

    const [startText, endText] = part.split('-').map((item) => item.trim())
    const start = Number(startText)
    const end = endText ? Number(endText) : start
    if (!Number.isInteger(start) || !Number.isInteger(end)) {
      continue
    }

    const left = Math.max(1, Math.min(start, end))
    const right = Math.min(FREE_TIME_WEEK_COUNT, Math.max(start, end))
    for (let weekNo = left; weekNo <= right; weekNo += 1) {
      result.add(weekNo)
    }
  }

  return Array.from(result).sort((left, right) => left - right)
}

export function formatFreeWeeks(weeks: number[]) {
  const normalized = Array.from(new Set(weeks))
    .filter((weekNo) => Number.isInteger(weekNo) && weekNo >= 1 && weekNo <= FREE_TIME_WEEK_COUNT)
    .sort((left, right) => left - right)

  if (normalized.length === 0) {
    return ''
  }

  const segments: string[] = []
  let start = normalized[0]
  let previous = normalized[0]

  for (let index = 1; index < normalized.length; index += 1) {
    const current = normalized[index]
    if (current === previous + 1) {
      previous = current
      continue
    }

    segments.push(start === previous ? String(start) : `${start}-${previous}`)
    start = current
    previous = current
  }

  segments.push(start === previous ? String(start) : `${start}-${previous}`)
  return segments.join(',')
}

export function getCurrentAcademicTerm(date = new Date()) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  if (month >= 2 && month <= 8) {
    return `${year - 1}-${year}-2`
  }
  return `${year}-${year + 1}-1`
}
