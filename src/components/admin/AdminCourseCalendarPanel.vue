<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { ClassItem, CourseCalendarItem, FreeTimeItem, SystemSetting } from '../../api'
import { weekdayLabels } from '../../constants'
import { parseFreeWeeks } from '../../utils/free-time'

const props = defineProps<{
  courseCalendar: CourseCalendarItem[]
  freeTimes: FreeTimeItem[]
  classes: ClassItem[]
  systemSettings: SystemSetting | null
}>()

const WEEK_COUNT = 16

const now = ref(new Date())
const showingFreeTime = ref(false)
const showWeekend = ref(false)
const selectedTerm = ref('')
const selectedWeek = ref(1)
const selectedGrade = ref('')
const selectedMajor = ref('')
const selectedClass = ref('')
const courseKeyword = ref('')
const teacherKeyword = ref('')
const buildingKeyword = ref('')
const hoveredCourse = ref<null | { title: string; lines: string[]; x: number; y: number }>(null)
const tooltipRef = ref<HTMLElement | null>(null)
const tooltipSize = ref({ width: 0, height: 0 })

let timerId = 0

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

const gradeOptions = computed(() =>
  Array.from(new Set(props.classes.map((item) => item.grade))).sort((left, right) => right - left),
)

const majorOptions = computed(() =>
  Array.from(
    new Set(
      props.classes
        .filter((item) => !selectedGrade.value || String(item.grade) === selectedGrade.value)
        .map((item) => item.major_name),
    ),
  ).sort((left, right) => left.localeCompare(right, 'zh-Hans-CN')),
)

const classOptions = computed(() =>
  Array.from(
    new Set(
      props.classes
        .filter((item) => (!selectedGrade.value || String(item.grade) === selectedGrade.value) && (!selectedMajor.value || item.major_name === selectedMajor.value))
        .map((item) => item.class_name),
    ),
  ).sort((left, right) => left.localeCompare(right, 'zh-Hans-CN')),
)

const buildingOptions = computed(() =>
  Array.from(new Set(props.courseCalendar.map((item) => item.building_name)))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, 'zh-Hans-CN')),
)

const currentTerm = computed(() => {
  const year = now.value.getFullYear()
  const month = now.value.getMonth() + 1
  if (month >= 2 && month <= 8) {
    return `${year - 1}-${year}-2`
  }
  return `${year}-${year + 1}-1`
})

