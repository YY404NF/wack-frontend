<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { api, type AttendanceRecordStudentItem, type MetaTermItem } from '../../api'
import { attendanceStatusBadgeClass, sectionLabels } from '../../constants'
import { selectDefaultTermName, sortTermsForSelect } from '../../utils/terms'
import AdminDataList from './AdminDataList.vue'
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
  updateAttendanceRoute: [payload: { sessionId?: number | null }]
}>()

const PAGE_OPTIONS = [10, 20, 50, 100]
const TERM_WEEK_COUNT = 16

const termOptions = computed(() => sortTermsForSelect(props.courseTerms))
const selectedTerm = ref('')

const sessionDate = ref('')
const sessionSection = ref('')
const sessionCourseName = ref('')
const sessionTeacherName = ref('')
const sessionClassName = ref('')
const sessionStudentCount = ref('')
const sessionPage = ref(1)
const sessionPageSize = ref(20)
const sessionLoading = ref(false)
const sessionError = ref('')
const sessionRows = ref<AttendanceSessionSummary[]>([])

const activeSession = ref<AttendanceSessionSummary | null>(null)
const activeSessionCourseGrade = ref<number | null>(null)
const detailRows = ref<AttendanceRecordStudentItem[]>([])
const detailStudentId = ref('')
const detailRealName = ref('')
const detailClassName = ref('')
const detailStatus = ref('')
const detailPage = ref(1)
const detailPageSize = ref(20)
const detailTotalItems = ref(0)
const detailLoading = ref(false)
const detailError = ref('')

const editModalOpen = ref(false)
const editingRecord = ref<AttendanceRecordStudentItem | null>(null)
const editingStatus = ref('')
const savingStatus = ref(false)
const actionError = ref('')
const exportModalOpen = ref(false)
const exportingWeeklyAbnormal = ref(false)
const weeklyExportError = ref('')

let sessionRequestToken = 0
let detailRequestToken = 0
const EXPORT_PAGE_SIZE = 500

const sessionColumns = [
  { key: 'lesson_date', label: '日期', colClass: 'col-pct-12', copyable: false },
  { key: 'lesson_time', label: '时间', colClass: 'col-pct-12', copyable: false },
  { key: 'course_name', label: '课程', colClass: 'col-pct-16' },
  { key: 'teacher_name', label: '教师', colClass: 'col-pct-12' },
  { key: 'class_summary', label: '班级', colClass: 'col-pct-18', copyable: false },
  { key: 'student_count', label: '人数', colClass: 'col-pct-10' },
  { key: 'summary', label: '考勤概况', colClass: 'col-pct-20', copyable: false },
] as const

const detailColumns = [
  { key: 'student_id', label: '学号', colClass: 'col-pct-20' },
  { key: 'real_name', label: '姓名', colClass: 'col-pct-18' },
  { key: 'class_name', label: '班级', colClass: 'col-pct-34', copyable: false },
  { key: 'status', label: '状态', colClass: 'col-pct-14', copyable: false },
] as const

watch(
  termOptions,
  (terms) => {
    if (!selectedTerm.value) {
      selectedTerm.value = selectDefaultTermName(terms as MetaTermItem[]) || terms[0]?.name || ''
    }
  },
  { immediate: true },
)

