<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { api, type CourseCalendarItem, type CourseCalendarOutlineItem, type FreeTimeItem, type MetaTermItem, type SystemSetting } from '../../api'
import { attendanceStatusBadgeClass, weekdayLabels } from '../../constants'
import { clampAttendanceRate, mixHex, normalizeValueWithinRange, paletteForAttendanceRate, paletteForRelativeAttendanceRate } from '../../utils/attendance-rate-theme'
import { selectDefaultTermName, sortTermsForSelect } from '../../utils/terms'
import type { AdminAttendanceDetailTarget } from './shared-types'

const props = defineProps<{
  courseCalendar: CourseCalendarItem[]
  freeTimes: FreeTimeItem[]
  courseTerms: MetaTermItem[]
  selectedTerm: string
  systemSettings: SystemSetting | null
}>()

const emit = defineEmits<{
  'update:selectedTerm': [term: string]
  openAttendanceDetail: [target: AdminAttendanceDetailTarget]
  openCalendarUser: [loginId: string]
}>()

const WEEK_COUNT = 16

const now = ref(new Date())
const showingFreeTime = ref(false)
const showWeekend = ref(false)
const selectedWeek = ref(1)
const hoveredCourse = ref<null | { title: string; lines: string[]; summaryItems: TooltipAttendanceSummaryItem[]; x: number; y: number }>(null)
const hoveredFreeTimeLoginId = ref('')
const tooltipRef = ref<HTMLElement | null>(null)
const tooltipSize = ref({ width: 0, height: 0 })
const outlineRows = ref<CourseCalendarOutlineItem[]>([])
const courseCalendarRows = ref<CourseCalendarItem[]>([])
const freeTimeRows = ref<FreeTimeItem[]>([])

let timerId = 0
let outlineRequestToken = 0
let courseRequestToken = 0
let freeTimeRequestToken = 0
let scheduledOutlineLoadToken = 0
let scheduledCourseLoadToken = 0
let scheduledFreeTimeLoadToken = 0

const outlineCache = new Map<string, CourseCalendarOutlineItem[]>()
const courseCalendarCache = new Map<string, CourseCalendarItem[]>()
const freeTimeCache = new Map<string, FreeTimeItem[]>()

type CalendarCellCourseItem = {
  key: string
  courseGroupId: number
  courseId: number
  selectedLessonId: number | null
  selectedHasAttendanceRecord: boolean
  selectedAttendanceRate: number | null
  selectedStudentCount: number
  selectedRecordCount: number
  selectedLateCount: number
  selectedAbsentCount: number
  selectedLeaveCount: number
  courseName: string
  teacherName: string
  locations: string[]
  classNames: string[]
  weekNos: number[]
  containsSelectedWeek: boolean
}

type TooltipAttendanceSummaryItem = {
  key: string
  label: string
  count: number
  className: string
}

const scheduleMap = {
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

const activeSchedule = computed(() => scheduleMap[props.systemSettings?.current_schedule ?? 'summer'])
const visibleWeekdays = computed(() => (showWeekend.value ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5]))

const currentTerm = computed(() => selectDefaultTermName(props.courseTerms, now.value))
const selectedTermModel = computed({
  get: () => props.selectedTerm,
  set: (value: string) => emit('update:selectedTerm', value),
})
const selectedTermMeta = computed(() => props.courseTerms.find((item) => item.name === selectedTermModel.value) ?? null)

const currentWeek = computed(() => {
  const startDate = selectedTermMeta.value?.term_start_date
  if (!startDate) {
    return 1
  }
  const start = new Date(`${startDate}T00:00:00`)
  if (Number.isNaN(start.getTime())) {
    return 1
  }
  const diff = now.value.getTime() - start.getTime()
  return Math.min(WEEK_COUNT, Math.max(1, Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1))
})

const currentWeekday = computed(() => {
  const day = now.value.getDay()
  return day === 0 ? 7 : day
})

