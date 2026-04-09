<script setup lang="ts">
import { computed, defineAsyncComponent, watch } from 'vue'

import { attendanceStatusBadgeClass, sectionLabels } from '../../constants'
import { selectDefaultTermName, sortTermsForSelect } from '../../utils/terms'
import AppDigitInput from '../common/AppDigitInput.vue'
import AppInputSelect from '../common/AppInputSelect.vue'
import AdminDataList from './AdminDataList.vue'
import type { AdminAttendanceLogsProps } from './types'
import type { AdminAttendanceLogsOpenPayload } from './shared-types'

const AdminAttendanceLogDetailView = defineAsyncComponent(() => import('./AdminAttendanceLogDetailView.vue'))

const props = defineProps<AdminAttendanceLogsProps>()

const emit = defineEmits<{
  updateAttendanceLogsPage: [page: number]
  updateAttendanceLogsPageSize: [size: number]
  loadMoreAttendanceLogs: []
  openAttendanceLogs: [payload: AdminAttendanceLogsOpenPayload]
  closeAttendanceLogDetail: []
}>()

const attendanceLogColumns = [
  { key: 'lesson_date', label: '日期', width: 10 },
  { key: 'section', label: '时间', width: 10, copyValue: (row: Record<string, unknown>) => formatSection(Number(row.section)) },
  { key: 'course_name', label: '课程', width: 14 },
  { key: 'teacher_name', label: '教师', width: 10 },
  { key: 'student_id', label: '学号', width: 12 },
  { key: 'real_name', label: '姓名', width: 10 },
  { key: 'class_name', label: '班级', width: 17 },
  { key: 'old_status', label: '原状态', width: 8, copyValue: (row: Record<string, unknown>) => formatStatus(row.old_status, '未查') },
  { key: 'new_status', label: '新状态', width: 8, copyValue: (row: Record<string, unknown>) => formatStatus(row.new_status) },
  { key: 'operator_name', label: '操作用户', width: 8 },
  { key: 'operated_at', label: '操作时间', width: 17, copyValue: (row: Record<string, unknown>) => typeof row.operated_at === 'string' ? formatDateTime(row.operated_at) : '-' },
] as const

const termOptions = computed(() => sortTermsForSelect(props.courseTerms))
const defaultTermName = computed(() => selectDefaultTermName(props.courseTerms) || termOptions.value[0]?.name || '')
const isDetailView = computed(() => props.attendanceLogsView === 'detail')
const sectionOptions = computed(() =>
  Object.entries(sectionLabels).map(([value, label]) => ({
    value,
    label: label.replace(/\s+/g, ''),
  })),
)
const statusOptions = [
  { value: '0', label: '签到' },
  { value: '1', label: '迟到' },
  { value: '2', label: '缺勤' },
  { value: '3', label: '请假' },
] as const

const classOptions = computed(() =>
  Array.from(
    new Set(
      props.allClasses.map((item) => item.class_name)
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    ),
  ).sort((left, right) => left.localeCompare(right, 'zh-Hans-CN')),
)

const activeFilterKeys = computed(() => [
  ...(!isDetailView.value && props.attendanceLogFilters.lessonDate ? ['lesson_date'] : []),
  ...(!isDetailView.value && props.attendanceLogFilters.section ? ['section'] : []),
  ...(!isDetailView.value && props.attendanceLogFilters.courseName.trim() ? ['course_name'] : []),
  ...(!isDetailView.value && props.attendanceLogFilters.teacherName.trim() ? ['teacher_name'] : []),
  ...(!isDetailView.value && props.attendanceLogFilters.studentId.trim() ? ['student_id'] : []),
  ...(!isDetailView.value && props.attendanceLogFilters.realName.trim() ? ['real_name'] : []),
  ...(!isDetailView.value && props.attendanceLogFilters.className.trim() ? ['class_name'] : []),
  ...(props.attendanceLogFilters.oldStatus ? ['old_status'] : []),
  ...(props.attendanceLogFilters.newStatus ? ['new_status'] : []),
  ...(props.attendanceLogFilters.operatorName.trim() ? ['operator_name'] : []),
  ...(props.attendanceLogFilters.operatedDate ? ['operated_at'] : []),
])

