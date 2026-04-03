<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { api, type AttendanceRecordStudentItem } from '../../api'
import { attendanceStatusBadgeClass, statusLabels } from '../../constants'
import { omitAdminFocusQuery, readAdminQueryNumber } from '../../router/admin-routes'
import AppDigitInput from '../common/AppDigitInput.vue'
import AdminDataList from './AdminDataList.vue'

const props = defineProps<{
  sessionId: number
  sessionDate: string
  sessionTime: string
  location: string
  classSummary: string
  studentCount: number
  courseName: string
  teacherName: string
  grade: number | string
  term: string
}>()

const route = useRoute()
const router = useRouter()

const PAGE_OPTIONS = [100, 200, 500, 1000]

const detailColumns = [
  { key: 'student_id', label: '学号', width: 9 },
  { key: 'real_name', label: '姓名', width: 6 },
  { key: 'class_name', label: '班级', width: 9, copyable: false },
  { key: 'status', label: '状态', width: 4, copyable: false },
  { key: 'operator_name', label: '最后操作用户', width: 8 },
  { key: 'operated_at', label: '最后操作时间', width: 14, copyValue: (row: Record<string, unknown>) => typeof row.operated_at === 'string' ? formatDateTime(row.operated_at) : '-' },
] as const

const detailRows = ref<AttendanceRecordStudentItem[]>([])
const detailStudentId = ref('')
const detailRealName = ref('')
const detailClassName = ref('')
const detailStatus = ref('')
const detailOperatorName = ref('')
const detailOperatedDate = ref('')
const detailPage = ref(1)
const detailPageSize = ref(100)
const detailTotalItems = ref(0)
const detailLoading = ref(false)
const detailError = ref('')
const detailFocusRowKey = ref<number | null>(null)
const detailFocusToken = ref(0)
const suspendDetailAutoLoad = ref(false)

const editModalOpen = ref(false)
const editingRecord = ref<AttendanceRecordStudentItem | null>(null)
const editingStatus = ref('')
const savingStatus = ref(false)
const actionError = ref('')

let detailRequestToken = 0

const detailQueryKey = computed(() =>
  JSON.stringify({
    studentId: detailStudentId.value.trim(),
    realName: detailRealName.value.trim(),
    className: detailClassName.value.trim(),
    status: detailStatus.value,
    operatorName: detailOperatorName.value.trim(),
    operatedDate: detailOperatedDate.value,
    pageSize: detailPageSize.value,
  }),
)

watch(
  () => props.sessionId,
  async () => {
    suspendDetailAutoLoad.value = true
    detailStudentId.value = ''
    detailRealName.value = ''
    detailClassName.value = ''
    detailStatus.value = ''
    detailOperatorName.value = ''
    detailOperatedDate.value = ''
    detailPage.value = 1
    await nextTick()
    suspendDetailAutoLoad.value = false
    if (props.sessionId) {
      void loadSessionDetailPage()
    }
  },
  { immediate: true },
)

watch(
  () => [detailQueryKey.value, detailPage.value] as const,
  ([queryKey, page], previousValue) => {
    if (!props.sessionId || suspendDetailAutoLoad.value) {
      return
    }
    const [previousQueryKey] = previousValue ?? ['', 1]
    if (queryKey !== previousQueryKey && page !== 1) {
      detailPage.value = 1
      return
    }
    void loadSessionDetailPage()
  },
)

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

const lessonSummary = computed(() => [
  { label: '日期', value: props.sessionDate || '-' },
  { label: '时间', value: props.sessionTime || '-' },
  { label: '地点', value: props.location || '-' },
])

const groupSummary = computed(() => [
  { label: '上课班级', value: props.classSummary || '-' },
  { label: '上课人数', value: `${props.studentCount}` },
])

const courseSummary = computed(() => [
  { label: '课程名称', value: props.courseName || '-' },
  { label: '教师', value: props.teacherName || '-' },
  { label: '年级', value: `${props.grade || '-'}` },
  { label: '学期', value: props.term || '-' },
])

