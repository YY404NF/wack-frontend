<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

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
  lesson_date: string
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
const EXPORT_PAGE_SIZE = 500

const sessionColumns = [
  { key: 'lesson_date', label: '日期', width: 8, copyable: false },
  { key: 'lesson_time', label: '时间', width: 8, copyable: false },
  { key: 'course_name', label: '课程', width: 13 },
  { key: 'teacher_name', label: '教师', width: 9 },
  { key: 'class_summary', label: '班级', width: 18, copyable: false, copyValue: (row: Record<string, unknown>) => formatClassSummaryInline(String(row.class_summary ?? ''), '-') },
  { key: 'student_count', label: '人数', width: 5 },
  { key: 'summary', label: '考勤概况', width: 12 , copyable: false },
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
const sessionTotalItems = ref(0)
const classOptions = ref<string[]>([])

const exportModalOpen = ref(false)
const exportingAttendanceRecords = ref(false)
const exportAttendanceError = ref('')
const exportStartDate = ref('')
const exportEndDate = ref('')

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

const sessionQueryKey = computed(() =>
  JSON.stringify({
    term: selectedTerm.value.trim(),
    lessonDate: sessionDate.value,
    section: sessionSection.value,
    courseName: sessionCourseName.value.trim(),
    teacherName: sessionTeacherName.value.trim(),
    className: sessionClassName.value.trim(),
    pageSize: sessionPageSize.value,
  }),
)

const sessionTotalPages = computed(() => Math.max(1, Math.ceil(sessionTotalItems.value / sessionPageSize.value)))

const exportRangeInvalid = computed(() =>
  !exportStartDate.value || !exportEndDate.value || exportStartDate.value > exportEndDate.value,
)

async function loadSessions() {
  if (!selectedTerm.value) {
    return
  }
  sessionRequestToken += 1
  const requestToken = sessionRequestToken
  sessionLoading.value = true
  sessionError.value = ''
  try {
    const result = await api.adminAttendanceSessions({
      term: selectedTerm.value,
      lesson_date: sessionDate.value,
      section: sessionSection.value,
      course_name: sessionCourseName.value,
      teacher_name: sessionTeacherName.value,
      class_name: sessionClassName.value,
      page: sessionPage.value,
      page_size: sessionPageSize.value,
    })
    if (requestToken !== sessionRequestToken) {
      return
    }
    sessionRows.value = (result.items ?? []) as AttendanceSessionSummary[]
    sessionPage.value = result.page ?? sessionPage.value
    sessionTotalItems.value = result.total ?? 0
  } catch (error) {
    if (requestToken !== sessionRequestToken) {
      return
    }
    sessionRows.value = []
    sessionTotalItems.value = 0
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
  lesson_date?: string
  lesson_date_from?: string
  lesson_date_to?: string
  course_name?: string
  teacher_name?: string
  week_no?: string
  weekday?: string
  section?: string
  class_id?: string
  class_name?: string
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

async function loadClassOptions() {
  try {
    const items = await api.listClassOptions()
    classOptions.value = Array.from(
      new Set(
        items
          .map((item) => item.class_name.trim())
          .filter((item) => item.length > 0),
      ),
    ).sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'))
  } catch {
    classOptions.value = []
  }
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
  const range = defaultExportDateRange()
  exportStartDate.value = range.start
  exportEndDate.value = range.end
  exportAttendanceError.value = ''
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

async function exportAttendanceRecords() {
  if (!selectedTerm.value || exportRangeInvalid.value) {
    if (exportRangeInvalid.value) {
      exportAttendanceError.value = '请选择有效的导出日期范围'
    }
    return
  }
  exportingAttendanceRecords.value = true
  exportAttendanceError.value = ''
  try {
    const sessions = await fetchAllAttendanceSessions({
      term: selectedTerm.value,
      lesson_date_from: exportStartDate.value,
      lesson_date_to: exportEndDate.value,
    })
    const rows: Array<Array<string>> = []
    for (const session of sessions) {
      const records = await fetchAllAttendanceSessionRecords(session.course_group_lesson_id)
      for (const record of records) {
        if (!isAbnormalStatus(record.status)) {
          continue
        }
        rows.push([
          session.lesson_date || '-',
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
      `考勤记录-${exportStartDate.value}-${exportEndDate.value}.csv`,
      ['日期', '时间', '课程名称', '教师', '学号', '姓名', '班级', '状态'],
      rows,
    )
    closeExportModal()
  } catch (error) {
    exportAttendanceError.value = error instanceof Error ? error.message : '导出考勤记录失败'
  } finally {
    exportingAttendanceRecords.value = false
  }
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function formatInputDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function defaultExportDateRange() {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const end = new Date(today.getFullYear(), today.getMonth(), 0)
  return {
    start: formatInputDate(start),
    end: formatInputDate(end),
  }
}

function lessonTimeLabel(section: number) {
  return sectionLabels[section] ?? `第 ${section} 节`
}

function sessionSummaryText(item: AttendanceSessionSummary) {
  const summaries = sessionSummaryItems(item).map((entry) => `${entry.label} ${entry.count}`)
  return summaries.length > 0 ? summaries.join(' / ') : '-'
}

function sessionSummaryItems(item: AttendanceSessionSummary) {
  return [
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

watch(
  [sessionQueryKey, sessionPage],
  ([queryKey, page], previousValue) => {
    if (!selectedTerm.value) {
      return
    }
    const [previousQueryKey] = previousValue ?? ['', 1]
    if (queryKey !== previousQueryKey && page !== 1) {
      sessionPage.value = 1
      return
    }
    void loadSessions()
  },
  { immediate: true },
)

onMounted(() => {
  void loadClassOptions()
})
</script>

<template>
  <section class="workspace-card user-manage-panel attendance-record-panel">
    <div class="attendance-page">
      <AdminDataList
        :rows="sessionRows as unknown as Array<Record<string, unknown>>"
        :columns="sessionColumns as unknown as Array<{ key: string; label: string; width?: number }>"
        row-key="course_group_lesson_id"
        empty-text="暂无考勤记录"
        :show-actions="true"
        :action-col-width="12"
        :pagination="{ page: sessionPage, pageSize: sessionPageSize, totalPages: sessionTotalPages, pageOptions: PAGE_OPTIONS, totalItems: sessionTotalItems }"
        :all-items="sessionTotalItems"
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
          {{ (row as AttendanceSessionSummary).lesson_date || '-' }}
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
            <button class="ghost-button compact-button modal-close" type="button" :disabled="exportingAttendanceRecords" @click="closeExportModal">关闭</button>
          </div>
          <form class="form-grid single-column-form attendance-export-form" @submit.prevent="exportAttendanceRecords">
            <label class="field">
              <span>范围</span>
              <div class="term-segment-field attendance-export-range-field" aria-label="导出考勤记录范围">
                <input v-model="exportStartDate" type="date" aria-label="起始日期" @input="exportAttendanceError = ''" />
                <span class="term-segment-separator" aria-hidden="true">-</span>
                <input v-model="exportEndDate" type="date" aria-label="结束日期" @input="exportAttendanceError = ''" />
              </div>
            </label>
            <p v-if="exportAttendanceError" class="hint form-error-text">{{ exportAttendanceError }}</p>
            <button class="primary-button" type="submit" :disabled="exportRangeInvalid || exportingAttendanceRecords">
              <span v-if="exportingAttendanceRecords" class="button-spinner" aria-hidden="true"></span>
              <span>{{ exportingAttendanceRecords ? '导出中...' : '导出' }}</span>
            </button>
          </form>
        </article>
      </div>
    </Transition>
  </section>
</template>
