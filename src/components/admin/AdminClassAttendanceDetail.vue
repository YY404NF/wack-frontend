<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

import { api, type ClassAttendanceItem, type ClassItem, type MetaTermItem } from '../../api'
import { attendanceStatusBadgeClass, sectionLabels, statusLabels } from '../../constants'
import { useSelection } from '../../composables/app/useSelection'
import { selectDefaultTermName, sortTermsForSelect } from '../../utils/terms'
import AppDigitInput from '../common/AppDigitInput.vue'
import AdminDataList from './AdminDataList.vue'
import type { AdminAttendanceLogsOpenPayload } from './shared-types'

const props = defineProps<{
  classId: number
  selectedTerm: string
  courseTerms: MetaTermItem[]
}>()

const emit = defineEmits<{
  'update:selectedTerm': [term: string]
  openAttendanceLogs: [payload: AdminAttendanceLogsOpenPayload]
}>()

const PAGE_OPTIONS = [100, 200, 500, 1000]
const ATTENDANCE_STATUS_OPTIONS = [
  { value: '0', label: '签到' },
  { value: '1', label: '迟到' },
  { value: '2', label: '缺勤' },
  { value: '3', label: '请假' },
] as const

const detailColumns = [
  { key: 'lesson_date', label: '日期', width: 8, copyable: false },
  { key: 'lesson_time', label: '时间', width: 8, copyable: false },
  { key: 'course_name', label: '课程', width: 12 },
  { key: 'teacher_name', label: '教师', width: 8 },
  { key: 'student_id', label: '学号', width: 10 },
  { key: 'real_name', label: '姓名', width: 6 },
  { key: 'status', label: '状态', width: 4, copyable: false },
  { key: 'operator_name', label: '最后操作用户', width: 8 },
  {
    key: 'operated_at',
    label: '最后操作时间',
    width: 14,
    copyValue: (row: Record<string, unknown>) => typeof row.operated_at === 'string' ? formatDateTime(row.operated_at) : '-',
  },
] as const

const selectedTermModel = computed({
  get: () => props.selectedTerm,
  set: (value: string) => emit('update:selectedTerm', value),
})
const termOptions = computed(() => sortTermsForSelect(props.courseTerms))
const defaultTermName = computed(() => selectDefaultTermName(termOptions.value) || termOptions.value[0]?.name || '')

const classInfo = ref<ClassItem | null>(null)
const detailRows = ref<ClassAttendanceItem[]>([])
const detailDate = ref('')
const detailSection = ref('')
const detailCourseName = ref('')
const detailTeacherName = ref('')
const detailStudentId = ref('')
const detailRealName = ref('')
const detailStatus = ref('')
const detailOperatorName = ref('')
const detailOperatedDate = ref('')
const detailPage = ref(1)
const detailPageSize = ref(100)
const detailTotalItems = ref(0)
const detailLoading = ref(false)
const detailError = ref('')
const suspendAutoLoad = ref(false)

const editModalOpen = ref(false)
const editingRecord = ref<ClassAttendanceItem | null>(null)
const editingStatus = ref('0')
const savingStatus = ref(false)
const bulkEditModalOpen = ref(false)
const bulkEditingStatus = ref('0')
const bulkSavingStatus = ref(false)
const actionError = ref('')

let detailRequestToken = 0

const {
  clearSelection,
  pageSelectableIds,
  selectedIds,
  togglePageSelection,
  toggleSelection,
} = useSelection({
  allItems: detailRows,
  pageItems: computed(() => detailRows.value),
  getId: (item) => item.id,
})

const detailQueryKey = computed(() =>
  JSON.stringify({
    term: selectedTermModel.value.trim(),
    lessonDate: detailDate.value,
    section: detailSection.value,
    courseName: detailCourseName.value.trim(),
    teacherName: detailTeacherName.value.trim(),
    studentId: detailStudentId.value.trim(),
    realName: detailRealName.value.trim(),
    status: detailStatus.value,
    operatorName: detailOperatorName.value.trim(),
    operatedDate: detailOperatedDate.value,
    pageSize: detailPageSize.value,
  }),
)