const currentWeek = computed(() => {
  const startDate = props.systemSettings?.current_term_start_date
  if (!startDate || selectedTerm.value !== currentTerm.value) {
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
  () => selectedTerm.value === currentTerm.value && selectedWeek.value === currentWeek.value && visibleWeekdays.value.includes(currentWeekday.value),
)

const termOptions = computed(() => {
  const terms = new Set<string>([currentTerm.value])
  for (const item of props.courseCalendar) terms.add(item.term)
  for (const item of props.freeTimes) terms.add(item.term)
  return Array.from(terms).sort((left, right) => right.localeCompare(left, 'zh-Hans-CN'))
})

const gridStyle = computed(() => ({
  gridTemplateColumns: `144px repeat(${visibleWeekdays.value.length}, minmax(0, 1fr))`,
  gridTemplateRows: `42px repeat(${activeSchedule.value.length}, minmax(160px, 1fr))`,
}))

const filteredCourses = computed(() =>
  props.courseCalendar.filter((item) => {
    const byTerm = item.term === selectedTerm.value
    const byGrade = !selectedGrade.value || item.grades.some((grade) => String(grade) === selectedGrade.value)
    const byMajor = !selectedMajor.value || item.major_names.includes(selectedMajor.value)
    const byClass = !selectedClass.value || item.class_names.some((className) => className.includes(selectedClass.value.trim()))
    const byCourse = !courseKeyword.value || item.course_name.includes(courseKeyword.value.trim())
    const byTeacher = !teacherKeyword.value || item.teacher_name.includes(teacherKeyword.value.trim())
    const byBuilding = !buildingKeyword.value || item.building_name.includes(buildingKeyword.value.trim())
    return byTerm && byGrade && byMajor && byClass && byCourse && byTeacher && byBuilding
  }),
)

function freeTimeMatchesWeek(item: FreeTimeItem) {
  return parseFreeWeeks(item.free_weeks).includes(selectedWeek.value)
}

function mergeCourseItems(items: CourseCalendarItem[]) {
  const grouped = new Map<
    string,
    {
      key: string
      courseName: string
      teacherName: string
      buildingName: string
      roomName: string
      classNames: string[]
      weekNos: number[]
      containsSelectedWeek: boolean
    }
  >()

  for (const item of items) {
    const key = `${item.course_id}-${item.building_name}-${item.room_name}`
    const current = grouped.get(key)
    if (current) {
      current.weekNos.push(item.week_no)
      current.classNames.push(...item.class_names)
      if (item.week_no === selectedWeek.value) {
        current.containsSelectedWeek = true
      }
      continue
    }
    grouped.set(key, {
      key,
      courseName: item.course_name,
      teacherName: item.teacher_name,
      buildingName: item.building_name,
      roomName: item.room_name,
      classNames: [...item.class_names],
      weekNos: [item.week_no],
      containsSelectedWeek: item.week_no === selectedWeek.value,
    })
  }

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      weekNos: Array.from(new Set(item.weekNos)).sort((left, right) => left - right),
      classNames: Array.from(new Set(item.classNames)).sort((left, right) => left.localeCompare(right, 'zh-Hans-CN')),
    }))
    .sort((left, right) => {
      const leftCurrent = left.containsSelectedWeek ? 0 : 1
      const rightCurrent = right.containsSelectedWeek ? 0 : 1
      if (leftCurrent !== rightCurrent) return leftCurrent - rightCurrent
      return left.courseName.localeCompare(right.courseName, 'zh-Hans-CN')
    })
}

const courseCells = computed(() =>
  activeSchedule.value.map((row) =>
    visibleWeekdays.value.map((weekday) =>
      mergeCourseItems(filteredCourses.value.filter((item) => item.weekday === weekday && item.section === row.section)),
    ),
  ),
)

const freeTimeCells = computed(() =>
  activeSchedule.value.map((row) =>
    visibleWeekdays.value.map((weekday) =>
      Array.from(
        new Map(
          props.freeTimes
            .filter(
              (item) => item.term === selectedTerm.value && item.weekday === weekday && item.section === row.section && freeTimeMatchesWeek(item),
            )
            .map((item) => [item.student_id, item]),
        ).values(),
      ).sort((left, right) => left.real_name.localeCompare(right.real_name, 'zh-Hans-CN')),
    ),
  ),
)

function formatWeekText(weeks: number[]) {
  return `第 ${weeks.join('、')} 周`
}

function courseTooltipLines(item: (typeof courseCells.value)[number][number][number]) {
  return [
    `${item.teacherName} · ${formatWeekText(item.weekNos)}`,
    `${item.buildingName}-${item.roomName}`,
    item.classNames.join('、') || '未关联班级',
  ]
}

function showCourseTooltip(event: MouseEvent, item: (typeof courseCells.value)[number][number][number]) {
  hoveredCourse.value = {
    title: item.courseName,
    lines: courseTooltipLines(item),
    x: event.clientX,
    y: event.clientY,
  }
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
  if (!selectedTerm.value) {
    selectedTerm.value = value
  }
})