function parseClockTime(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
}

function getSectionRange(lines: readonly string[]) {
  const startText = lines[0]?.split('-')[0]
  const endText = lines[lines.length - 1]?.split('-')[1]
  if (!startText || !endText) {
    return null
  }
  return {
    start: parseClockTime(startText),
    end: parseClockTime(endText),
  }
}

const currentSection = computed(() => {
  const minutesNow = now.value.getHours() * 60 + now.value.getMinutes()
  for (const row of activeSchedule.value) {
    const range = getSectionRange(row.lines)
    if (range && minutesNow >= range.start && minutesNow <= range.end) {
      return row.section
    }
  }
  return null
})

const highlightCurrentSlot = computed(
  () => selectedTermModel.value === currentTerm.value && selectedWeek.value === currentWeek.value && visibleWeekdays.value.includes(currentWeekday.value),
)

const termOptions = computed(() => {
  if (props.courseTerms.length > 0) {
    return sortTermsForSelect(props.courseTerms).map((item) => item.name)
  }
  const terms = new Set<string>()
  for (const item of props.courseCalendar) terms.add(item.term)
  for (const item of props.freeTimes) terms.add(item.term)
  return Array.from(terms).sort((left, right) => right.localeCompare(left, 'zh-Hans-CN'))
})

const gridStyle = computed(() => ({
  gridTemplateColumns: `144px repeat(${visibleWeekdays.value.length}, minmax(188px, 1fr))`,
  gridTemplateRows: `42px repeat(${activeSchedule.value.length}, minmax(172px, 1fr))`,
  minWidth: `calc(144px + ${visibleWeekdays.value.length} * 188px)`,
  minHeight: `calc(42px + ${activeSchedule.value.length} * 172px)`,
}))

function selectedWeekDateText(weekday: number) {
  const startDate = selectedTermMeta.value?.term_start_date
  if (!startDate) {
    return weekdayLabels[weekday] ?? `周${weekday}`
  }
  const weekStart = new Date(`${startDate}T00:00:00`)
  if (Number.isNaN(weekStart.getTime())) {
    return weekdayLabels[weekday] ?? `周${weekday}`
  }
  const targetDate = new Date(weekStart)
  targetDate.setDate(weekStart.getDate() + (selectedWeek.value - 1) * 7 + (weekday - 1))
  return `${targetDate.getMonth() + 1}月${targetDate.getDate()}日 · ${weekdayLabels[weekday] ?? `周${weekday}`}`
}

function buildWeekRequestKey(term: string, weekNo: number) {
  return `${term}::${weekNo}`
}

async function loadCourseOutline() {
  const term = selectedTermModel.value.trim()
  if (!term) {
    outlineRows.value = []
    return
  }
  const cached = outlineCache.get(term)
  if (cached) {
    outlineRows.value = cached
    return
  }

  outlineRequestToken += 1
  const requestToken = outlineRequestToken
  outlineRows.value = []
  try {
    const items = await api.adminCourseCalendarOutline(term)
    if (requestToken !== outlineRequestToken) {
      return
    }
    outlineCache.set(term, items)
    outlineRows.value = items
  } catch {
    if (requestToken !== outlineRequestToken) {
      return
    }
    outlineRows.value = []
  }
}

async function loadSelectedWeekCourses() {
  const term = selectedTermModel.value.trim()
  const weekNo = selectedWeek.value
  if (!term || weekNo <= 0) {
    courseCalendarRows.value = []
    return
  }
  const cacheKey = buildWeekRequestKey(term, weekNo)
  const cached = courseCalendarCache.get(cacheKey)
  if (cached) {
    courseCalendarRows.value = cached
    return
  }

  courseRequestToken += 1
  const requestToken = courseRequestToken
  courseCalendarRows.value = []
  try {
    const items = (await api.adminCourseCalendar(term, weekNo)) ?? []
    if (requestToken !== courseRequestToken) {
      return
    }
    courseCalendarCache.set(cacheKey, items)
    courseCalendarRows.value = items
  } catch {
    if (requestToken !== courseRequestToken) {
      return
    }
    courseCalendarRows.value = []
  }
}