const detailTotalPages = computed(() => Math.max(1, Math.ceil(detailTotalItems.value / detailPageSize.value)))
const selectedIdSet = computed(() => new Set(selectedIds.value))
const areAllVisibleDetailsSelected = computed(
  () =>
    pageSelectableIds.value.length > 0 &&
    pageSelectableIds.value.every((id) => selectedIdSet.value.has(id)),
)

const classSummary = computed(() => [
  { label: '年级', value: classInfo.value?.grade ? String(classInfo.value.grade) : '-' },
  { label: '专业', value: classInfo.value?.major_name?.trim() || '-' },
  { label: '班级', value: classInfo.value?.class_name?.trim() || '-' },
])

watch(
  termOptions,
  (terms) => {
    const termNames = terms.map((item) => item.name)
    if (!selectedTermModel.value || !termNames.includes(selectedTermModel.value)) {
      selectedTermModel.value = defaultTermName.value || termNames[0] || ''
    }
  },
  { immediate: true },
)

watch(
  () => props.classId,
  async () => {
    suspendAutoLoad.value = true
    clearSelection()
    closeEditModal()
    closeBulkEditModal()
    classInfo.value = null
    detailDate.value = ''
    detailSection.value = ''
    detailCourseName.value = ''
    detailTeacherName.value = ''
    detailStudentId.value = ''
    detailRealName.value = ''
    detailStatus.value = ''
    detailOperatorName.value = ''
    detailOperatedDate.value = ''
    detailPage.value = 1
    await nextTick()
    suspendAutoLoad.value = false
    if (props.classId && selectedTermModel.value.trim()) {
      void loadClassAttendancePage()
    }
  },
  { immediate: true },
)

watch(
  () => [detailQueryKey.value, detailPage.value] as const,
  ([queryKey, page], previousValue) => {
    if (!props.classId || !selectedTermModel.value.trim() || suspendAutoLoad.value) {
      return
    }
    const [previousQueryKey] = previousValue ?? ['', 1]
    if (queryKey !== previousQueryKey) {
      clearSelection()
      if (page !== 1) {
        detailPage.value = 1
        return
      }
    }
    void loadClassAttendancePage()
  },
)

watch(
  () => selectedIds.value.length,
  (count) => {
    if (count === 0 && bulkEditModalOpen.value && !bulkSavingStatus.value) {
      closeBulkEditModal()
    }
  },
)

async function loadClassAttendancePage() {
  if (!props.classId || !selectedTermModel.value.trim()) {
    return
  }
  detailRequestToken += 1
  const requestToken = detailRequestToken
  detailLoading.value = true
  detailError.value = ''
  try {
    const result = await api.adminClassAttendanceRecords(props.classId, {
      page: detailPage.value,
      page_size: detailPageSize.value,
      term: selectedTermModel.value,
      lesson_date: detailDate.value,
      section: detailSection.value,
      course_name: detailCourseName.value,
      teacher_name: detailTeacherName.value,
      student_id: detailStudentId.value,
      real_name: detailRealName.value,
      status: detailStatus.value,
      operator_name: detailOperatorName.value,
      operated_date: detailOperatedDate.value,
    })
    if (requestToken !== detailRequestToken) {
      return
    }
    classInfo.value = result.class
    detailRows.value = result.attendance_records ?? []
    detailPage.value = result.page ?? detailPage.value
    detailTotalItems.value = result.total ?? 0
  } catch (error) {
    if (requestToken !== detailRequestToken) {
      return
    }
    classInfo.value = null
    detailRows.value = []
    detailTotalItems.value = 0
    detailError.value = error instanceof Error ? error.message : '加载班级考勤明细失败'
  } finally {
    if (requestToken === detailRequestToken) {
      detailLoading.value = false
    }
  }
}