const hasSearchCondition = computed(() =>
  isDetailView.value
    ? Boolean(
      props.attendanceLogFilters.oldStatus ||
      props.attendanceLogFilters.newStatus ||
      props.attendanceLogFilters.operatorName.trim() ||
      props.attendanceLogFilters.operatedDate,
    )
    : Boolean(
      props.attendanceLogFilters.courseGroupLessonId ||
      props.attendanceLogFilters.lessonDate ||
      props.attendanceLogFilters.section ||
      props.attendanceLogFilters.courseName.trim() ||
      props.attendanceLogFilters.teacherName.trim() ||
      props.attendanceLogFilters.studentId.trim() ||
      props.attendanceLogFilters.realName.trim() ||
      props.attendanceLogFilters.className.trim() ||
      props.attendanceLogFilters.oldStatus ||
      props.attendanceLogFilters.newStatus ||
      props.attendanceLogFilters.operatorName.trim() ||
      props.attendanceLogFilters.operatedDate ||
      (props.attendanceLogFilters.term && props.attendanceLogFilters.term !== defaultTermName.value),
    ),
)

watch(
  termOptions,
  (terms) => {
    const termNames = terms.map((item) => item.name)
    if (termNames.length === 0) {
      return
    }
    if (!props.attendanceLogFilters.term || !termNames.includes(props.attendanceLogFilters.term)) {
      props.attendanceLogFilters.term = defaultTermName.value || termNames[0]
    }
  },
  { immediate: true },
)

function formatDateTime(value: string) {
  return value.replace('T', ' ').slice(0, 19)
}

function formatSection(value: number) {
  return sectionLabels[value]?.replace(/\s+/g, '') ?? `第${value}节`
}

function openLogDetail(row: Record<string, unknown>) {
  emit('openAttendanceLogs', {
    term: String(row.term ?? '').trim() || props.attendanceLogFilters.term,
    courseGroupLessonId: Number(row.course_group_lesson_id),
    studentId: String(row.student_id ?? '').trim(),
    context: {
      studentId: String(row.student_id ?? '').trim(),
      realName: String(row.real_name ?? '').trim(),
      className: String(row.class_name ?? '').trim(),
      lessonDate: String(row.lesson_date ?? '').trim(),
      section: Number(row.section),
      courseName: String(row.course_name ?? '').trim(),
      teacherName: String(row.teacher_name ?? '').trim(),
    },
  })
}

function formatStatus(value: unknown, emptyLabel = '-') {
  if (value === null || value === undefined || value === '') {
    return emptyLabel
  }
  return props.statusName(Number(value))
}
</script>

