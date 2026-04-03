<script setup lang="ts">
import { computed, onMounted, ref, watch, type Ref } from 'vue'

import {
  api,
  type OverviewClassRankingItem,
  type OverviewCourseRankingItem,
  type OverviewRecentAbnormalItem,
  type OverviewRecentSessionItem,
  type OverviewStudentRankingItem,
} from '../../api'
import { attendanceStatusBadgeClass, sectionLabels, statusLabels, weekdayLabels } from '../../constants'
import type { AdminAttendanceDetailTarget } from './shared-types'
import type { AdminOverviewProps } from './types'

defineProps<AdminOverviewProps>()

const emit = defineEmits<{
  openCourse: [courseId: number]
  openClass: [classId: number]
  openStudent: [studentRefId: number]
  openAttendanceDetail: [target: AdminAttendanceDetailTarget]
}>()

const OVERVIEW_LAZY_BATCH = 100

type OverviewSectionKey =
  | 'course_rankings'
  | 'class_rankings'
  | 'student_rankings'
  | 'recent_sessions'
  | 'recent_abnormal_students'

type OverviewOrder = 'asc' | 'desc'

type LazySectionState<T> = {
  items: Ref<T[]>
  total: Ref<number>
  hasMore: Ref<boolean>
  loading: Ref<boolean>
  minRate: Ref<number>
  maxRate: Ref<number>
  requestToken: number
}

function createLazySectionState<T>(): LazySectionState<T> {
  return {
    items: ref([] as T[]) as Ref<T[]>,
    total: ref(0),
    hasMore: ref(true),
    loading: ref(false),
    minRate: ref(0),
    maxRate: ref(0),
    requestToken: 0,
  }
}

const courseRankAsc = ref(false)
const classRankAsc = ref(false)
const studentRankAsc = ref(false)

const courseSection = createLazySectionState<OverviewCourseRankingItem>()
const classSection = createLazySectionState<OverviewClassRankingItem>()
const studentSection = createLazySectionState<OverviewStudentRankingItem>()
const sessionSection = createLazySectionState<OverviewRecentSessionItem>()
const abnormalSection = createLazySectionState<OverviewRecentAbnormalItem>()

const courseRankings = computed<OverviewCourseRankingItem[]>(() => courseSection.items.value)
const classRankings = computed<OverviewClassRankingItem[]>(() => classSection.items.value)
const studentRankings = computed<OverviewStudentRankingItem[]>(() => studentSection.items.value)
const recentSessions = computed<OverviewRecentSessionItem[]>(() => sessionSection.items.value)
const recentAbnormalStudents = computed<OverviewRecentAbnormalItem[]>(() => abnormalSection.items.value)

function sectionOrder(section: OverviewSectionKey): OverviewOrder | undefined {
  if (section === 'course_rankings') {
    return courseRankAsc.value ? 'asc' : 'desc'
  }
  if (section === 'class_rankings') {
    return classRankAsc.value ? 'asc' : 'desc'
  }
  if (section === 'student_rankings') {
    return studentRankAsc.value ? 'asc' : 'desc'
  }
  return undefined
}