async function loadSelectedWeekFreeTimes() {
  const term = selectedTermModel.value.trim()
  const weekNo = selectedWeek.value
  if (!term || weekNo <= 0) {
    freeTimeRows.value = []
    return
  }
  const cacheKey = buildWeekRequestKey(term, weekNo)
  const cached = freeTimeCache.get(cacheKey)
  if (cached) {
    freeTimeRows.value = cached
    return
  }

  freeTimeRequestToken += 1
  const requestToken = freeTimeRequestToken
  freeTimeRows.value = []
  try {
    const items = (await api.adminFreeTimeCalendar(term, weekNo)) ?? []
    if (requestToken !== freeTimeRequestToken) {
      return
    }
    freeTimeCache.set(cacheKey, items)
    freeTimeRows.value = items
  } catch {
    if (requestToken !== freeTimeRequestToken) {
      return
    }
    freeTimeRows.value = []
  }
}

function scheduleOutlineLoad() {
  const token = ++scheduledOutlineLoadToken
  void nextTick().then(() => {
    if (token !== scheduledOutlineLoadToken) {
      return
    }
    void loadCourseOutline()
  })
}

function scheduleCourseWeekLoad() {
  const token = ++scheduledCourseLoadToken
  void nextTick().then(() => {
    if (token !== scheduledCourseLoadToken) {
      return
    }
    void loadSelectedWeekCourses()
  })
}

function scheduleFreeTimeWeekLoad() {
  const token = ++scheduledFreeTimeLoadToken
  void nextTick().then(() => {
    if (token !== scheduledFreeTimeLoadToken) {
      return
    }
    void loadSelectedWeekFreeTimes()
  })
}

const selectedWeekCourseMap = computed(() => {
  const map = new Map<string, CourseCalendarItem>()
  for (const item of courseCalendarRows.value) {
    map.set(`${item.course_group_id}:${item.weekday}:${item.section}`, item)
  }
  return map
})

const selectedWeekRecordedRateRange = computed(() => {
  const rates = courseCalendarRows.value
    .filter((item) => item.has_attendance_record)
    .map((item) => clampAttendanceRate(item.attendance_rate))

  if (rates.length === 0) {
    return {
      minRate: 0,
      maxRate: 0,
    }
  }

  return {
    minRate: Math.min(...rates),
    maxRate: Math.max(...rates),
  }
})

const courseCells = computed(() =>
  activeSchedule.value.map((row) =>
    visibleWeekdays.value.map((weekday) => {
      const items = outlineRows.value
        .filter((item) => item.weekday === weekday && item.section === row.section)
        .map<CalendarCellCourseItem>((item) => {
          const selectedWeekDetail = selectedWeekCourseMap.value.get(`${item.course_group_id}:${item.weekday}:${item.section}`)
          const containsSelectedWeek = item.week_nos.includes(selectedWeek.value)
          return {
            key: `${item.course_group_id}:${item.weekday}:${item.section}`,
            courseGroupId: item.course_group_id,
            courseId: item.course_id,
            selectedLessonId: selectedWeekDetail?.id ?? null,
            selectedHasAttendanceRecord: selectedWeekDetail?.has_attendance_record ?? false,
            selectedAttendanceRate: typeof selectedWeekDetail?.attendance_rate === 'number' ? selectedWeekDetail.attendance_rate : null,
            selectedStudentCount: selectedWeekDetail?.student_count ?? 0,
            selectedRecordCount: selectedWeekDetail?.record_count ?? 0,
            selectedLateCount: selectedWeekDetail?.late_count ?? 0,
            selectedAbsentCount: selectedWeekDetail?.absent_count ?? 0,
            selectedLeaveCount: selectedWeekDetail?.leave_count ?? 0,
            courseName: item.course_name,
            teacherName: item.teacher_name,
            locations: item.locations,
            classNames: item.class_names,
            weekNos: item.week_nos,
            containsSelectedWeek,
          }
        })
      return items.sort((left, right) => {
        const leftCurrent = left.containsSelectedWeek ? 0 : 1
        const rightCurrent = right.containsSelectedWeek ? 0 : 1
        if (leftCurrent !== rightCurrent) return leftCurrent - rightCurrent
        return left.courseName.localeCompare(right.courseName, 'zh-Hans-CN')
      })
    }),
  ),
)

