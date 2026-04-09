<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import type { StudentItem } from '../../api'
import { attendanceStatusBadgeClass } from '../../constants'
import AppDigitInput from '../common/AppDigitInput.vue'
import AdminDataList from './AdminDataList.vue'
import AppInputSelect from '../common/AppInputSelect.vue'
import type { AdminStudentManageProps } from './types'
import { selectDefaultTermName, sortTermsForSelect } from '../../utils/terms'
import type { AdminAttendanceLogsOpenPayload } from './shared-types'

const props = defineProps<AdminStudentManageProps>()
const AdminStudentAttendanceDetail = defineAsyncComponent(() => import('./AdminStudentAttendanceDetail.vue'))

const emit = defineEmits<{
  openCreateStudentModal: []
  openEditStudentModal: [item: StudentItem]
  closeStudentModal: []
  openDeleteStudentModal: [item: StudentItem]
  closeDeleteStudentModal: []
  openBulkDeleteStudentModal: []
  closeBulkDeleteStudentModal: []
  saveStudent: []
  deleteStudent: []
  bulkDeleteStudents: []
  openStudentAttendanceDetail: [item: StudentItem]
  updateStudentPage: [page: number]
  updateStudentPageSize: [size: number]
  toggleStudentSelection: [studentId: number]
  toggleStudentPageSelection: []
  openAttendanceLogs: [payload: AdminAttendanceLogsOpenPayload]
}>()

const studentColumns = [
  { key: 'student_id', label: '学号', width: 8 },
  { key: 'real_name', label: '姓名', width: 4 },
  { key: 'class_name', label: '所属班级', width: 6, copyable: false },
  { key: 'attendance_summary', label: '考勤概况', width: 12, copyable: false },
] as const

const studentFilterClassOptions = computed(() =>
  Array.from(
    new Set(props.allClasses.map((item) => item.class_name.trim())),
  )
    .filter((item) => item.length > 0)
    .sort((left, right) => left.localeCompare(right, 'zh-Hans-CN')),
)
const termOptions = computed(() => sortTermsForSelect(props.courseTerms))
const defaultTermName = computed(() => selectDefaultTermName(termOptions.value) || termOptions.value[0]?.name || '')
const showStudentAttendanceDetailView = computed(() => props.studentManageRouteView === 'attendance-detail' && typeof props.studentManageRouteStudentId === 'number' && props.studentManageRouteStudentId > 0)
const activeStudentAttendanceStudentId = computed(() => props.studentManageRouteStudentId ?? 0)

const STUDENT_UNBOUND_CLASS_LABEL = '未绑定班级'
const studentFormClassInput = ref(STUDENT_UNBOUND_CLASS_LABEL)
const studentFormClassOptions = computed(() =>
  [STUDENT_UNBOUND_CLASS_LABEL, ...props.allClasses.map((item) => item.class_name.trim())]
    .filter((item, index, array) => item.length > 0 && array.indexOf(item) === index),
)
const studentFormClassName = computed({
  get() {
    return studentFormClassInput.value
  },
  set(value: string) {
    const normalized = value.trim()
    studentFormClassInput.value = normalized || STUDENT_UNBOUND_CLASS_LABEL
    if (!normalized || normalized === STUDENT_UNBOUND_CLASS_LABEL) {
      props.studentForm.classId = ''
      return
    }
    const matched = props.allClasses.find((item) => item.class_name === normalized)
    props.studentForm.classId = matched?.id ?? ''
  },
})
const canSaveStudent = computed(
  () =>
    !props.studentSaving &&
    props.studentForm.studentId.trim().length > 0 &&
    props.studentForm.realName.trim().length > 0,
)

watch(
  termOptions,
  (terms) => {
    const termNames = terms.map((item) => item.name)
    if (!props.studentFilters.term || !termNames.includes(props.studentFilters.term)) {
      props.studentFilters.term = defaultTermName.value || termNames[0] || ''
    }
  },
  { immediate: true },
)

watch(
  () => [props.studentModalOpen, props.studentForm.classId] as const,
  ([open]) => {
    if (!open) {
      return
    }
    if (typeof props.studentForm.classId !== 'number') {
      studentFormClassInput.value = STUDENT_UNBOUND_CLASS_LABEL
      return
    }
    studentFormClassInput.value =
      props.allClasses.find((item) => item.id === props.studentForm.classId)?.class_name ?? STUDENT_UNBOUND_CLASS_LABEL
  },
  { immediate: true },
)

function asStudentItem(row: Record<string, unknown>) {
  return row as unknown as StudentItem
}

