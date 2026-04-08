<script setup lang="ts">
import { computed, watch } from 'vue'

import { type ClassItem, type MetaTermItem } from '../../api'
import { attendanceStatusBadgeClass } from '../../constants'
import AppDigitInput from '../common/AppDigitInput.vue'
import AppInputSelect from '../common/AppInputSelect.vue'
import AdminDataList from './AdminDataList.vue'
import { selectDefaultTermName, sortTermsForSelect } from '../../utils/terms'

const props = defineProps<{
  classes: ClassItem[]
  allClasses: ClassItem[]
  courseTerms: MetaTermItem[]
  classFilters: {
    term: string
    attendanceSummaryStatus: string
    grade: string
    majorName: string
    className: string
  }
  selectedClassIds: number[]
  classDeleting: boolean
  classPage: number
  classPageSize: number
  classTotalPages: number
  classTotalItems: number
  classAllItems: number
  classPageOptions: number[]
  classFocusRowKey?: number | null
  classFocusToken?: number
}>()

const emit = defineEmits<{
  openCreateClassModal: []
  openEditClassModal: [item: ClassItem]
  openClassStudentModal: [item: ClassItem]
  openClassAttendanceDetail: [item: ClassItem]
  openDeleteClassModal: [item: ClassItem]
  openBulkDeleteClassModal: []
  updateClassPage: [page: number]
  updateClassPageSize: [size: number]
  toggleClassSelection: [classId: number]
  toggleClassPageSelection: []
}>()

const majorOptions = computed(() =>
  Array.from(new Set(props.allClasses.map((item) => item.major_name))).sort((left, right) => left.localeCompare(right, 'zh-Hans-CN')),
)
const classNameOptions = computed(() =>
  Array.from(new Set(props.allClasses.map((item) => item.class_name))).sort((left, right) => left.localeCompare(right, 'zh-Hans-CN')),
)
const termOptions = computed(() => sortTermsForSelect(props.courseTerms))
const defaultTermName = computed(() => selectDefaultTermName(termOptions.value) || termOptions.value[0]?.name || '')
const selectedClassIdSet = computed(() => new Set(props.selectedClassIds))
const areAllClassesSelected = computed(() => props.classes.length > 0 && props.classes.every((item) => selectedClassIdSet.value.has(item.id)))

const classColumns = [
  { key: 'grade', label: '年级', width: 7 },
  { key: 'major_name', label: '专业名称', width: 6 },
  { key: 'class_name', label: '班级名称', width: 8 },
  { key: 'student_count', label: '人数', width: 3 },
  { key: 'attendance_summary', label: '考勤概况', width: 12, copyable: false },
] as const

watch(
  termOptions,
  (terms) => {
    const termNames = terms.map((item) => item.name)
    if (!props.classFilters.term || !termNames.includes(props.classFilters.term)) {
      props.classFilters.term = defaultTermName.value || termNames[0] || ''
    }
  },
  { immediate: true },
)

function asClassItem(row: Record<string, unknown>) {
  return row as unknown as ClassItem
}

function classAttendanceSummaryItems(item: ClassItem) {
  return [
    { key: 'late', label: '迟到', count: Number(item.late_count ?? 0), className: attendanceStatusBadgeClass(1) },
    { key: 'absent', label: '缺勤', count: Number(item.absent_count ?? 0), className: attendanceStatusBadgeClass(2) },
    { key: 'leave', label: '请假', count: Number(item.leave_count ?? 0), className: attendanceStatusBadgeClass(3) },
  ].filter((entry) => entry.count > 0)
}

function classAttendanceSummaryText(item: ClassItem) {
  const entries = classAttendanceSummaryItems(item)
  return entries.length > 0 ? entries.map((entry) => `${entry.label} ${entry.count}`).join(' / ') : '-'
}
</script>