const freeTimeCells = computed(() =>
  activeSchedule.value.map((row) =>
    visibleWeekdays.value.map((weekday) =>
      Array.from(
        new Map(
          freeTimeRows.value
            .filter((item) => item.term === selectedTermModel.value && item.weekday === weekday && item.section === row.section)
            .map((item) => [item.login_id, item]),
        ).values(),
      ).sort((left, right) => left.real_name.localeCompare(right.real_name, 'zh-Hans-CN')),
    ),
  ),
)

const selectedWeekFreeTimeCountByLoginId = computed(() => {
  const counts = new Map<string, number>()
  for (const item of freeTimeRows.value) {
    counts.set(item.login_id, (counts.get(item.login_id) ?? 0) + 1)
  }
  return counts
})

const selectedWeekFreeTimeCountRange = computed(() => {
  const counts = Array.from(selectedWeekFreeTimeCountByLoginId.value.values())
  if (counts.length === 0) {
    return {
      minCount: 0,
      maxCount: 0,
    }
  }
  return {
    minCount: Math.min(...counts),
    maxCount: Math.max(...counts),
  }
})

function freeTimePaletteForLoginId(loginId: string) {
  const count = selectedWeekFreeTimeCountByLoginId.value.get(loginId) ?? 0
  const hasCollapsedRange =
    selectedWeekFreeTimeCountRange.value.maxCount - selectedWeekFreeTimeCountRange.value.minCount <= 0.000001
  return paletteForRelativeAttendanceRate(
    hasCollapsedRange
      ? 0.5
      : normalizeValueWithinRange(
          count,
          selectedWeekFreeTimeCountRange.value.minCount,
          selectedWeekFreeTimeCountRange.value.maxCount,
        ),
  )
}

const hoveredFreeTimeCellKeys = computed(() => {
  const keys = new Set<string>()
  if (!hoveredFreeTimeLoginId.value) {
    return keys
  }
  for (const item of freeTimeRows.value) {
    if (item.login_id === hoveredFreeTimeLoginId.value) {
      keys.add(`${item.weekday}:${item.section}`)
    }
  }
  return keys
})

function formatWeekText(weeks: number[]) {
  return `第 ${weeks.join('、')} 周`
}

function uncheckedCount(studentCount: number, recordCount: number) {
  return Math.max(0, studentCount - recordCount)
}

function courseTooltipLines(item: CalendarCellCourseItem) {
  return [
    formatWeekText(item.weekNos),
    item.locations.join('、') || '-',
    item.classNames.join('、') || '未关联班级',
  ]
}

function courseTooltipSummaryItems(item: CalendarCellCourseItem) {
  if (!item.selectedHasAttendanceRecord) {
    return []
  }
  return [
    { key: 'unrecorded', label: '未查', count: uncheckedCount(item.selectedStudentCount, item.selectedRecordCount), className: attendanceStatusBadgeClass(null) },
    { key: 'late', label: '迟到', count: item.selectedLateCount, className: attendanceStatusBadgeClass(1) },
    { key: 'absent', label: '缺勤', count: item.selectedAbsentCount, className: attendanceStatusBadgeClass(2) },
    { key: 'leave', label: '请假', count: item.selectedLeaveCount, className: attendanceStatusBadgeClass(3) },
  ].filter((summary) => summary.count > 0)
}

