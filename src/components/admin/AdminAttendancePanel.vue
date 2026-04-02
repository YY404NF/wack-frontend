<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { api, type MetaTermItem } from '../../api'
import { attendanceStatusBadgeClass, sectionLabels } from '../../constants'
import { selectDefaultTermName, sortTermsForSelect } from '../../utils/terms'
import type { AdminAttendanceDetailTarget } from './shared-types'
import AdminDataList from './AdminDataList.vue'
import AppInputSelect from '../common/AppInputSelect.vue'
import type { AdminAttendanceProps } from './types'

type AttendanceSessionSummary = {
  course_group_lesson_id: number
  term_id: number
  term: string
  course_id: number
  course_name: string
  teacher_name: string
  week_no: number
  weekday: number
  section: number
  building_name: string
  room_name: string
  class_summary: string
  session_no: number
  student_count: number
  record_count: number
  present_count: number
  late_count: number
  absent_count: number
  leave_count: number
}

const props = defineProps<AdminAttendanceProps>()
const emit = defineEmits<{
  openAttendanceDetail: [target: AdminAttendanceDetailTarget]
}>()

const PAGE_OPTIONS = [100, 200, 500, 1000]
const TERM_WEEK_COUNT = 16
const EXPORT_PAGE_SIZE = 500

const sessionColumns = [
  { key: 'lesson_date', label: '日期', width: 8, copyable: false },
  { key: 'lesson_time', label: '时间', width: 8, copyable: false },
  { key: 'course_name', label: '课程', width: 13 },
  { key: 'teacher_name', label: '教师', width: 9 },
  { key: 'class_summary', label: '班级', width: 18, copyable: false, copyValue: (row: Record<string, unknown>) => formatClassSummaryInline(String(row.class_summary ?? ''), '-') },
  { key: 'student_count', label: '人数', width: 5 },
  { key: 'summary', label: '考勤概况', width: 16, copyable: false },
] as const

const termOptions = computed(() => sortTermsForSelect(props.courseTerms))
const selectedTerm = ref('')

const sessionDate = ref('')
const sessionSection = ref('')
const sessionCourseName = ref('')
const sessionTeacherName = ref('')
const sessionClassName = ref('')
const sessionPage = ref(1)
const sessionPageSize = ref(100)
const sessionLoading = ref(false)
const sessionError = ref('')
const sessionRows = ref<AttendanceSessionSummary[]>([])

const exportModalOpen = ref(false)
const exportingWeeklyAbnormal = ref(false)
const weeklyExportError = ref('')

let sessionRequestToken = 0

watch(
  termOptions,
  (terms) => {
    if (!selectedTerm.value) {
      selectedTerm.value = selectDefaultTermName(terms as MetaTermItem[]) || terms[0]?.name || ''
    }
  },
  { immediate: true },
)

watch([selectedTerm], () => {
  sessionPage.value = 1
  if (selectedTerm.value) {
    void loadSessions()
  }
}, { immediate: true })

watch([sessionDate, sessionSection, sessionCourseName, sessionTeacherName, sessionClassName, sessionPageSize], () => {
  sessionPage.value = 1
})

const termStartMap = computed(() => new Map(props.courseTerms.map((item) => [item.name, item.term_start_date])))
const selectedTermMeta = computed(() => props.courseTerms.find((item) => item.name === selectedTerm.value) ?? null)

const classOptions = computed(() =>
  Array.from(
    new Set(
      sessionRows.value.flatMap((item) =>
        formatClassSummaryInline(item.class_summary, '')
          .split(/[、,，]\s*/)
          .map((value) => value.trim())
          .filter((value) => value.length > 0),
      )
    ),
  ).sort((left, right) => left.localeCompare(right, 'zh-Hans-CN')),
)

const sortedSessionRows = computed(() =>
  [...sessionRows.value].sort((left, right) => {
    const leftDate = `${formatLessonDate(left)} ${pad(left.section)}`
    const rightDate = `${formatLessonDate(right)} ${pad(right.section)}`
    return rightDate.localeCompare(leftDate, 'zh-Hans-CN')
  }),
)