async function loadOverviewSection(section: OverviewSectionKey, reset = false) {
  if (section === 'course_rankings') {
    if (!reset && (courseSection.loading.value || !courseSection.hasMore.value)) {
      return
    }
    const requestToken = courseSection.requestToken + 1
    courseSection.requestToken = requestToken
    courseSection.loading.value = true
    if (reset) {
      courseSection.items.value = []
      courseSection.total.value = 0
      courseSection.hasMore.value = true
      courseSection.minRate.value = 0
      courseSection.maxRate.value = 0
    }
    try {
      const payload = await api.adminOverview({
        section,
        offset: reset ? 0 : courseSection.items.value.length,
        limit: OVERVIEW_LAZY_BATCH,
        order: sectionOrder(section),
      })
      if (courseSection.requestToken !== requestToken) {
        return
      }
      courseSection.items.value = reset
        ? payload.course_rankings
        : [...courseSection.items.value, ...payload.course_rankings]
      courseSection.total.value = payload.course_rankings_total
      courseSection.hasMore.value = payload.course_rankings_has_more
      courseSection.minRate.value = payload.course_rankings_min_rate
      courseSection.maxRate.value = payload.course_rankings_max_rate
    } finally {
      if (courseSection.requestToken === requestToken) {
        courseSection.loading.value = false
      }
    }
    return
  }

  if (section === 'class_rankings') {
    if (!reset && (classSection.loading.value || !classSection.hasMore.value)) {
      return
    }
    const requestToken = classSection.requestToken + 1
    classSection.requestToken = requestToken
    classSection.loading.value = true
    if (reset) {
      classSection.items.value = []
      classSection.total.value = 0
      classSection.hasMore.value = true
      classSection.minRate.value = 0
      classSection.maxRate.value = 0
    }
    try {
      const payload = await api.adminOverview({
        section,
        offset: reset ? 0 : classSection.items.value.length,
        limit: OVERVIEW_LAZY_BATCH,
        order: sectionOrder(section),
      })
      if (classSection.requestToken !== requestToken) {
        return
      }
      classSection.items.value = reset
        ? payload.class_rankings
        : [...classSection.items.value, ...payload.class_rankings]
      classSection.total.value = payload.class_rankings_total
      classSection.hasMore.value = payload.class_rankings_has_more
      classSection.minRate.value = payload.class_rankings_min_rate
      classSection.maxRate.value = payload.class_rankings_max_rate
    } finally {
      if (classSection.requestToken === requestToken) {
        classSection.loading.value = false
      }
    }
    return
  }

  if (section === 'student_rankings') {
    if (!reset && (studentSection.loading.value || !studentSection.hasMore.value)) {
      return
    }
    const requestToken = studentSection.requestToken + 1
    studentSection.requestToken = requestToken
    studentSection.loading.value = true
    if (reset) {
      studentSection.items.value = []
      studentSection.total.value = 0
      studentSection.hasMore.value = true
      studentSection.minRate.value = 0
      studentSection.maxRate.value = 0
    }
    try {
      const payload = await api.adminOverview({
        section,
        offset: reset ? 0 : studentSection.items.value.length,
        limit: OVERVIEW_LAZY_BATCH,
        order: sectionOrder(section),
      })
      if (studentSection.requestToken !== requestToken) {
        return
      }
      studentSection.items.value = reset
        ? payload.student_rankings
        : [...studentSection.items.value, ...payload.student_rankings]
      studentSection.total.value = payload.student_rankings_total
      studentSection.hasMore.value = payload.student_rankings_has_more
      studentSection.minRate.value = payload.student_rankings_min_rate
      studentSection.maxRate.value = payload.student_rankings_max_rate
    } finally {
      if (studentSection.requestToken === requestToken) {
        studentSection.loading.value = false
      }
    }
    return
  }

  if (section === 'recent_sessions') {
    if (!reset && (sessionSection.loading.value || !sessionSection.hasMore.value)) {
      return
    }
    const requestToken = sessionSection.requestToken + 1
    sessionSection.requestToken = requestToken
    sessionSection.loading.value = true
    if (reset) {
      sessionSection.items.value = []
      sessionSection.total.value = 0
      sessionSection.hasMore.value = true
      sessionSection.minRate.value = 0
      sessionSection.maxRate.value = 0
    }
    try {
      const payload = await api.adminOverview({
        section,
        offset: reset ? 0 : sessionSection.items.value.length,
        limit: OVERVIEW_LAZY_BATCH,
      })
      if (sessionSection.requestToken !== requestToken) {
        return
      }
      sessionSection.items.value = reset
        ? payload.recent_sessions
        : [...sessionSection.items.value, ...payload.recent_sessions]
      sessionSection.total.value = payload.recent_sessions_total
      sessionSection.hasMore.value = payload.recent_sessions_has_more
      sessionSection.minRate.value = payload.recent_sessions_min_rate
      sessionSection.maxRate.value = payload.recent_sessions_max_rate
    } finally {
      if (sessionSection.requestToken === requestToken) {
        sessionSection.loading.value = false
      }
    }
    return
  }

  if (!reset && (abnormalSection.loading.value || !abnormalSection.hasMore.value)) {
    return
  }
  const requestToken = abnormalSection.requestToken + 1
  abnormalSection.requestToken = requestToken
  abnormalSection.loading.value = true
  if (reset) {
      abnormalSection.items.value = []
      abnormalSection.total.value = 0
      abnormalSection.hasMore.value = true
      abnormalSection.minRate.value = 0
      abnormalSection.maxRate.value = 0
    }
  try {
    const payload = await api.adminOverview({
      section,
      offset: reset ? 0 : abnormalSection.items.value.length,
      limit: OVERVIEW_LAZY_BATCH,
    })
    if (abnormalSection.requestToken !== requestToken) {
      return
    }
    abnormalSection.items.value = reset
      ? payload.recent_abnormal_students
      : [...abnormalSection.items.value, ...payload.recent_abnormal_students]
    abnormalSection.total.value = payload.recent_abnormal_students_total
    abnormalSection.hasMore.value = payload.recent_abnormal_students_has_more
  } finally {
    if (abnormalSection.requestToken === requestToken) {
      abnormalSection.loading.value = false
    }
  }
}