function courseTagStyle(item: CalendarCellCourseItem) {
  if (!item.containsSelectedWeek || !item.selectedHasAttendanceRecord || item.selectedAttendanceRate === null) {
    return {}
  }

  const palette = paletteForAttendanceRate(
    item.selectedAttendanceRate,
    selectedWeekRecordedRateRange.value.minRate,
    selectedWeekRecordedRateRange.value.maxRate,
  )

  return {
    '--course-tag-bg': mixHex(palette[1], '#F4EFE8', 0.56),
    '--course-tag-text': palette[3],
    '--course-tag-border': mixHex(palette[2], palette[3], 0.34),
    '--course-tag-hover-bg': mixHex(palette[1], '#FFFFFF', 0.28),
  }
}

function freeTimeTagStyle(item: FreeTimeItem) {
  if (hoveredFreeTimeLoginId.value && hoveredFreeTimeLoginId.value !== item.login_id) {
    return {
      '--course-tag-bg': 'rgba(92, 82, 75, 0.08)',
      '--course-tag-hover-bg': 'rgba(92, 82, 75, 0.12)',
      '--course-tag-text': 'rgba(107, 96, 86, 0.78)',
    }
  }

  const palette = freeTimePaletteForLoginId(item.login_id)

  return {
    '--course-tag-bg': mixHex(palette[1], '#F4EFE8', 0.56),
    '--course-tag-hover-bg': mixHex(palette[1], '#FFFFFF', 0.28),
    '--course-tag-text': palette[3],
    '--course-tag-border': mixHex(palette[2], palette[3], 0.3),
  }
}

function freeTimeCellStyle(weekday: number, section: number) {
  const loginId = hoveredFreeTimeLoginId.value
  if (!loginId || !hoveredFreeTimeCellKeys.value.has(`${weekday}:${section}`)) {
    return {}
  }

  const palette = freeTimePaletteForLoginId(loginId)
  return {
    '--course-calendar-free-highlight-bg': mixHex(palette[1], '#F4EFE8', 0.62),
  }
}

function showCourseTooltip(event: MouseEvent, item: CalendarCellCourseItem) {
  hoveredCourse.value = {
    title: `${item.courseName} · ${item.teacherName}`,
    lines: courseTooltipLines(item),
    summaryItems: courseTooltipSummaryItems(item),
    x: event.clientX,
    y: event.clientY,
  }
}

function openCourseCell(item: CalendarCellCourseItem) {
  if (!item.containsSelectedWeek || !item.selectedLessonId) {
    return
  }
  emit('openAttendanceDetail', {
    sessionId: item.selectedLessonId,
    courseId: item.courseId,
    groupId: item.courseGroupId,
  })
}

function moveCourseTooltip(event: MouseEvent) {
  if (!hoveredCourse.value) {
    return
  }
  hoveredCourse.value = {
    ...hoveredCourse.value,
    x: event.clientX,
    y: event.clientY,
  }
}

function hideCourseTooltip() {
  hoveredCourse.value = null
}

function highlightFreeTimeUser(loginId: string) {
  hoveredFreeTimeLoginId.value = loginId
}

function clearFreeTimeHighlight() {
  hoveredFreeTimeLoginId.value = ''
}

function openFreeTimeUser(loginId: string) {
  emit('openCalendarUser', loginId)
}

function updateTooltipSize() {
  const element = tooltipRef.value
  if (!element) {
    tooltipSize.value = { width: 0, height: 0 }
    return
  }
  tooltipSize.value = {
    width: element.offsetWidth,
    height: element.offsetHeight,
  }
}