<template>
  <section class="workspace-card user-manage-panel">
    <Transition name="subpage-fade" mode="out-in" appear>
      <AdminDataList
        v-if="!isDetailView"
        key="attendance-log-list"
        :rows="attendanceLogs as unknown as Array<Record<string, unknown>>"
        :columns="attendanceLogColumns as unknown as Array<{ key: string; label: string; width?: number }>"
        row-key="id"
        empty-text="暂无考勤日志"
        :show-actions="true"
        :action-col-width="12"
        :pagination="{ page: attendanceLogsPage, pageSize: attendanceLogsPageSize, totalPages: attendanceLogsTotalPages, pageOptions: attendanceLogsPageOptions, totalItems: attendanceLogsTotalItems }"
        :all-items="attendanceLogsAllItems"
        :active-filter-keys="activeFilterKeys"
        :has-search-condition="hasSearchCondition"
        @update-page="emit('updateAttendanceLogsPage', $event)"
        @update-page-size="emit('updateAttendanceLogsPageSize', $event)"
      >
        <template #filter-lesson_date>
          <input v-model="attendanceLogFilters.lessonDate" type="date" aria-label="按日期筛选考勤日志" />
        </template>
        <template #filter-section>
          <select v-model="attendanceLogFilters.section" aria-label="按时间筛选考勤日志">
            <option value="">全部</option>
            <option v-for="item in sectionOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </template>
        <template #filter-course_name>
          <input v-model="attendanceLogFilters.courseName" aria-label="按课程筛选考勤日志" />
        </template>
        <template #filter-teacher_name>
          <input v-model="attendanceLogFilters.teacherName" aria-label="按教师筛选考勤日志" />
        </template>
        <template #filter-student_id>
          <AppDigitInput v-model="attendanceLogFilters.studentId" aria-label="按学号筛选考勤日志" />
        </template>
        <template #filter-real_name>
          <input v-model="attendanceLogFilters.realName" aria-label="按姓名筛选考勤日志" />
        </template>
        <template #filter-class_name>
          <AppInputSelect
            v-model="attendanceLogFilters.className"
            :options="classOptions"
            aria-label="按班级筛选考勤日志"
          />
        </template>
        <template #filter-old_status>
          <select v-model="attendanceLogFilters.oldStatus" aria-label="按原状态筛选考勤日志">
            <option value="">全部</option>
            <option value="none">未查</option>
            <option v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </template>
        <template #filter-new_status>
          <select v-model="attendanceLogFilters.newStatus" aria-label="按新状态筛选考勤日志">
            <option value="">全部</option>
            <option v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </template>
        <template #filter-operator_name>
          <input v-model="attendanceLogFilters.operatorName" aria-label="按操作用户筛选考勤日志" />
        </template>
        <template #filter-operated_at>
          <input v-model="attendanceLogFilters.operatedDate" type="date" aria-label="按操作时间筛选考勤日志" />
        </template>
        <template #cell-section="{ value }">
          {{ formatSection(Number(value)) }}
        </template>
        <template #cell-old_status="{ value }">
          <span v-if="value === null || value === undefined" class="status-badge attendance-status-badge-unrecorded">未查</span>
          <span v-else class="status-badge" :class="attendanceStatusBadgeClass(Number(value))">
            {{ formatStatus(value, '未查') }}
          </span>
        </template>
        <template #cell-new_status="{ value }">
          <span class="status-badge" :class="attendanceStatusBadgeClass(Number(value))">
            {{ formatStatus(value) }}
          </span>
        </template>
        <template #cell-operated_at="{ value }">
          {{ typeof value === 'string' ? formatDateTime(value) : '-' }}
        </template>
        <template #actions="{ row }">
          <div class="inline-actions user-actions">
            <button class="ghost-button compact-button" type="button" @click="openLogDetail(row)">变更记录</button>
          </div>
        </template>
        <template #footer-trailing>
          <label class="course-manage-term-filter">
            <span class="visually-hidden">学期</span>
            <select v-model="attendanceLogFilters.term" aria-label="按学期筛选考勤日志" :disabled="termOptions.length === 0">
              <option v-for="item in termOptions" :key="item.id" :value="item.name">{{ item.name }}</option>
            </select>
          </label>
        </template>
      </AdminDataList>

      <AdminAttendanceLogDetailView
        v-else
        key="attendance-log-detail"
        :attendance-logs="attendanceLogs as unknown as Array<Record<string, unknown>>"
        :attendance-log-filters="attendanceLogFilters"
        :attendance-log-detail-context="attendanceLogDetailContext"
        :attendance-logs-loading="attendanceLogsLoading"
        :attendance-logs-has-more="attendanceLogsHasMore"
        :attendance-logs-all-items="attendanceLogsAllItems"
        :status-name="statusName"
        @load-more-attendance-logs="emit('loadMoreAttendanceLogs')"
      />
    </Transition>
  </section>
</template>