function handleListScroll(event: Event, target: OverviewSectionKey) {
  const element = event.currentTarget as HTMLElement | null
  if (!element) {
    return
  }
  if (element.scrollTop + element.clientHeight >= element.scrollHeight - 24) {
    void loadOverviewSection(target)
  }
}

onMounted(() => {
  void Promise.all([
    loadOverviewSection('course_rankings', true),
    loadOverviewSection('class_rankings', true),
    loadOverviewSection('student_rankings', true),
    loadOverviewSection('recent_sessions', true),
    loadOverviewSection('recent_abnormal_students', true),
  ])
})

watch(courseRankAsc, () => {
  void loadOverviewSection('course_rankings', true)
})

watch(classRankAsc, () => {
  void loadOverviewSection('class_rankings', true)
})

watch(studentRankAsc, () => {
  void loadOverviewSection('student_rankings', true)
})

const attendanceTonePalettes = {
  present: ['#EEF8E8', '#CFEABF', '#79C56B', '#0A9448'],
  late: ['#FFF7D9', '#FFE89A', '#F7BE38', '#B86E00'],
  absent: ['#FDEBEC', '#F8CBCE', '#E97C86', '#C61F26'],
  leave: ['#EBF7FD', '#C9E8F7', '#63B9E3', '#167FBC'],
  unrecorded: ['#F3F0EC', '#D7D1C9', '#A99E94', '#6B6056'],
} as const

function rateText(value: number) {
  const normalized = Number.isFinite(value) ? value : 0
  return `${(normalized * 100).toFixed(1).replace(/\.0$/, '')} %`
}

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

function mixHex(left: string, right: string, factor: number) {
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
  left: readonly [string, string, string, string],
  right: readonly [string, string, string, string],
  factor: number,
) {
  return left.map((value, index) => mixHex(value, right[index]!, factor)) as [string, string, string, string]
}

function paletteForRate(value: number) {
  const normalized = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
  if (normalized <= 0.5) {
    return mixPalette(attendanceTonePalettes.absent, attendanceTonePalettes.late, normalized / 0.5)
  }
  return mixPalette(attendanceTonePalettes.late, attendanceTonePalettes.present, (normalized - 0.5) / 0.5)
}

function normalizeRateWithinRange(value: number, minRate: number, maxRate: number) {
  const safeValue = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
  const safeMin = Math.max(0, Math.min(1, Number.isFinite(minRate) ? minRate : 0))
  const safeMax = Math.max(0, Math.min(1, Number.isFinite(maxRate) ? maxRate : 0))
  if (safeMax - safeMin <= 0.000001) {
    return safeValue
  }
  return Math.max(0, Math.min(1, (safeValue - safeMin) / (safeMax - safeMin)))
}