const tooltipStyle = computed(() => {
  if (!hoveredCourse.value) {
    return {}
  }
  const gap = 6
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const maxLeft = Math.max(12, viewportWidth - tooltipSize.value.width - 12)
  const maxTop = Math.max(12, viewportHeight - tooltipSize.value.height - 12)
  const preferRight = hoveredCourse.value.x + gap + tooltipSize.value.width <= viewportWidth - 12
  const preferBottom = hoveredCourse.value.y + gap + tooltipSize.value.height <= viewportHeight - 12
  const left = preferRight
    ? Math.min(hoveredCourse.value.x + gap, maxLeft)
    : Math.max(12, hoveredCourse.value.x - tooltipSize.value.width - gap)
  const top = preferBottom
    ? Math.min(hoveredCourse.value.y + gap, maxTop)
    : Math.max(12, hoveredCourse.value.y - tooltipSize.value.height - gap)
  return {
    left: `${left}px`,
    top: `${top}px`,
  }
})

watch(currentTerm, (value) => {
  if (!selectedTermModel.value || !termOptions.value.includes(selectedTermModel.value)) {
    selectedTermModel.value = value
  }
})

watch(hoveredCourse, async (value) => {
  if (!value) {
    tooltipSize.value = { width: 0, height: 0 }
    return
  }
  await nextTick()
  updateTooltipSize()
})

onMounted(() => {
  selectedWeek.value = currentWeek.value
  window.addEventListener('resize', updateTooltipSize)
  timerId = window.setInterval(() => {
    now.value = new Date()
  }, 60_000)
})

watch(termOptions, (terms) => {
  if (!selectedTermModel.value || !terms.includes(selectedTermModel.value)) {
    selectedTermModel.value = terms.includes(currentTerm.value) ? currentTerm.value : (terms[0] ?? '')
  }
}, { immediate: true })

watch(selectedTermModel, () => {
  selectedWeek.value = currentWeek.value
  hideCourseTooltip()
  clearFreeTimeHighlight()
  scheduleOutlineLoad()
}, { immediate: true })

watch(
  () => [selectedTermModel.value, selectedWeek.value] as const,
  () => {
    hideCourseTooltip()
    clearFreeTimeHighlight()
    if (showingFreeTime.value) {
      scheduleFreeTimeWeekLoad()
      return
    }
    scheduleCourseWeekLoad()
  },
  { immediate: true },
)

watch(showingFreeTime, (value) => {
  hideCourseTooltip()
  clearFreeTimeHighlight()
  if (value) {
    scheduleFreeTimeWeekLoad()
    return
  }
  scheduleCourseWeekLoad()
})

onBeforeUnmount(() => {
  window.clearInterval(timerId)
  window.removeEventListener('resize', updateTooltipSize)
  hoveredCourse.value = null
  hoveredFreeTimeLoginId.value = ''
})
</script>

