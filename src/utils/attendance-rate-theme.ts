export const attendanceTonePalettes = {
  present: ['#EEF8E8', '#CFEABF', '#79C56B', '#0A9448'],
  late: ['#FFF7D9', '#FFE89A', '#F7BE38', '#B86E00'],
  absent: ['#FDEBEC', '#F8CBCE', '#E97C86', '#C61F26'],
  leave: ['#EBF7FD', '#C9E8F7', '#63B9E3', '#167FBC'],
  unrecorded: ['#F3F0EC', '#D7D1C9', '#A99E94', '#6B6056'],
} as const

export type AttendanceRatePalette = readonly [string, string, string, string]

function hexToRgb(value: string) {
  const normalized = value.replace('#', '')
  const safe = normalized.length === 3
    ? normalized.split('').map((item) => item + item).join('')
    : normalized
  const numeric = Number.parseInt(safe, 16)
  return {
    r: (numeric >> 16) & 255,
    g: (numeric >> 8) & 255,
    b: numeric & 255,
  }
}

function rgbToHex(value: { r: number; g: number; b: number }) {
  return `#${[value.r, value.g, value.b].map((item) => Math.max(0, Math.min(255, Math.round(item))).toString(16).padStart(2, '0')).join('')}`
}

export function clampAttendanceRate(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
}

export function normalizeValueWithinRange(value: number, minValue: number, maxValue: number) {
  const safeValue = Number.isFinite(value) ? value : 0
  const safeMin = Number.isFinite(minValue) ? minValue : 0
  const safeMax = Number.isFinite(maxValue) ? maxValue : 0
  if (safeMax - safeMin <= 0.000001) {
    return clampAttendanceRate(safeValue)
  }
  return Math.max(0, Math.min(1, (safeValue - safeMin) / (safeMax - safeMin)))
}

export function mixHex(left: string, right: string, factor: number) {
  const start = hexToRgb(left)
  const end = hexToRgb(right)
  const ratio = Math.max(0, Math.min(1, factor))
  return rgbToHex({
    r: start.r + (end.r - start.r) * ratio,
    g: start.g + (end.g - start.g) * ratio,
    b: start.b + (end.b - start.b) * ratio,
  })
}

function mixPalette(
  left: AttendanceRatePalette,
  right: AttendanceRatePalette,
  factor: number,
) {
  return [
    mixHex(left[0], right[0], factor),
    mixHex(left[1], right[1], factor),
    mixHex(left[2], right[2], factor),
    mixHex(left[3], right[3], factor),
  ] as const
}

export function normalizeRateWithinRange(value: number, minRate: number, maxRate: number) {
  return normalizeValueWithinRange(
    clampAttendanceRate(value),
    clampAttendanceRate(minRate),
    clampAttendanceRate(maxRate),
  )
}

export function paletteForRelativeAttendanceRate(value: number) {
  const normalized = clampAttendanceRate(value)
  if (normalized <= 0.5) {
    return mixPalette(attendanceTonePalettes.absent, attendanceTonePalettes.late, normalized / 0.5)
  }
  return mixPalette(attendanceTonePalettes.late, attendanceTonePalettes.present, (normalized - 0.5) / 0.5)
}

export function paletteForAttendanceRate(value: number, minRate: number, maxRate: number) {
  return paletteForRelativeAttendanceRate(normalizeRateWithinRange(value, minRate, maxRate))
}