watch([selectedGrade, selectedMajor], () => {
  if (selectedMajor.value && !majorOptions.value.includes(selectedMajor.value)) {
    selectedMajor.value = ''
  }
  if (selectedClass.value && !classOptions.value.includes(selectedClass.value)) {
    selectedClass.value = ''
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

watch(
  () => props.systemSettings?.current_term_start_date,
  () => {
    if (selectedTerm.value === currentTerm.value) {
      selectedWeek.value = currentWeek.value
    }
  },
)

onMounted(() => {
  selectedTerm.value = termOptions.value.includes(currentTerm.value) ? currentTerm.value : (termOptions.value[0] ?? '')
  selectedWeek.value = currentWeek.value
  window.addEventListener('resize', updateTooltipSize)
  timerId = window.setInterval(() => {
    now.value = new Date()
  }, 60_000)
})

onBeforeUnmount(() => {
  window.clearInterval(timerId)
  window.removeEventListener('resize', updateTooltipSize)
  hoveredCourse.value = null
})
</script>

<template>
  <section class="workspace-card course-calendar-panel">
    <div class="section-heading course-calendar-heading">
      <h2>全院课程表</h2>
    </div>

    <div class="course-calendar-toolbar course-calendar-toolbar-primary">
      <button
        class="ghost-button compact-button course-calendar-switch"
        :class="{ selected: showingFreeTime }"
        type="button"
        @click="showingFreeTime = !showingFreeTime"
      >
        切换课程/空闲时间
      </button>
      <label class="field course-calendar-term-field">
        <select v-model="selectedTerm">
          <option v-for="term in termOptions" :key="term" :value="term">{{ term }}</option>
        </select>
      </label>
      <div class="course-calendar-weeks">
        <button
          v-for="weekNo in WEEK_COUNT"
          :key="weekNo"
          class="ghost-button compact-button course-calendar-week-button"
          :class="{ selected: selectedWeek === weekNo }"
          type="button"
          @click="selectedWeek = weekNo"
        >
          {{ weekNo }}
        </button>
      </div>
      <button class="ghost-button compact-button" type="button" @click="showWeekend = !showWeekend">
        {{ showWeekend ? '隐藏周末' : '显示周末' }}
      </button>
    </div>

    <div class="table-filters course-calendar-filters" :class="{ 'filters-muted': showingFreeTime }">
      <label class="field">
        <span>年级</span>
        <select v-model="selectedGrade" :disabled="showingFreeTime">
          <option value="">全部</option>
          <option v-for="grade in gradeOptions" :key="grade" :value="String(grade)">{{ grade }}</option>
        </select>
      </label>
      <label class="field">
        <span>专业</span>
        <select v-model="selectedMajor" :disabled="showingFreeTime">
          <option value="">全部</option>
          <option v-for="item in majorOptions" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>
      <label class="field">
        <span>班级</span>
        <select v-model="selectedClass" :disabled="showingFreeTime">
          <option value="">全部</option>
          <option v-for="item in classOptions" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>
      <label class="field">
        <span>课程名称</span>
        <input v-model="courseKeyword" :disabled="showingFreeTime" />
      </label>
      <label class="field">
        <span>教师</span>
        <input v-model="teacherKeyword" :disabled="showingFreeTime" />
      </label>
      <label class="field">
        <span>教学楼</span>
        <select v-model="buildingKeyword" :disabled="showingFreeTime">
          <option value="">全部</option>
          <option v-for="item in buildingOptions" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>
    </div>

    <div class="course-calendar-grid-wrap">
      <div class="course-calendar-grid" :style="gridStyle">
        <div class="course-calendar-corner course-calendar-corner-top"></div>
        <div
          v-for="weekday in visibleWeekdays"
          :key="weekday"
          class="course-calendar-day"
          :class="{ 'course-calendar-day-active': highlightCurrentSlot && currentWeekday === weekday }"
        >
          {{ weekdayLabels[weekday] }}
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
            }"
          >
            <template v-if="!showingFreeTime">
              <div
                v-for="item in courseCells[rowIndex][columnIndex]"
                :key="`course-${item.key}`"
                class="course-tag"
                :class="{ 'course-tag-muted': !item.containsSelectedWeek }"
                @mouseenter="showCourseTooltip($event, item)"
                @mousemove="moveCourseTooltip"
                @mouseleave="hideCourseTooltip"
              >
                {{ item.courseName }}
              </div>
            </template>
            <template v-else>
              <div
                v-for="item in freeTimeCells[rowIndex][columnIndex]"
                :key="`free-${item.id}`"
                class="course-tag course-tag-free"
                :title="`${item.real_name}（${item.student_id}）`"
              >
                {{ item.real_name }}
              </div>
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
      </div>
    </Teleport>
  </section>
</template>