const filteredSessions = computed(() => {
  const courseKeyword = sessionCourseName.value.trim().toLowerCase()
  const teacherKeyword = sessionTeacherName.value.trim().toLowerCase()
  const classKeyword = sessionClassName.value.trim().toLowerCase()
  const dateKeyword = sessionDate.value.trim()

  return sortedSessionRows.value.filter((item) => {
    if (dateKeyword && formatLessonDate(item) !== dateKeyword) {
      return false
    }
    if (sessionSection.value && String(item.section) !== sessionSection.value) {
      return false
    }
    if (courseKeyword && !item.course_name.toLowerCase().includes(courseKeyword)) {
      return false
    }
    if (teacherKeyword && !item.teacher_name.toLowerCase().includes(teacherKeyword)) {
      return false
    }
    if (classKeyword && !formatClassSummaryInline(item.class_summary, '').toLowerCase().includes(classKeyword)) {
      return false
    }
    return true
  })
})

const paginatedSessions = computed(() => {
  const start = (sessionPage.value - 1) * sessionPageSize.value
  return filteredSessions.value.slice(start, start + sessionPageSize.value)
})

const sessionTotalPages = computed(() => Math.max(1, Math.ceil(filteredSessions.value.length / sessionPageSize.value)))

const exportWeekNo = computed(() => {
  const startDate = selectedTermMeta.value?.term_start_date
  if (!startDate) {
    return null
  }
  const start = parseDate(startDate)
  if (!start) {
    return null
  }
  const today = new Date()
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const diff = now.getTime() - start.getTime()
  return Math.min(TERM_WEEK_COUNT, Math.max(1, Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1))
})

const exportWeekSessionCount = computed(() => {
  if (exportWeekNo.value === null) {
    return 0
  }
  return sessionRows.value.filter((item) => item.week_no === exportWeekNo.value).length
})

async function loadSessions() {
  if (!selectedTerm.value) {
    return
  }
  sessionRequestToken += 1
  const requestToken = sessionRequestToken
  sessionLoading.value = true
  sessionError.value = ''
  try {
    const result = await fetchAllAttendanceSessions({
      term: selectedTerm.value,
    })
    if (requestToken !== sessionRequestToken) {
      return
    }
    sessionRows.value = result
  } catch (error) {
    if (requestToken !== sessionRequestToken) {
      return
    }
    sessionRows.value = []
    sessionError.value = error instanceof Error ? error.message : '加载考勤记录失败'
  } finally {
    if (requestToken === sessionRequestToken) {
      sessionLoading.value = false
    }
  }
}

async function fetchAllAttendanceSessions(query: {
  term?: string
  keyword?: string
  week_no?: string
  weekday?: string
  section?: string
  class_id?: string
  status?: string
  include_unchecked?: boolean
}) {
  let page = 1
  let total = 0
  const items: AttendanceSessionSummary[] = []

  do {
    const result = await api.adminAttendanceSessions({
      ...query,
      page,
      page_size: EXPORT_PAGE_SIZE,
    })
    const pageItems = (result.items ?? []) as AttendanceSessionSummary[]
    items.push(...pageItems)
    total = result.total ?? items.length
    page += 1
  } while (items.length < total)

  return items
}

async function fetchAllAttendanceSessionRecords(
  sessionId: number,
  query: {
    student_id?: string
    real_name?: string
    class_name?: string
    status?: string
  } = {},
) {
  let page = 1
  let total = 0
  const items = []

  do {
    const result = await api.adminGetAttendanceSessionPage(sessionId, {
      ...query,
      page,
      page_size: EXPORT_PAGE_SIZE,
    })
    const pageItems = result.attendance_records ?? []
    items.push(...pageItems)
    total = result.total ?? items.length
    page += 1
  } while (items.length < total)

  return items
}

function openExportModal() {
  weeklyExportError.value = ''
  exportModalOpen.value = true
}

function closeExportModal() {
  exportModalOpen.value = false
}