function entryToneStyle(palette: readonly [string, string, string, string]) {
  return {
    '--overview-entry-bg': 'rgba(92, 82, 75, 0.06)',
    '--overview-entry-hover-bg': 'rgba(92, 82, 75, 0.09)',
    '--overview-entry-status-tint': mixHex(palette[0], '#FFFFFF', 0.14),
    '--overview-entry-status-hover-tint': mixHex(palette[1], '#FFFFFF', 0.18),
    '--overview-entry-lead-bg': mixHex(palette[1], '#D7D1C9', 0.22),
    '--overview-entry-lead-text': palette[3],
    '--overview-entry-accent': palette[3],
  }
}

function rateThemeStyle(value: number, minRate: number, maxRate: number) {
  const actualRate = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
  const palette = paletteForRate(normalizeRateWithinRange(actualRate, minRate, maxRate))
  const percent = `${actualRate * 100}%`
  return {
    '--overview-rate-width': percent,
    '--overview-rate-fill-color': mixHex(palette[0], '#F4EFE8', 0.5),
    '--overview-rate-hover-fill-color': mixHex(palette[1], '#E8DFD4', 0),
    '--overview-entry-lead-bg': mixHex(palette[1], '#D7D1C9', 0.22),
    '--overview-entry-lead-text': palette[3],
  }
}

function statusThemeStyle(status: number) {
  if (status === 0) {
    return entryToneStyle(attendanceTonePalettes.present)
  }
  if (status === 1) {
    return entryToneStyle(attendanceTonePalettes.late)
  }
  if (status === 2) {
    return entryToneStyle(attendanceTonePalettes.absent)
  }
  if (status === 3) {
    return entryToneStyle(attendanceTonePalettes.leave)
  }
  return entryToneStyle(attendanceTonePalettes.unrecorded)
}

function weekSectionText(weekNo: number, weekday: number, section: number) {
  return `第${weekNo}周 · ${weekdayLabels[weekday] ?? `周${weekday}`} · ${sectionLabels[section] ?? `第 ${section} 段`}`
}

function sessionLeftTitleText(item: OverviewRecentSessionItem) {
  return weekSectionText(item.week_no, item.weekday, item.section)
}

function sessionLeftSubtitleText(item: OverviewRecentSessionItem) {
  return `${item.course_name} · ${item.teacher_name}`
}

function sessionRightTitleText(item: OverviewRecentSessionItem) {
  const summaries = sessionSummaryItems(item).map((entry) => `${entry.label} ${entry.count}`)
  return summaries.length > 0 ? `${summaries.join(' / ')} ${rateText(item.attendance_rate)}` : rateText(item.attendance_rate)
}

function sessionSummaryItems(item: OverviewRecentSessionItem) {
  return [
    { key: 'late', label: '迟到', count: item.late_count, className: attendanceStatusBadgeClass(1) },
    { key: 'absent', label: '缺勤', count: item.absent_count, className: attendanceStatusBadgeClass(2) },
    { key: 'leave', label: '请假', count: item.leave_count, className: attendanceStatusBadgeClass(3) },
  ].filter((entry) => entry.count > 0)
}

function sessionRightSubtitleText(item: OverviewRecentSessionItem) {
  return item.class_summary || '其他学生'
}

function abnormalStatusText(item: OverviewRecentAbnormalItem) {
  return statusLabels[item.status as 0 | 1 | 2 | 3] ?? '未知'
}

function abnormalLeftSubtitleText(item: OverviewRecentAbnormalItem) {
  return `${item.student_id} · ${item.class_name || '其他学生'}`
}

function abnormalRightTitleText(item: OverviewRecentAbnormalItem) {
  return weekSectionText(item.week_no, item.weekday, item.section)
}

function abnormalRightSubtitleText(item: OverviewRecentAbnormalItem) {
  return [item.course_name, item.teacher_name, item.grade ? `${item.grade}级` : ''].filter(Boolean).join(' · ')
}

function openCourseDetail(courseId: number) {
  emit('openCourse', courseId)
}

function openClassDetail(classId: number) {
  emit('openClass', classId)
}

function openStudentDetail(studentRefId: number) {
  emit('openStudent', studentRefId)
}

function openRecentSessionDetail(item: OverviewRecentSessionItem) {
  emit('openAttendanceDetail', {
    sessionId: item.course_group_lesson_id,
    courseId: item.course_id,
    groupId: item.course_group_id,
  })
}