<template>
  <div class="class-manage-page">
    <AdminDataList
      :rows="classes as unknown as Array<Record<string, unknown>>"
      :columns="classColumns as unknown as Array<{ key: string; label: string; width?: number }>"
      row-key="id"
      table-class="class-manage-table"
      empty-text="暂无符合条件的班级"
      :show-selection="true"
      :selected-row-keys="selectedClassIds"
      :show-actions="true"
      :action-col-width="32"
      :pagination="{ page: classPage, pageSize: classPageSize, totalPages: classTotalPages, pageOptions: classPageOptions, totalItems: classTotalItems }"
      :all-items="classAllItems"
      :selected-items="selectedClassIds.length"
      :highlight-row-key="classFocusRowKey ?? null"
      :highlight-token="classFocusToken ?? 0"
      :active-filter-keys="[
        ...(String(classFilters.grade ?? '').trim() ? ['grade'] : []),
        ...(classFilters.majorName ? ['major_name'] : []),
        ...(classFilters.className.trim() ? ['class_name'] : []),
        ...(classFilters.attendanceSummaryStatus ? ['attendance_summary'] : []),
      ]"
      :has-search-condition="!!(String(classFilters.grade ?? '').trim() || classFilters.majorName || classFilters.className.trim() || classFilters.attendanceSummaryStatus)"
      @update-page="emit('updateClassPage', $event)"
      @update-page-size="emit('updateClassPageSize', $event)"
      @toggle-row-selection="emit('toggleClassSelection', Number($event))"
    >
      <template #filter-grade>
        <AppDigitInput v-model="classFilters.grade" aria-label="按年级筛选班级" />
      </template>
      <template #filter-major_name>
        <AppInputSelect
          v-model="classFilters.majorName"
          :options="majorOptions"
          aria-label="按专业名称筛选班级"
        />
      </template>
      <template #filter-class_name>
        <AppInputSelect
          v-model="classFilters.className"
          :options="classNameOptions"
          aria-label="按班级名称筛选班级"
        />
      </template>
      <template #filter-attendance_summary>
        <select v-model="classFilters.attendanceSummaryStatus" aria-label="按考勤概况筛选班级">
          <option value="">全部</option>
          <option value="late">迟到</option>
          <option value="absent">缺勤</option>
          <option value="leave">请假</option>
        </select>
      </template>
      <template #filter-actions>
        <button
          class="ghost-button compact-button"
          :class="{ selected: areAllClassesSelected }"
          type="button"
          @click="emit('toggleClassPageSelection')"
        >
          全选
        </button>
        <button class="ghost-button compact-button danger-button" type="button" :disabled="classDeleting || selectedClassIds.length === 0" @click="emit('openBulkDeleteClassModal')">
          批量删除
        </button>
        <button class="primary-button compact-button filter-action-push" type="button" @click="emit('openCreateClassModal')">
          创建班级
        </button>
      </template>
      <template #cell-attendance_summary="{ row }">
        <div class="attendance-session-summary" :aria-label="classAttendanceSummaryText(asClassItem(row))">
          <span
            v-for="entry in classAttendanceSummaryItems(asClassItem(row))"
            :key="entry.key"
            class="status-badge attendance-session-summary-chip"
            :class="entry.className"
          >
            <span class="attendance-session-summary-label">{{ entry.label }}</span>
            <span class="attendance-session-summary-count">{{ entry.count }}</span>
          </span>
          <span v-if="classAttendanceSummaryItems(asClassItem(row)).length === 0" class="attendance-session-summary-empty">-</span>
        </div>
      </template>
      <template #actions="{ row }">
        <div class="inline-actions user-actions">
          <button class="ghost-button compact-button" type="button" @click="emit('openClassAttendanceDetail', asClassItem(row))">考勤明细</button>
          <button class="ghost-button compact-button" type="button" @click="emit('openEditClassModal', asClassItem(row))">编辑</button>
          <button class="ghost-button compact-button" type="button" @click="emit('openClassStudentModal', asClassItem(row))">学生管理</button>
          <button class="ghost-button compact-button danger-button" type="button" @click="emit('openDeleteClassModal', asClassItem(row))">删除</button>
        </div>
      </template>
      <template #footer-trailing>
        <label class="course-manage-term-filter attendance-pagination-term attendance-pagination-term-plain">
          <select v-model="classFilters.term" aria-label="选择班级列表学期" :disabled="termOptions.length === 0">
            <option v-for="item in termOptions" :key="item.id" :value="item.name">{{ item.name }}</option>
          </select>
        </label>
      </template>
    </AdminDataList>
  </div>
</template>