watch(
  () => [props.attendanceRouteSessionId ?? null, sessionRows.value.length] as const,
  ([sessionId]) => {
    if (sessionId === null) {
      if (activeSession.value) {
        activeSession.value = null
        activeSessionCourseGrade.value = null
        detailRows.value = []
        detailError.value = ''
      }
      return
    }
    if (activeSession.value?.course_group_lesson_id === sessionId) {
      return
    }
    const target = sessionRows.value.find((item) => item.course_group_lesson_id === sessionId)
    if (target) {
      void openSessionDetail(target, false)
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

watch([sessionDate, sessionSection, sessionCourseName, sessionTeacherName, sessionClassName, sessionStudentCount, sessionPageSize], () => {
  sessionPage.value = 1
})

watch([detailStudentId, detailRealName, detailClassName, detailStatus, detailPageSize], () => {
  detailPage.value = 1
})

watch([detailPage, detailPageSize, detailStudentId, detailRealName, detailClassName, detailStatus], () => {
  if (activeSession.value) {
    void loadSessionDetailPage(activeSession.value, false)
  }
})

const termStartMap = computed(() => new Map(props.courseTerms.map((item) => [item.name, item.term_start_date])))
const selectedTermMeta = computed(() => props.courseTerms.find((item) => item.name === selectedTerm.value) ?? null)

const classOptions = computed(() =>
  Array.from(
    new Set(
      sessionRows.value
        .map((item) => item.class_summary.trim())
        .filter((item) => item.length > 0),
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
  const countKeyword = sessionStudentCount.value.trim()

  return sortedSessionRows.value.filter((item) => {
    if (sessionDate.value && formatLessonDate(item) !== sessionDate.value) {
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
    if (sessionClassName.value && item.class_summary !== sessionClassName.value) {
      return false
    }
    if (countKeyword && String(item.student_count) !== countKeyword) {
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

const detailClassOptions = computed(() =>
  Array.from(
    new Set(
      detailRows.value
        .map((item) => normalizeClassName(item.class_name))
        .filter((item) => item.length > 0),
    ),
  ).sort((left, right) => left.localeCompare(right, 'zh-Hans-CN')),
)

const detailTotalPages = computed(() => Math.max(1, Math.ceil(detailTotalItems.value / detailPageSize.value)))

const activeLessonSummary = computed(() => {
  if (!activeSession.value) {
    return []
  }
  return [
    { label: '日期', value: formatLessonDate(activeSession.value) || '-' },
    { label: '时间', value: lessonTimeLabel(activeSession.value.section) },
    { label: '地点', value: `${activeSession.value.building_name}-${activeSession.value.room_name}` },
  ]
})

const activeGroupSummary = computed(() => {
  if (!activeSession.value) {
    return []
  }
  return [
    { label: '上课班级', value: activeSession.value.class_summary || '-' },
    { label: '上课人数', value: `${activeSession.value.student_count}` },
  ]
})

const activeCourseSummary = computed(() => {
  if (!activeSession.value) {
    return []
  }
  return [
    { label: '课程名称', value: activeSession.value.course_name },
    { label: '教师', value: activeSession.value.teacher_name },
    { label: '年级', value: activeSessionCourseGrade.value === null ? '-' : String(activeSessionCourseGrade.value) },
    { label: '学期', value: activeSession.value.term },
  ]
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
  const items: AttendanceRecordStudentItem[] = []

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

async function openSessionDetail(item: AttendanceSessionSummary, syncRoute = true) {
  activeSession.value = item
  if (syncRoute) {
    emit('updateAttendanceRoute', { sessionId: item.course_group_lesson_id })
  }
  detailStudentId.value = ''
  detailRealName.value = ''
  detailClassName.value = ''
  detailStatus.value = ''
  detailPage.value = 1
  await loadSessionDetailPage(item, false)
}

async function loadSessionDetailPage(item: AttendanceSessionSummary, syncRoute = false) {
  if (syncRoute) {
    emit('updateAttendanceRoute', { sessionId: item.course_group_lesson_id })
  }
  detailRequestToken += 1
  const requestToken = detailRequestToken
  detailLoading.value = true
  detailError.value = ''
  try {
    const result = await api.adminGetAttendanceSessionPage(item.course_group_lesson_id, {
      page: detailPage.value,
      page_size: detailPageSize.value,
      student_id: detailStudentId.value,
      real_name: detailRealName.value,
      class_name: detailClassName.value === '未绑定班级' ? '' : detailClassName.value,
      status: detailStatus.value,
    })
    if (requestToken !== detailRequestToken) {
      return
    }
    activeSessionCourseGrade.value = result.course?.grade ?? null
    detailRows.value = result.attendance_records ?? []
    detailTotalItems.value = result.total ?? 0
  } catch (error) {
    if (requestToken !== detailRequestToken) {
      return
    }
    activeSessionCourseGrade.value = null
    detailRows.value = []
    detailTotalItems.value = 0
    detailError.value = error instanceof Error ? error.message : '加载考勤明细失败'
  } finally {
    if (requestToken === detailRequestToken) {
      detailLoading.value = false
    }
  }
}

function openEditModal(item: AttendanceRecordStudentItem) {
  editingRecord.value = item
  editingStatus.value = item.status === null || item.status === undefined ? '0' : String(item.status)
  actionError.value = ''
  editModalOpen.value = true
}

function closeEditModal() {
  editModalOpen.value = false
  editingRecord.value = null
  editingStatus.value = ''
  savingStatus.value = false
  actionError.value = ''
}

async function saveAttendanceStatus() {
  if (!activeSession.value || !editingRecord.value || editingStatus.value === '') {
    return
  }
  savingStatus.value = true
  actionError.value = ''
  try {
    await api.adminUpdateAttendanceStatus(
      activeSession.value.course_group_lesson_id,
      editingRecord.value.id,
      Number(editingStatus.value),
    )
    await openSessionDetail(activeSession.value)
    closeEditModal()
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '修改考勤状态失败'
  } finally {
    savingStatus.value = false
  }
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

function normalizeClassName(value?: string | null) {
  return value?.trim() || '未绑定班级'
}

function formatStatus(status?: number | null) {
  if (status === null || status === undefined) {
    return '未查'
  }
  return props.statusName(status)
}

function asAttendanceRecordStudentItem(row: Record<string, unknown>) {
  return row as unknown as AttendanceRecordStudentItem
}
  </script>

<template>
  <section class="workspace-card user-manage-panel attendance-record-panel">
    <Transition name="subpage-fade" mode="out-in" appear>
    <div v-if="!activeSession" key="attendance-list" class="attendance-page">
        <AdminDataList
          :rows="paginatedSessions as unknown as Array<Record<string, unknown>>"
          :columns="sessionColumns as unknown as Array<{ key: string; label: string; colClass?: string }>"
          row-key="course_group_lesson_id"
          empty-text="暂无考勤记录"
          :show-actions="true"
          action-col-class="col-pct-12"
          :pagination="{ page: sessionPage, pageSize: sessionPageSize, totalPages: sessionTotalPages, pageOptions: PAGE_OPTIONS, totalItems: filteredSessions.length }"
          :all-items="sessionRows.length"
          :active-filter-keys="[
            ...(sessionDate ? ['lesson_date'] : []),
            ...(sessionSection ? ['lesson_time'] : []),
            ...(sessionCourseName.trim() ? ['course_name'] : []),
            ...(sessionTeacherName.trim() ? ['teacher_name'] : []),
            ...(sessionClassName ? ['class_summary'] : []),
            ...(sessionStudentCount.trim() ? ['student_count'] : []),
          ]"
          :has-search-condition="!!(sessionDate || sessionSection || sessionCourseName.trim() || sessionTeacherName.trim() || sessionClassName || sessionStudentCount.trim())"
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
            <select v-model="sessionClassName" aria-label="按班级筛选考勤记录">
              <option value="">全部</option>
              <option v-for="item in classOptions" :key="item" :value="item">{{ item }}</option>
            </select>
          </template>
          <template #filter-student_count>
            <input v-model="sessionStudentCount" type="number" min="0" aria-label="按人数筛选考勤记录" />
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
            {{ value || '-' }}
          </template>
          <template #cell-summary="{ row }">
            {{ sessionSummaryText(row as AttendanceSessionSummary) }}
          </template>
          <template #actions="{ row }">
            <div class="inline-actions user-actions">
              <button class="ghost-button compact-button" type="button" @click="openSessionDetail(row as AttendanceSessionSummary)">考勤明细</button>
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

    <div v-else key="attendance-detail" class="attendance-detail-layout">
        <aside class="workspace-card course-context-card">
          <div class="settings-profile-summary-list">
            <div class="workspace-card nested-context-card">
              <div class="section-heading section-heading-compact">
                <strong>课次</strong>
              </div>
              <div class="settings-profile-summary-list">
                <div v-for="item in activeLessonSummary" :key="item.label" class="settings-profile-summary-item">
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                </div>
              </div>
            </div>

            <div class="workspace-card nested-context-card">
              <div class="section-heading section-heading-compact">
                <strong>课程组</strong>
              </div>
              <div class="settings-profile-summary-list">
                <div v-for="item in activeGroupSummary" :key="item.label" class="settings-profile-summary-item">
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                </div>
              </div>
            </div>

            <div class="workspace-card nested-context-card">
              <div class="section-heading section-heading-compact">
                <strong>课程</strong>
              </div>
              <div class="settings-profile-summary-list">
                <div v-for="item in activeCourseSummary" :key="item.label" class="settings-profile-summary-item">
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section class="workspace-card course-subpage-main">
          <AdminDataList
            :rows="detailRows as unknown as Array<Record<string, unknown>>"
            :columns="detailColumns as unknown as Array<{ key: string; label: string; colClass?: string }>"
            row-key="id"
            empty-text="暂无课次考勤明细"
            :show-actions="true"
            action-col-class="col-pct-14"
            :pagination="{ page: detailPage, pageSize: detailPageSize, totalPages: detailTotalPages, pageOptions: PAGE_OPTIONS, totalItems: detailTotalItems }"
            :all-items="detailTotalItems"
            :active-filter-keys="[
              ...(detailStudentId.trim() ? ['student_id'] : []),
              ...(detailRealName.trim() ? ['real_name'] : []),
              ...(detailClassName ? ['class_name'] : []),
              ...(detailStatus ? ['status'] : []),
            ]"
            :has-search-condition="!!(detailStudentId.trim() || detailRealName.trim() || detailClassName || detailStatus)"
            @update-page="detailPage = $event"
            @update-page-size="detailPageSize = $event"
          >
            <template #filter-student_id>
              <input v-model="detailStudentId" aria-label="按学号筛选课次考勤明细" />
            </template>
            <template #filter-real_name>
              <input v-model="detailRealName" aria-label="按姓名筛选课次考勤明细" />
            </template>
            <template #filter-class_name>
              <select v-model="detailClassName" aria-label="按班级筛选课次考勤明细">
                <option value="">全部</option>
                <option v-for="item in detailClassOptions" :key="item" :value="item">{{ item }}</option>
              </select>
            </template>
            <template #filter-status>
              <select v-model="detailStatus" aria-label="按状态筛选课次考勤明细">
                <option value="">全部</option>
                <option value="unrecorded">未查</option>
                <option value="0">签到</option>
                <option value="1">迟到</option>
                <option value="2">缺勤</option>
                <option value="3">请假</option>
              </select>
            </template>
            <template #cell-class_name="{ value }">
              {{ normalizeClassName(String(value ?? '')) }}
            </template>
            <template #cell-status="{ value }">
              <span class="status-badge" :class="attendanceStatusBadgeClass(value as number | null | undefined)">
                {{ formatStatus(value as number | null | undefined) }}
              </span>
            </template>
            <template #actions="{ row }">
              <div class="inline-actions user-actions">
                <button class="ghost-button compact-button" type="button" @click="openEditModal(asAttendanceRecordStudentItem(row))">修改</button>
              </div>
            </template>
            <template #empty>
              <template v-if="detailLoading">加载中...</template>
              <template v-else-if="detailError">{{ detailError }}</template>
              <template v-else>暂无课次考勤明细</template>
            </template>
          </AdminDataList>
        </section>
      </div>
    </Transition>

    <Transition name="modal-float" appear>
      <div v-if="editModalOpen && editingRecord" class="modal-backdrop">
        <article class="modal-card modal-card-narrow">
          <div class="modal-header">
            <h3>修改考勤状态</h3>
            <button class="ghost-button compact-button modal-close" type="button" @click="closeEditModal">关闭</button>
          </div>
          <div class="attendance-status-modal">
            <label class="field attendance-status-static-field">
              <span>学号</span>
              <input class="readonly-field-input" :value="editingRecord.student_id" readonly />
            </label>
            <label class="field attendance-status-static-field">
              <span>姓名</span>
              <input class="readonly-field-input" :value="editingRecord.real_name" readonly />
            </label>
            <label class="field attendance-status-static-field">
              <span>班级</span>
              <input class="readonly-field-input" :value="normalizeClassName(editingRecord.class_name)" readonly />
            </label>
            <label class="field">
              <span>状态</span>
              <select v-model="editingStatus">
                <option value="0">签到</option>
                <option value="1">迟到</option>
                <option value="2">缺勤</option>
                <option value="3">请假</option>
              </select>
            </label>
            <p v-if="actionError" class="hint form-error-text">{{ actionError }}</p>
            <div class="inline-actions">
              <button class="ghost-button" type="button" @click="closeEditModal">取消</button>
              <button class="primary-button" type="button" :disabled="savingStatus" @click="saveAttendanceStatus">
                <span v-if="savingStatus" class="button-spinner" aria-hidden="true"></span>
                <span>{{ savingStatus ? '保存中...' : '保存' }}</span>
              </button>
            </div>
          </div>
        </article>
      </div>
    </Transition>

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