function openRecentAbnormalDetail(item: OverviewRecentAbnormalItem) {
  emit('openAttendanceDetail', {
    sessionId: item.course_group_lesson_id,
    courseId: item.course_id,
    groupId: item.course_group_id,
    focusStudentRefId: item.student_ref_id,
  })
}
</script>

<template>
  <section class="workspace-card overview-panel">
    <div class="overview-grid">
      <article class="overview-card">
        <div class="overview-card-header">
          <strong>课程出勤率</strong>
          <button class="ghost-button compact-button" type="button" @click="courseRankAsc = !courseRankAsc">
            {{ courseRankAsc ? '正序' : '逆序' }}
          </button>
        </div>
        <div class="overview-rank-list" @scroll.passive="handleListScroll($event, 'course_rankings')">
          <button
            v-for="item in courseRankings"
            :key="item.course_id"
            class="overview-rank-item overview-rank-item-button overview-entry overview-entry-with-lead overview-entry-with-rate"
            :style="rateThemeStyle(item.attendance_rate, courseSection.minRate.value, courseSection.maxRate.value)"
            type="button"
            @click="openCourseDetail(item.course_id)"
          >
            <span class="overview-entry-lead overview-rank-index">{{ item.rank }}</span>
            <strong class="overview-entry-title overview-entry-title-left">{{ item.course_name }} · {{ item.teacher_name }}</strong>
            <strong class="overview-entry-title overview-entry-title-right">{{ rateText(item.attendance_rate) }}</strong>
            <p class="overview-entry-subtitle overview-entry-subtitle-left">{{ item.grade }}级</p>
            <small class="overview-entry-subtitle overview-entry-subtitle-right">{{ item.arrived_count }} / {{ item.total_count }}</small>
          </button>
          <p v-if="courseRankings.length === 0" class="empty-hint">当前学期暂无课程出勤数据</p>
        </div>
      </article>

      <article class="overview-card">
        <div class="overview-card-header">
          <strong>班级出勤率</strong>
          <button class="ghost-button compact-button" type="button" @click="classRankAsc = !classRankAsc">
            {{ classRankAsc ? '正序' : '逆序' }}
          </button>
        </div>
        <div class="overview-rank-list" @scroll.passive="handleListScroll($event, 'class_rankings')">
          <button
            v-for="item in classRankings"
            :key="item.class_id"
            class="overview-rank-item overview-rank-item-button overview-entry overview-entry-with-lead overview-entry-with-rate"
            :style="rateThemeStyle(item.attendance_rate, classSection.minRate.value, classSection.maxRate.value)"
            type="button"
            @click="openClassDetail(item.class_id)"
          >
            <span class="overview-entry-lead overview-rank-index">{{ item.rank }}</span>
            <strong class="overview-entry-title overview-entry-title-left">{{ item.class_name }}</strong>
            <strong class="overview-entry-title overview-entry-title-right">{{ rateText(item.attendance_rate) }}</strong>
            <p class="overview-entry-subtitle overview-entry-subtitle-left">{{ item.major_name }} · {{ item.grade }}级</p>
            <small class="overview-entry-subtitle overview-entry-subtitle-right">{{ item.arrived_count }} / {{ item.total_count }}</small>
          </button>
          <p v-if="classRankings.length === 0" class="empty-hint">当前学期暂无班级出勤数据</p>
        </div>
      </article>

      <article class="overview-card">
        <div class="overview-card-header">
          <strong>个人出勤率</strong>
          <button class="ghost-button compact-button" type="button" @click="studentRankAsc = !studentRankAsc">
            {{ studentRankAsc ? '正序' : '逆序' }}
          </button>
        </div>
        <div class="overview-rank-list" @scroll.passive="handleListScroll($event, 'student_rankings')">
          <button
            v-for="item in studentRankings"
            :key="item.student_ref_id"
            class="overview-rank-item overview-rank-item-button overview-entry overview-entry-with-lead overview-entry-with-rate"
            :style="rateThemeStyle(item.attendance_rate, studentSection.minRate.value, studentSection.maxRate.value)"
            type="button"
            @click="openStudentDetail(item.student_ref_id)"
          >
            <span class="overview-entry-lead overview-rank-index">{{ item.rank }}</span>
            <strong class="overview-entry-title overview-entry-title-left">{{ item.real_name }}</strong>
            <strong class="overview-entry-title overview-entry-title-right">{{ rateText(item.attendance_rate) }}</strong>
            <p class="overview-entry-subtitle overview-entry-subtitle-left">{{ item.student_id }} · {{ item.class_name || '其他学生' }}</p>
            <small class="overview-entry-subtitle overview-entry-subtitle-right">{{ item.arrived_count }} / {{ item.total_count }}</small>
          </button>
          <p v-if="studentRankings.length === 0" class="empty-hint">当前学期暂无个人出勤数据</p>
        </div>
      </article>

      <article class="overview-card overview-card-half">
        <div class="overview-card-header">
          <strong>最近完成查课的课次</strong>
        </div>
        <div class="overview-session-list" @scroll.passive="handleListScroll($event, 'recent_sessions')">
          <button
            v-for="item in recentSessions"
            :key="item.course_group_lesson_id"
            class="overview-session-item overview-session-item-button overview-entry overview-entry-two-column overview-entry-with-rate"
            :style="rateThemeStyle(item.attendance_rate, sessionSection.minRate.value, sessionSection.maxRate.value)"
            type="button"
            @click="openRecentSessionDetail(item)"
          >
            <strong class="overview-entry-title overview-entry-title-left">{{ sessionLeftTitleText(item) }}</strong>
            <div class="overview-entry-title overview-entry-title-right attendance-session-summary overview-session-summary-title" :aria-label="sessionRightTitleText(item)">
              <span
                v-for="summary in sessionSummaryItems(item)"
                :key="summary.key"
                class="status-badge attendance-session-summary-chip"
                :class="summary.className"
              >
                <span class="attendance-session-summary-label">{{ summary.label }}</span>
                <span class="attendance-session-summary-count">{{ summary.count }}</span>
              </span>
              <span
                class="overview-session-summary-rate"
                :class="{ 'overview-session-summary-rate-spaced': sessionSummaryItems(item).length > 0 }"
              >
                {{ rateText(item.attendance_rate) }}
              </span>
            </div>
            <p class="overview-entry-subtitle overview-entry-subtitle-left">{{ sessionLeftSubtitleText(item) }}</p>
            <small class="overview-entry-subtitle overview-entry-subtitle-right">{{ sessionRightSubtitleText(item) }}</small>
          </button>
          <p v-if="recentSessions.length === 0" class="empty-hint">当前学期暂无已完成查课课次</p>
        </div>
      </article>

      <article class="overview-card overview-card-half">
        <div class="overview-card-header">
          <strong>最近迟到、缺勤、请假的学生</strong>
        </div>
        <div class="overview-session-list" @scroll.passive="handleListScroll($event, 'recent_abnormal_students')">
          <button
            v-for="item in recentAbnormalStudents"
            :key="item.attendance_record_id"
            class="overview-session-item overview-session-item-button overview-entry overview-entry-with-lead overview-entry-with-status"
            :style="statusThemeStyle(item.status)"
            type="button"
            @click="openRecentAbnormalDetail(item)"
          >
            <div class="overview-entry-lead overview-abnormal-status">
              <span class="status-badge" :class="attendanceStatusBadgeClass(item.status)">
                {{ abnormalStatusText(item) }}
              </span>
            </div>
            <strong class="overview-entry-title overview-entry-title-left">{{ item.real_name }}</strong>
            <strong class="overview-entry-title overview-entry-title-right">{{ abnormalRightTitleText(item) }}</strong>
            <p class="overview-entry-subtitle overview-entry-subtitle-left">{{ abnormalLeftSubtitleText(item) }}</p>
            <small class="overview-entry-subtitle overview-entry-subtitle-right">{{ abnormalRightSubtitleText(item) }}</small>
          </button>
          <p v-if="recentAbnormalStudents.length === 0" class="empty-hint">当前学期暂无异常考勤记录</p>
        </div>
      </article>
    </div>
  </section>
</template>