function formatDateTime(value: string) {
  return value.replace('T', ' ').slice(0, 19)
}

function formatStatus(status: number) {
  return statusLabels[status as 0 | 1 | 2 | 3] ?? '未知'
}

function lessonTimeLabel(section: number) {
  return sectionLabels[section] ?? `第 ${section} 节`
}

function asClassAttendanceItem(row: Record<string, unknown>) {
  return row as unknown as ClassAttendanceItem
}

function openEditModal(item: ClassAttendanceItem) {
  editingRecord.value = item
  editingStatus.value = String(item.status)
  actionError.value = ''
  editModalOpen.value = true
}

function openAttendanceLogDetail(item: ClassAttendanceItem) {
  emit('openAttendanceLogs', {
    term: item.term || selectedTermModel.value,
    courseGroupLessonId: item.course_group_lesson_id,
    studentId: item.student_id,
    context: {
      studentId: item.student_id,
      realName: item.real_name,
      className: classInfo.value?.class_name || '',
      lessonDate: item.lesson_date,
      section: item.section,
      courseName: item.course_name,
      teacherName: item.teacher_name,
    },
  })
}

function closeEditModal() {
  editModalOpen.value = false
  editingRecord.value = null
  editingStatus.value = '0'
  savingStatus.value = false
  actionError.value = ''
}

function openBulkEditModal() {
  if (selectedIds.value.length === 0) {
    return
  }
  bulkEditingStatus.value = '0'
  actionError.value = ''
  bulkEditModalOpen.value = true
}

function closeBulkEditModal() {
  bulkEditModalOpen.value = false
  bulkEditingStatus.value = '0'
  bulkSavingStatus.value = false
  actionError.value = ''
}

async function saveAttendanceStatus() {
  if (!editingRecord.value || editingStatus.value === '') {
    return
  }
  savingStatus.value = true
  actionError.value = ''
  try {
    await api.adminUpdateAttendanceRecordStatus(editingRecord.value.id, Number(editingStatus.value))
    await loadClassAttendancePage()
    closeEditModal()
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '修改考勤状态失败'
  } finally {
    savingStatus.value = false
  }
}

async function saveBulkAttendanceStatus() {
  const ids = [...selectedIds.value]
  if (ids.length === 0 || bulkEditingStatus.value === '') {
    return
  }
  bulkSavingStatus.value = true
  actionError.value = ''
  try {
    const result = await api.adminBulkUpdateClassAttendanceRecordStatuses(props.classId, ids, Number(bulkEditingStatus.value))
    await loadClassAttendancePage()
    selectedIds.value = [...result.failed_items]
    if (result.failed_count > 0) {
      actionError.value = result.applied_count > 0
        ? `已更新 ${result.applied_count} 项，仍有 ${result.failed_count} 项修改失败`
        : `仍有 ${result.failed_count} 项修改失败`
      return
    }
    clearSelection()
    closeBulkEditModal()
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '批量修改考勤状态失败'
  } finally {
    bulkSavingStatus.value = false
  }
}
</script>