async function loadSessionDetailPage() {
  detailRequestToken += 1
  const requestToken = detailRequestToken
  detailLoading.value = true
  detailError.value = ''
  const focusStudentRefId = readAdminQueryNumber(route.query, 'focus_student_ref_id')
  try {
    const result = await api.adminGetAttendanceSessionPage(props.sessionId, {
      page: detailPage.value,
      page_size: detailPageSize.value,
      student_id: detailStudentId.value,
      real_name: detailRealName.value,
      class_name: detailClassName.value === '未绑定班级' ? '' : detailClassName.value,
      status: detailStatus.value,
      operator_name: detailOperatorName.value,
      operated_date: detailOperatedDate.value,
      focus_student_ref_id: focusStudentRefId ?? undefined,
    })
    if (requestToken !== detailRequestToken) {
      return
    }
    detailRows.value = result.attendance_records ?? []
    detailPage.value = result.page ?? detailPage.value
    detailTotalItems.value = result.total ?? 0
    if (focusStudentRefId !== null) {
      if (result.focus_found && typeof result.focus_row_key === 'number') {
        detailFocusRowKey.value = result.focus_row_key
        detailFocusToken.value += 1
      }
      await router.replace({
        name: route.name || undefined,
        params: route.params,
        query: omitAdminFocusQuery(route.query),
        hash: route.hash,
      })
    }
  } catch (error) {
    if (requestToken !== detailRequestToken) {
      return
    }
    detailRows.value = []
    detailTotalItems.value = 0
    detailError.value = error instanceof Error ? error.message : '加载课次考勤明细失败'
  } finally {
    if (requestToken === detailRequestToken) {
      detailLoading.value = false
    }
  }
}

function normalizeClassName(value?: string | null) {
  return value?.trim() || '未绑定班级'
}

function formatStatus(status?: number | null) {
  if (status === null || status === undefined) {
    return '未查'
  }
  return statusLabels[status as 0 | 1 | 2 | 3] ?? '未知'
}

function formatDateTime(value: string) {
  return value.replace('T', ' ').slice(0, 19)
}

function asAttendanceRecordStudentItem(row: Record<string, unknown>) {
  return row as unknown as AttendanceRecordStudentItem
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
  if (!editingRecord.value || editingStatus.value === '') {
    return
  }
  savingStatus.value = true
  actionError.value = ''
  try {
    await api.adminUpdateAttendanceStatus(props.sessionId, editingRecord.value.id, Number(editingStatus.value))
    await loadSessionDetailPage()
    closeEditModal()
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '修改考勤状态失败'
  } finally {
    savingStatus.value = false
  }
}
</script>

<template>
  <div class="attendance-detail-view">
    <div class="course-subpage-grid">
      <aside class="workspace-card course-context-card">
        <div class="settings-profile-summary-list">
          <div class="workspace-card nested-context-card">
            <div class="section-heading section-heading-compact">
              <strong>课次</strong>
            </div>
            <div class="settings-profile-summary-list">
              <div v-for="item in lessonSummary" :key="item.label" class="settings-profile-summary-item">
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
              <div v-for="item in groupSummary" :key="item.label" class="settings-profile-summary-item">
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
              <div v-for="item in courseSummary" :key="item.label" class="settings-profile-summary-item">
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
          :columns="detailColumns as unknown as Array<{ key: string; label: string; width?: number }>"
          row-key="id"
          empty-text="暂无课次考勤明细"
          :show-actions="true"
          :action-col-width="14"
          :pagination="{ page: detailPage, pageSize: detailPageSize, totalPages: detailTotalPages, pageOptions: PAGE_OPTIONS, totalItems: detailTotalItems }"
          :all-items="detailTotalItems"
          :highlight-row-key="detailFocusRowKey"
          :highlight-token="detailFocusToken"
          :active-filter-keys="[
            ...(detailStudentId.trim() ? ['student_id'] : []),
            ...(detailRealName.trim() ? ['real_name'] : []),
            ...(detailClassName ? ['class_name'] : []),
            ...(detailStatus ? ['status'] : []),
            ...(detailOperatorName.trim() ? ['operator_name'] : []),
            ...(detailOperatedDate ? ['operated_at'] : []),
          ]"
          :has-search-condition="!!(detailStudentId.trim() || detailRealName.trim() || detailClassName || detailStatus || detailOperatorName.trim() || detailOperatedDate)"
          @update-page="detailPage = $event"
          @update-page-size="detailPageSize = $event"
        >
          <template #filter-student_id>
            <AppDigitInput v-model="detailStudentId" aria-label="按学号筛选课次考勤明细" />
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
          <template #filter-operator_name>
            <input v-model="detailOperatorName" aria-label="按最后操作用户筛选课次考勤明细" />
          </template>
          <template #filter-operated_at>
            <input v-model="detailOperatedDate" type="date" aria-label="按最后操作时间筛选课次考勤明细" />
          </template>
          <template #cell-class_name="{ value }">
            {{ normalizeClassName(String(value ?? '')) }}
          </template>
          <template #cell-status="{ value }">
            <span class="status-badge" :class="attendanceStatusBadgeClass(value as number | null | undefined)">
              {{ formatStatus(value as number | null | undefined) }}
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
  </div>
</template>