function normalizeClassName(value?: string | null) {
  return value?.trim() || '未绑定班级'
}

function studentAttendanceSummaryItems(item: StudentItem) {
  return [
    { key: 'late', label: '迟到', count: Number(item.late_count ?? 0), className: attendanceStatusBadgeClass(1) },
    { key: 'absent', label: '缺勤', count: Number(item.absent_count ?? 0), className: attendanceStatusBadgeClass(2) },
    { key: 'leave', label: '请假', count: Number(item.leave_count ?? 0), className: attendanceStatusBadgeClass(3) },
  ].filter((entry) => entry.count > 0)
}

function studentAttendanceSummaryText(item: StudentItem) {
  const entries = studentAttendanceSummaryItems(item)
  return entries.length > 0 ? entries.map((entry) => `${entry.label} ${entry.count}`).join(' / ') : '-'
}
</script>

<template>
  <section class="workspace-card user-manage-panel">
    <Transition name="modal-float" appear>
    <div v-if="studentModalOpen" class="modal-backdrop">
      <article class="modal-card modal-card-narrow">
        <div class="modal-header">
          <h3>{{ isEditingStudent ? '编辑学生信息' : '创建学生' }}</h3>
          <button class="ghost-button compact-button modal-close" type="button" @click="emit('closeStudentModal')">关闭</button>
        </div>
        <form class="form-grid single-column-form" @submit.prevent="emit('saveStudent')">
          <label class="field">
            <span>学号</span>
            <AppDigitInput v-model="studentForm.studentId" />
          </label>
          <label class="field">
            <span>姓名</span>
            <input v-model="studentForm.realName" />
          </label>
          <label class="field">
            <span>班级</span>
            <AppInputSelect
              v-model="studentFormClassName"
              :options="studentFormClassOptions"
              :allow-custom="false"
              aria-label="选择学生所属班级"
            />
          </label>
          <button class="primary-button" type="submit" :disabled="!canSaveStudent">
            <span v-if="studentSaving" class="button-spinner" aria-hidden="true"></span>
            <span>{{ studentSaving ? '保存中...' : '保存' }}</span>
          </button>
        </form>
      </article>
    </div>
    </Transition>

    <Transition name="modal-float" appear>
    <div v-if="deleteStudentModalOpen" class="modal-backdrop">
      <article class="modal-card modal-card-narrow">
        <div class="modal-header">
          <h3>确认删除</h3>
          <button class="ghost-button compact-button modal-close" type="button" @click="emit('closeDeleteStudentModal')">关闭</button>
        </div>
        <p class="hint">删除后无法恢复。确定删除学生“{{ deletingStudentName }}”吗？</p>
        <div class="inline-actions">
          <button class="ghost-button" type="button" @click="emit('closeDeleteStudentModal')">取消</button>
          <button class="ghost-button danger-button" type="button" :disabled="studentDeleting" @click="emit('deleteStudent')">
            <span v-if="studentDeleting" class="button-spinner" aria-hidden="true"></span>
            <span>{{ studentDeleting ? '删除中...' : '确认删除' }}</span>
          </button>
        </div>
      </article>
    </div>
    </Transition>

    <Transition name="modal-float" appear>
    <div v-if="bulkDeleteStudentModalOpen" class="modal-backdrop">
      <article class="modal-card modal-card-narrow">
        <div class="modal-header">
          <h3>确认批量删除</h3>
          <button class="ghost-button compact-button modal-close" type="button" @click="emit('closeBulkDeleteStudentModal')">关闭</button>
        </div>
        <p class="hint">删除后无法恢复。确定删除已选中的 {{ selectedStudentCount }} 个学生吗？</p>
        <div class="inline-actions">
          <button class="ghost-button" type="button" @click="emit('closeBulkDeleteStudentModal')">取消</button>
          <button class="ghost-button danger-button" type="button" :disabled="studentDeleting" @click="emit('bulkDeleteStudents')">
            <span v-if="studentDeleting" class="button-spinner" aria-hidden="true"></span>
            <span>{{ studentDeleting ? '删除中...' : '确认删除' }}</span>
          </button>
        </div>
      </article>
    </div>
    </Transition>

    <Transition name="subpage-fade" mode="out-in" appear>
      <AdminDataList
        v-if="!showStudentAttendanceDetailView"
        key="student-list"
        :rows="students as unknown as Array<Record<string, unknown>>"
        :columns="studentColumns as unknown as Array<{ key: string; label: string; width?: number }>"
        row-key="id"
        table-class="student-manage-table"
        empty-text="暂无学生数据"
        :show-selection="true"
        :selected-row-keys="selectedStudentIds"
        :show-actions="true"
        :action-col-width="30"
        :pagination="{ page: studentPage, pageSize: studentPageSize, totalPages: studentTotalPages, pageOptions: studentPageOptions, totalItems: studentTotalItems }"
        :all-items="studentAllItems"
        :selected-items="selectedStudentIds.length"
        :highlight-row-key="studentFocusRowKey ?? null"
        :highlight-token="studentFocusToken ?? 0"
        :active-filter-keys="[
          ...(studentFilters.studentId.trim() ? ['student_id'] : []),
          ...(studentFilters.realName.trim() ? ['real_name'] : []),
          ...(studentFilters.className.trim() ? ['class_name'] : []),
          ...(studentFilters.attendanceSummaryStatus ? ['attendance_summary'] : []),
        ]"
        :has-search-condition="!!(studentFilters.studentId.trim() || studentFilters.realName.trim() || studentFilters.className.trim() || studentFilters.attendanceSummaryStatus)"
        @update-page="emit('updateStudentPage', $event)"
        @update-page-size="emit('updateStudentPageSize', $event)"
        @toggle-row-selection="emit('toggleStudentSelection', Number($event))"
      >
        <template #filter-student_id>
          <AppDigitInput v-model="studentFilters.studentId" aria-label="按学号筛选学生" />
        </template>
        <template #filter-real_name>
          <input v-model="studentFilters.realName" aria-label="按姓名筛选学生" />
        </template>
        <template #filter-class_name>
          <AppInputSelect
            v-model="studentFilters.className"
            :options="studentFilterClassOptions"
            aria-label="按班级名称筛选学生"
          />
        </template>
        <template #filter-attendance_summary>
          <select v-model="studentFilters.attendanceSummaryStatus" aria-label="按考勤概况筛选学生">
            <option value="">全部</option>
            <option value="late">迟到</option>
            <option value="absent">缺勤</option>
            <option value="leave">请假</option>
          </select>
        </template>
        <template #filter-actions>
          <button class="ghost-button compact-button" type="button" @click="emit('toggleStudentPageSelection')">
            全选
          </button>
          <button class="ghost-button compact-button danger-button" type="button" :disabled="studentDeleting || selectedStudentIds.length === 0" @click="emit('openBulkDeleteStudentModal')">
            批量删除
          </button>
          <button class="primary-button compact-button filter-action-push" type="button" @click="emit('openCreateStudentModal')">
            创建学生
          </button>
        </template>
        <template #cell-class_name="{ value }">
          {{ normalizeClassName(typeof value === 'string' ? value : null) }}
        </template>
        <template #cell-attendance_summary="{ row }">
          <div class="attendance-session-summary" :aria-label="studentAttendanceSummaryText(asStudentItem(row))">
            <span
              v-for="item in studentAttendanceSummaryItems(asStudentItem(row))"
              :key="item.key"
              class="status-badge attendance-session-summary-chip"
              :class="item.className"
            >
              <span class="attendance-session-summary-label">{{ item.label }}</span>
              <span class="attendance-session-summary-count">{{ item.count }}</span>
            </span>
            <span v-if="studentAttendanceSummaryItems(asStudentItem(row)).length === 0" class="attendance-session-summary-empty">-</span>
          </div>
        </template>
        <template #actions="{ row }">
          <div class="inline-actions user-actions">
            <button class="ghost-button compact-button" type="button" @click="emit('openStudentAttendanceDetail', asStudentItem(row))">考勤明细</button>
            <button class="ghost-button compact-button" type="button" @click="emit('openEditStudentModal', asStudentItem(row))">编辑</button>
            <button class="ghost-button compact-button danger-button" type="button" @click="emit('openDeleteStudentModal', asStudentItem(row))">删除</button>
          </div>
        </template>
        <template #footer-trailing>
          <label class="course-manage-term-filter attendance-pagination-term attendance-pagination-term-plain">
            <select v-model="studentFilters.term" aria-label="选择学生考勤概况统计学期" :disabled="termOptions.length === 0">
              <option v-for="item in termOptions" :key="item.id" :value="item.name">{{ item.name }}</option>
            </select>
          </label>
        </template>
      </AdminDataList>

      <AdminStudentAttendanceDetail
        v-else
        key="student-attendance-detail"
        :student-id="activeStudentAttendanceStudentId"
        :selected-term="studentFilters.term"
        :course-terms="courseTerms"
        @update:selected-term="studentFilters.term = $event"
        @open-attendance-logs="emit('openAttendanceLogs', $event)"
      />
    </Transition>
  </section>
</template>