<template>
  <div class="attendance-detail-view">
    <div class="attendance-detail-layout">
      <aside class="workspace-card course-context-card">
        <div class="workspace-card nested-context-card">
          <div class="section-heading section-heading-compact">
            <strong>班级</strong>
          </div>
          <div class="settings-profile-summary-list">
            <div v-for="item in classSummary" :key="item.label" class="settings-profile-summary-item">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </div>
        </div>
      </aside>

      <section class="workspace-card course-subpage-main">
        <AdminDataList
          :rows="detailRows as unknown as Array<Record<string, unknown>>"
          :columns="detailColumns as unknown as Array<{ key: string; label: string; width?: number }>"
          row-key="id"
          empty-text="暂无班级考勤明细"
          :show-selection="true"
          :selected-row-keys="selectedIds"
          :show-actions="true"
          :action-col-width="12"
          :pagination="{ page: detailPage, pageSize: detailPageSize, totalPages: detailTotalPages, pageOptions: PAGE_OPTIONS, totalItems: detailTotalItems }"
          :all-items="detailTotalItems"
          :selected-items="selectedIds.length"
          :active-filter-keys="[
            ...(detailDate ? ['lesson_date'] : []),
            ...(detailSection ? ['lesson_time'] : []),
            ...(detailCourseName.trim() ? ['course_name'] : []),
            ...(detailTeacherName.trim() ? ['teacher_name'] : []),
            ...(detailStudentId.trim() ? ['student_id'] : []),
            ...(detailRealName.trim() ? ['real_name'] : []),
            ...(detailStatus ? ['status'] : []),
            ...(detailOperatorName.trim() ? ['operator_name'] : []),
            ...(detailOperatedDate ? ['operated_at'] : []),
          ]"
          :has-search-condition="!!(detailDate || detailSection || detailCourseName.trim() || detailTeacherName.trim() || detailStudentId.trim() || detailRealName.trim() || detailStatus || detailOperatorName.trim() || detailOperatedDate)"
          @update-page="detailPage = $event"
          @update-page-size="detailPageSize = $event"
          @toggle-row-selection="toggleSelection(Number($event))"
        >
          <template #filter-lesson_date>
            <input v-model="detailDate" type="date" aria-label="按日期筛选班级考勤明细" />
          </template>
          <template #filter-lesson_time>
            <select v-model="detailSection" aria-label="按时间筛选班级考勤明细">
              <option value="">全部</option>
              <option v-for="(label, key) in sectionLabels" :key="key" :value="String(key)">{{ label }}</option>
            </select>
          </template>
          <template #filter-course_name>
            <input v-model="detailCourseName" aria-label="按课程筛选班级考勤明细" />
          </template>
          <template #filter-teacher_name>
            <input v-model="detailTeacherName" aria-label="按教师筛选班级考勤明细" />
          </template>
          <template #filter-student_id>
            <AppDigitInput v-model="detailStudentId" aria-label="按学号筛选班级考勤明细" />
          </template>
          <template #filter-real_name>
            <input v-model="detailRealName" aria-label="按姓名筛选班级考勤明细" />
          </template>
          <template #filter-status>
            <select v-model="detailStatus" aria-label="按状态筛选班级考勤明细">
              <option value="">全部</option>
              <option v-for="item in ATTENDANCE_STATUS_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </template>
          <template #filter-operator_name>
            <input v-model="detailOperatorName" aria-label="按最后操作用户筛选班级考勤明细" />
          </template>
          <template #filter-operated_at>
            <input v-model="detailOperatedDate" type="date" aria-label="按最后操作时间筛选班级考勤明细" />
          </template>
          <template #filter-actions>
            <button class="ghost-button compact-button" :class="{ selected: areAllVisibleDetailsSelected }" type="button" @click="togglePageSelection">
              全选
            </button>
            <button class="ghost-button compact-button" type="button" :disabled="detailLoading || selectedIds.length === 0" @click="openBulkEditModal">
              批量修改
            </button>
          </template>
          <template #cell-lesson_time="{ row }">
            {{ lessonTimeLabel(asClassAttendanceItem(row).section) }}
          </template>
          <template #cell-status="{ value }">
            <span class="status-badge" :class="attendanceStatusBadgeClass(value as number)">
              {{ formatStatus(Number(value)) }}
            </span>
          </template>
          <template #cell-operator_name="{ value }">
            {{ String(value ?? '').trim() || '-' }}
          </template>
          <template #cell-operated_at="{ value }">
            {{ typeof value === 'string' ? formatDateTime(value) : '-' }}
          </template>
          <template #actions="{ row }">
            <div class="inline-actions user-actions">
              <button class="ghost-button compact-button" type="button" @click="openEditModal(asClassAttendanceItem(row))">修改</button>
              <button class="ghost-button compact-button" type="button" @click="openAttendanceLogDetail(asClassAttendanceItem(row))">变更记录</button>
            </div>
          </template>
          <template #empty>
            <template v-if="detailLoading">加载中...</template>
            <template v-else-if="detailError">{{ detailError }}</template>
            <template v-else>暂无班级考勤明细</template>
          </template>
          <template #footer-trailing>
            <label class="course-manage-term-filter attendance-pagination-term attendance-pagination-term-plain">
              <select v-model="selectedTermModel" aria-label="选择班级考勤明细学期" :disabled="termOptions.length === 0">
                <option v-for="item in termOptions" :key="item.id" :value="item.name">{{ item.name }}</option>
              </select>
            </label>
          </template>
        </AdminDataList>
      </section>
    </div>

    <Transition name="modal-float" appear>
      <div v-if="editModalOpen && editingRecord" class="modal-backdrop">
        <article class="modal-card modal-card-narrow">
          <div class="modal-header">
            <h3>修改考勤状态</h3>
            <button class="ghost-button compact-button modal-close" type="button" @click="closeEditModal">关闭</button>
          </div>
          <form class="form-grid single-column-form" @submit.prevent="saveAttendanceStatus">
            <label class="field attendance-status-static-field">
              <span>日期</span>
              <input class="readonly-field-input" :value="editingRecord.lesson_date" readonly />
            </label>
            <label class="field attendance-status-static-field">
              <span>时间</span>
              <input class="readonly-field-input" :value="lessonTimeLabel(editingRecord.section)" readonly />
            </label>
            <label class="field attendance-status-static-field">
              <span>课程</span>
              <input class="readonly-field-input" :value="editingRecord.course_name" readonly />
            </label>
            <label class="field attendance-status-static-field">
              <span>教师</span>
              <input class="readonly-field-input" :value="editingRecord.teacher_name" readonly />
            </label>
            <label class="field attendance-status-static-field">
              <span>学号</span>
              <input class="readonly-field-input" :value="editingRecord.student_id" readonly />
            </label>
            <label class="field attendance-status-static-field">
              <span>姓名</span>
              <input class="readonly-field-input" :value="editingRecord.real_name" readonly />
            </label>
            <label class="field">
              <span>状态</span>
              <select v-model="editingStatus">
                <option v-for="item in ATTENDANCE_STATUS_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</option>
              </select>
            </label>
            <p v-if="actionError" class="hint form-error-text">{{ actionError }}</p>
            <button class="primary-button" type="submit" :disabled="savingStatus">
              <span v-if="savingStatus" class="button-spinner" aria-hidden="true"></span>
              <span>{{ savingStatus ? '提交中...' : '提交' }}</span>
            </button>
          </form>
        </article>
      </div>
    </Transition>

    <Transition name="modal-float" appear>
      <div v-if="bulkEditModalOpen" class="modal-backdrop">
        <article class="modal-card modal-card-narrow">
          <div class="modal-header">
            <h3>批量修改考勤状态</h3>
            <button class="ghost-button compact-button modal-close" type="button" @click="closeBulkEditModal">关闭</button>
          </div>
          <form class="form-grid single-column-form" @submit.prevent="saveBulkAttendanceStatus">
            <label class="field">
              <span>状态</span>
              <select v-model="bulkEditingStatus">
                <option v-for="item in ATTENDANCE_STATUS_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</option>
              </select>
            </label>
            <p v-if="actionError" class="hint form-error-text">{{ actionError }}</p>
            <button class="primary-button" type="submit" :disabled="bulkSavingStatus">
              <span v-if="bulkSavingStatus" class="button-spinner" aria-hidden="true"></span>
              <span>{{ bulkSavingStatus ? '提交中...' : '提交' }}</span>
            </button>
          </form>
        </article>
      </div>
    </Transition>
  </div>
</template>