<template>
  <section class="workspace-card course-calendar-panel">
    <div class="course-calendar-toolbar course-calendar-toolbar-primary">
      <label class="field course-calendar-term-field course-calendar-toolbar-term">
        <select v-model="selectedTermModel">
          <option v-for="term in termOptions" :key="term" :value="term">{{ term }}</option>
        </select>
      </label>
      <div class="course-calendar-weeks">
        <button
          v-for="weekNo in WEEK_COUNT"
          :key="weekNo"
          class="ghost-button compact-button course-calendar-week-button"
          :class="{
            selected: selectedWeek === weekNo,
            current: selectedTermModel === currentTerm && currentWeek === weekNo,
          }"
          type="button"
          @click="selectedWeek = weekNo"
        >
          {{ weekNo }}
        </button>
      </div>
      <button
        class="ghost-button compact-button course-calendar-weekend-toggle"
        type="button"
        @click="showWeekend = !showWeekend"
      >
        {{ showWeekend ? '隐藏周末' : '显示周末' }}
      </button>
    </div>

    <div class="course-calendar-grid-wrap">
      <div class="course-calendar-grid" :style="gridStyle">
        <div class="course-calendar-corner course-calendar-corner-top" :class="{ 'course-calendar-corner-top-active': showingFreeTime }">
          <button
            class="course-calendar-switch-text course-calendar-switch"
            :class="{ 'course-calendar-switch-text-active': showingFreeTime }"
            type="button"
            @click="showingFreeTime = !showingFreeTime"
          >
            {{ showingFreeTime ? '切换到课程' : '切换到空闲时间' }}
          </button>
        </div>
        <div
          v-for="weekday in visibleWeekdays"
          :key="weekday"
          class="course-calendar-day"
          :class="{ 'course-calendar-day-active': highlightCurrentSlot && currentWeekday === weekday }"
        >
          {{ selectedWeekDateText(weekday) }}
        </div>

        <template v-for="(row, rowIndex) in activeSchedule" :key="row.section">
          <div
            class="course-calendar-section"
            :class="{ 'course-calendar-section-active': highlightCurrentSlot && currentSection === row.section }"
          >
            <strong>{{ row.label }}</strong>
            <small>{{ row.lines[0] }}</small>
            <small>{{ row.lines[1] }}</small>
          </div>
          <div
            v-for="(weekday, columnIndex) in visibleWeekdays"
            :key="`${row.section}-${weekday}`"
            class="course-calendar-cell"
            :class="{
              'course-calendar-cell-active-column': highlightCurrentSlot && currentWeekday === weekday,
              'course-calendar-cell-active-current': highlightCurrentSlot && currentWeekday === weekday && currentSection === row.section,
              'course-calendar-cell-free-highlight': showingFreeTime && hoveredFreeTimeCellKeys.has(`${weekday}:${row.section}`),
            }"
            :style="showingFreeTime ? freeTimeCellStyle(weekday, row.section) : undefined"
          >
            <template v-if="!showingFreeTime">
              <button
                v-for="item in courseCells[rowIndex][columnIndex]"
                :key="`course-${item.key}`"
                class="course-tag course-tag-button"
                :class="{
                  'course-tag-muted': !item.containsSelectedWeek || !item.selectedHasAttendanceRecord,
                  'course-tag-current-week': item.containsSelectedWeek,
                }"
                :style="courseTagStyle(item)"
                type="button"
                :disabled="!item.containsSelectedWeek || !item.selectedLessonId"
                @mouseenter="showCourseTooltip($event, item)"
                @mousemove="moveCourseTooltip"
                @mouseleave="hideCourseTooltip"
                @click="openCourseCell(item)"
              >
                {{ item.courseName }}
              </button>
            </template>
            <template v-else>
              <button
                v-for="item in freeTimeCells[rowIndex][columnIndex]"
                :key="`free-${item.id}`"
                class="course-tag course-tag-free course-tag-button"
                :class="{
                  'course-tag-free-dimmed': hoveredFreeTimeLoginId && hoveredFreeTimeLoginId !== item.login_id,
                  'course-tag-free-highlighted': hoveredFreeTimeLoginId === item.login_id,
                }"
                :style="freeTimeTagStyle(item)"
                type="button"
                :title="`${item.real_name}（${item.login_id}）`"
                @mouseenter="highlightFreeTimeUser(item.login_id)"
                @mouseleave="clearFreeTimeHighlight"
                @click="openFreeTimeUser(item.login_id)"
              >
                {{ item.real_name }}
              </button>
            </template>
          </div>
        </template>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="hoveredCourse"
        ref="tooltipRef"
        class="course-floating-tooltip"
        :style="tooltipStyle"
      >
        <strong>{{ hoveredCourse.title }}</strong>
        <p v-for="line in hoveredCourse.lines" :key="line">{{ line }}</p>
        <div v-if="hoveredCourse.summaryItems.length > 0" class="attendance-session-summary course-floating-tooltip-summary">
          <span
            v-for="summary in hoveredCourse.summaryItems"
            :key="summary.key"
            class="status-badge attendance-session-summary-chip"
            :class="summary.className"
          >
            <span class="attendance-session-summary-label">{{ summary.label }}</span>
            <span class="attendance-session-summary-count">{{ summary.count }}</span>
          </span>
        </div>
      </div>
    </Teleport>
  </section>
</template>