function downloadCsv(filename: string, header: string[], rows: Array<Array<string>>) {
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function isAbnormalStatus(status?: number | null) {
  return status === 1 || status === 2 || status === 3
}

async function exportWeeklyAbnormalRecords() {
  if (!selectedTerm.value || exportWeekNo.value === null) {
    return
  }
  exportingWeeklyAbnormal.value = true
  weeklyExportError.value = ''
  try {
    const sessions = await fetchAllAttendanceSessions({
      term: selectedTerm.value,
      week_no: String(exportWeekNo.value),
    })

    const rows: Array<Array<string>> = []
    for (const session of sessions) {
      const records = await fetchAllAttendanceSessionRecords(session.course_group_lesson_id)
      for (const record of records) {
        if (!isAbnormalStatus(record.status)) {
          continue
        }
        rows.push([
          formatLessonDate(session),
          lessonTimeLabel(session.section),
          session.course_name,
          session.teacher_name,
          record.student_id,
          record.real_name,
          normalizeClassName(record.class_name),
          formatStatus(record.status),
        ])
      }
    }

    downloadCsv(
      `考勤异常记录-${selectedTerm.value}-第${exportWeekNo.value}周.csv`,
      ['日期', '时间', '课程名称', '教师', '学号', '姓名', '班级', '状态'],
      rows,
    )
    closeExportModal()
  } catch (error) {
    weeklyExportError.value = error instanceof Error ? error.message : '导出本周异常记录失败'
  } finally {
    exportingWeeklyAbnormal.value = false
  }
}

function formatLessonDate(item: AttendanceSessionSummary) {
  const termStart = termStartMap.value.get(item.term)
  if (!termStart) {
    return ''
  }
  const date = parseDate(termStart)
  if (!date) {
    return ''
  }
  date.setDate(date.getDate() + (item.week_no - 1) * 7 + (item.weekday - 1))
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map((item) => Number(item))
  if (!year || !month || !day) {
    return null
  }
  return new Date(year, month - 1, day)
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function lessonTimeLabel(section: number) {
  return sectionLabels[section] ?? `第 ${section} 节`
}

function sessionSummaryText(item: AttendanceSessionSummary) {
  return `签到 ${item.present_count} / 迟到 ${item.late_count} / 缺勤 ${item.absent_count} / 请假 ${item.leave_count}`
}

function sessionSummaryItems(item: AttendanceSessionSummary) {
  return [
    { key: 'present', label: '签到', count: item.present_count, className: attendanceStatusBadgeClass(0) },
    { key: 'late', label: '迟到', count: item.late_count, className: attendanceStatusBadgeClass(1) },
    { key: 'absent', label: '缺勤', count: item.absent_count, className: attendanceStatusBadgeClass(2) },
    { key: 'leave', label: '请假', count: item.leave_count, className: attendanceStatusBadgeClass(3) },
  ].filter((entry) => entry.count > 0)
}

function normalizeClassName(value?: string | null) {
  return value?.trim() || '未绑定班级'
}

function formatClassSummaryInline(value?: string | null, fallback = '-') {
  const items = String(value ?? '')
    .split(/[、,，]\s*/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
  return items.length > 0 ? items.join('、') : fallback
}

function formatStatus(status?: number | null) {
  if (status === null || status === undefined) {
    return '未查'
  }
  return props.statusName(status)
}
</script>

<template>
  <section class="workspace-card user-manage-panel attendance-record-panel">
    <div class="attendance-page">
      <AdminDataList
        :rows="paginatedSessions as unknown as Array<Record<string, unknown>>"
        :columns="sessionColumns as unknown as Array<{ key: string; label: string; width?: number }>"
        row-key="course_group_lesson_id"
        empty-text="暂无考勤记录"
        :show-actions="true"
        :action-col-width="12"
        :pagination="{ page: sessionPage, pageSize: sessionPageSize, totalPages: sessionTotalPages, pageOptions: PAGE_OPTIONS, totalItems: filteredSessions.length }"
        :all-items="sessionRows.length"
        :active-filter-keys="[
          ...(sessionDate ? ['lesson_date'] : []),
          ...(sessionSection ? ['lesson_time'] : []),
          ...(sessionCourseName.trim() ? ['course_name'] : []),
          ...(sessionTeacherName.trim() ? ['teacher_name'] : []),
          ...(sessionClassName ? ['class_summary'] : []),
        ]"
        :has-search-condition="!!(sessionDate || sessionSection || sessionCourseName.trim() || sessionTeacherName.trim() || sessionClassName)"
        @update-page="sessionPage = $event"
        @update-page-size="sessionPageSize = $event"
      >
        <template #filter-lesson_date>
          <input v-model="sessionDate" type="date" aria-label="按日期筛选考勤记录" />
        </template>
        <template #filter-lesson_time>
          <select v-model="sessionSection" aria-label="按时间筛选考勤记录">
            <option value="">全部</option>
            <option v-for="(label, key) in sectionLabels" :key="key" :value="String(key)">{{ label }}</option>
          </select>
        </template>
        <template #filter-course_name>
          <input v-model="sessionCourseName" aria-label="按课程筛选考勤记录" />
        </template>
        <template #filter-teacher_name>
          <input v-model="sessionTeacherName" aria-label="按教师筛选考勤记录" />
        </template>
        <template #filter-class_summary>
          <AppInputSelect
            v-model="sessionClassName"
            :options="classOptions"
            aria-label="按班级筛选考勤记录"
          />
        </template>
        <template #filter-actions>
          <button class="ghost-button compact-button" type="button" :disabled="!selectedTerm" @click="openExportModal">
            导出
          </button>
        </template>
        <template #cell-lesson_date="{ row }">
          {{ formatLessonDate(row as AttendanceSessionSummary) || '-' }}
        </template>
        <template #cell-lesson_time="{ row }">
          {{ lessonTimeLabel(Number((row as AttendanceSessionSummary).section)) }}
        </template>
        <template #cell-class_summary="{ value }">
          {{ formatClassSummaryInline(typeof value === 'string' ? value : '', '-') }}
        </template>
        <template #cell-summary="{ row }">
          <div class="attendance-session-summary" :aria-label="sessionSummaryText(row as AttendanceSessionSummary)">
            <span
              v-for="item in sessionSummaryItems(row as AttendanceSessionSummary)"
              :key="item.key"
              class="status-badge attendance-session-summary-chip"
              :class="item.className"
            >
              <span class="attendance-session-summary-label">{{ item.label }}</span>
              <span class="attendance-session-summary-count">{{ item.count }}</span>
            </span>
            <span v-if="sessionSummaryItems(row as AttendanceSessionSummary).length === 0" class="attendance-session-summary-empty">-</span>
          </div>
        </template>
        <template #actions="{ row }">
          <div class="inline-actions user-actions">
            <button class="ghost-button compact-button" type="button" @click="emit('openAttendanceDetail', { sessionId: Number((row as AttendanceSessionSummary).course_group_lesson_id) })">考勤明细</button>
          </div>
        </template>
        <template #empty>
          <template v-if="sessionLoading">加载中...</template>
          <template v-else-if="sessionError">{{ sessionError }}</template>
          <template v-else>暂无考勤记录</template>
        </template>
        <template #footer-trailing>
          <label class="course-manage-term-filter attendance-pagination-term attendance-pagination-term-plain">
            <select v-model="selectedTerm">
              <option v-for="item in termOptions" :key="item.id" :value="item.name">{{ item.name }}</option>
            </select>
          </label>
        </template>
      </AdminDataList>
    </div>

    <Transition name="modal-float" appear>
      <div v-if="exportModalOpen" class="modal-backdrop">
        <article class="modal-card modal-card-narrow">
          <div class="modal-header">
            <h3>导出考勤记录</h3>
            <button class="ghost-button compact-button modal-close" type="button" :disabled="exportingWeeklyAbnormal" @click="closeExportModal">关闭</button>
          </div>
          <div class="attendance-status-modal">
            <p class="hint">将导出当前学期本周所有迟到、缺勤和请假记录。</p>
            <div class="attendance-status-static-field">
              <span>学期</span>
              <strong>{{ selectedTerm || '-' }}</strong>
            </div>
            <div class="attendance-status-static-field">
              <span>周次</span>
              <strong>{{ exportWeekNo === null ? '-' : `第 ${exportWeekNo} 周` }}</strong>
            </div>
            <div class="attendance-status-static-field">
              <span>课次数量</span>
              <strong>{{ exportWeekSessionCount }}</strong>
            </div>
            <p v-if="weeklyExportError" class="hint form-error-text">{{ weeklyExportError }}</p>
            <div class="inline-actions">
              <button class="ghost-button" type="button" :disabled="exportingWeeklyAbnormal" @click="closeExportModal">取消</button>
              <button class="primary-button" type="button" :disabled="exportWeekNo === null || exportingWeeklyAbnormal" @click="exportWeeklyAbnormalRecords">
                <span v-if="exportingWeeklyAbnormal" class="button-spinner" aria-hidden="true"></span>
                <span>{{ exportingWeeklyAbnormal ? '导出中...' : '导出本周所有迟到、缺勤和请假记录' }}</span>
              </button>
            </div>
          </div>
        </article>
      </div>
    </Transition>
  </section>
</template>
