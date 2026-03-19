<script setup lang="ts">
import { ref, watch } from 'vue'

import { api, type AttendanceRecordLogItem, type AttendanceRecordStudentItem } from '../../api'
import { statusName } from '../../composables/app/view'
import type { StatusCode } from '../../constants'
import AdminDataList from './AdminDataList.vue'
import type { AdminAttendanceProps } from './types'

defineProps<AdminAttendanceProps>()

const emit = defineEmits<{
  updateAdminStatus: [sessionId: number, studentRefId: number, status: StatusCode]
}>()

const PAGE_OPTIONS = [5, 10, 20, 50]

type AttendanceSessionSummary = {
  course_group_lesson_id: number
  course_id: number
  course_name: string
  teacher_name: string
  week_no: number
  session_no: number
  student_count: number
  present_count: number
  late_count: number
  absent_count: number
  leave_count: number
}

const sessionKeyword = ref('')
const sessionWeekNo = ref('')
const sessionStatus = ref('')
const sessionPage = ref(1)
const sessionPageSize = ref(10)
const sessionLoading = ref(false)
const sessionError = ref('')
const sessionRows = ref<AttendanceSessionSummary[]>([])
const sessionTotalPages = ref(1)

const detailKeyword = ref('')
const detailStatus = ref('')
const detailPage = ref(1)
const detailPageSize = ref(10)
const activeSession = ref<AttendanceSessionSummary | null>(null)
const detailLoading = ref(false)
const detailError = ref('')
const detailRecords = ref<AttendanceRecordStudentItem[]>([])
const detailTotalPages = ref(1)
const selectedRecordLogs = ref<AttendanceRecordLogItem[]>([])
const selectedRecordLogName = ref('')
const logsLoading = ref(false)
const logsError = ref('')

const attendanceSessionColumns = [
  { key: 'course_name', label: '课程', colClass: 'col-pct-18' },
  { key: 'teacher_name', label: '教师', colClass: 'col-pct-14' },
  { key: 'week_no', label: '周次', colClass: 'col-pct-18', copyValue: (row: Record<string, unknown>) => `第 ${row.week_no} 周 / 第 ${row.session_no} 次` },
  { key: 'student_count', label: '学生数', colClass: 'col-pct-12' },
  { key: 'summary', label: '考勤概况', colClass: 'col-pct-18', copyValue: (row: Record<string, unknown>) => sessionSummaryText(row as unknown as AttendanceSessionSummary) },
] as const
const attendanceDetailColumns = [
  { key: 'course', label: '课程', colClass: 'col-pct-14', copyValue: () => activeSession.value?.course_name ?? '-' },
  { key: 'teacher', label: '教师', colClass: 'col-pct-12', copyValue: () => activeSession.value?.teacher_name ?? '-' },
  { key: 'week', label: '周次', colClass: 'col-pct-18', copyValue: () => activeSession.value ? `第 ${activeSession.value.week_no} 周 / 第 ${activeSession.value.session_no} 次` : '-' },
  { key: 'student', label: '学号 / 姓名', colClass: 'col-pct-18', copyValue: (row: Record<string, unknown>) => `${row.student_id} / ${row.real_name}` },
  { key: 'class_name', label: '班级', colClass: 'col-pct-14', copyValue: (row: Record<string, unknown>) => String(row.class_name || '其他学生') },
  { key: 'status', label: '状态', colClass: 'col-pct-12', copyValue: (row: Record<string, unknown>) => row.status === null || row.status === undefined ? '未查' : statusName(Number(row.status)) },
  { key: 'edit_status', label: '修改', colClass: 'col-pct-12', copyable: false },
] as const

const sessionSummaryText = (item: AttendanceSessionSummary) =>
  `签到 ${item.present_count} / 迟到 ${item.late_count} / 缺勤 ${item.absent_count} / 请假 ${item.leave_count}`

function onStatusChange(event: Event, studentRefId: number) {
  const target = event.target as HTMLSelectElement
  if (!activeSession.value || target.value === '') {
    return
  }
  emit('updateAdminStatus', activeSession.value.course_group_lesson_id, studentRefId, Number(target.value) as StatusCode)
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return '-'
  }
  return value.replace('T', ' ').slice(0, 19)
}

function asAttendanceRecordStudentItem(row: Record<string, unknown>) {
  return row as unknown as AttendanceRecordStudentItem
}

async function openSessionDetail(item: AttendanceSessionSummary) {
  activeSession.value = item
  detailPage.value = 1
  selectedRecordLogs.value = []
  selectedRecordLogName.value = ''
  logsError.value = ''
  await loadDetailRecords()
}

function closeSessionDetail() {
  activeSession.value = null
  detailRecords.value = []
  detailError.value = ''
  detailKeyword.value = ''
  detailStatus.value = ''
  selectedRecordLogs.value = []
  selectedRecordLogName.value = ''
  logsError.value = ''
}

async function loadSessionRows() {
  sessionLoading.value = true
  sessionError.value = ''
  try {
    const result = await api.adminAttendanceSessions({
      page: sessionPage.value,
      page_size: sessionPageSize.value,
      keyword: sessionKeyword.value,
      week_no: sessionWeekNo.value,
      status: sessionStatus.value,
    })
    sessionRows.value = (result.items ?? []) as unknown as AttendanceSessionSummary[]
    sessionTotalPages.value = Math.max(1, Math.ceil((result.total ?? 0) / sessionPageSize.value))
  } catch (error) {
    sessionRows.value = []
    sessionError.value = error instanceof Error ? error.message : '加载考勤记录失败'
  } finally {
    sessionLoading.value = false
  }
}

async function loadDetailRecords() {
  if (!activeSession.value) {
    return
  }
  detailLoading.value = true
  detailError.value = ''
  try {
    const result = await api.adminGetAttendanceSessionPage(activeSession.value.course_group_lesson_id, {
      page: detailPage.value,
      page_size: detailPageSize.value,
      keyword: detailKeyword.value,
      status: detailStatus.value,
    })
    detailRecords.value = result.items ?? []
    detailTotalPages.value = Math.max(1, Math.ceil((result.total ?? 0) / detailPageSize.value))
  } catch (error) {
    detailRecords.value = []
    detailError.value = error instanceof Error ? error.message : '加载考勤明细失败'
  } finally {
    detailLoading.value = false
  }
}

async function openRecordLogs(item: AttendanceRecordStudentItem) {
  if (!item.attendance_record_id) {
    selectedRecordLogs.value = []
    selectedRecordLogName.value = `${item.real_name}（${item.student_id}）`
    logsError.value = ''
    return
  }
  logsLoading.value = true
  logsError.value = ''
  selectedRecordLogName.value = `${item.real_name}（${item.student_id}）`
  try {
    selectedRecordLogs.value = await api.adminAttendanceRecordLogs(item.attendance_record_id)
  } catch (error) {
    selectedRecordLogs.value = []
    logsError.value = error instanceof Error ? error.message : '加载修改记录失败'
  } finally {
    logsLoading.value = false
  }
}

watch([sessionKeyword, sessionWeekNo, sessionStatus, sessionPageSize], () => {
  sessionPage.value = 1
})

watch([detailKeyword, detailStatus, detailPageSize], () => {
  detailPage.value = 1
})

watch([sessionPage, sessionPageSize, sessionKeyword, sessionWeekNo, sessionStatus], () => {
  void loadSessionRows()
}, { immediate: true })

watch([detailPage, detailPageSize, detailKeyword, detailStatus], () => {
  if (activeSession.value) {
    void loadDetailRecords()
  }
})
</script>

<template>
  <section class="workspace-card user-manage-panel">
    <template v-if="activeSession">
      <div class="section-heading section-heading-titleless">
        <div class="inline-actions">
          <button class="ghost-button compact-button" type="button" @click="closeSessionDetail">返回考勤记录</button>
        </div>
      </div>

      <AdminDataList
        :rows="detailRecords as unknown as Array<Record<string, unknown>>"
        :columns="attendanceDetailColumns as unknown as Array<{ key: string; label: string; colClass?: string }>"
        row-key="id"
        empty-text="暂无符合条件的考勤明细"
        :show-actions="true"
        action-col-class="col-pct-12"
        :pagination="{ page: detailPage, pageSize: detailPageSize, totalPages: detailTotalPages, pageOptions: PAGE_OPTIONS }"
        @update-page="detailPage = $event"
        @update-page-size="detailPageSize = $event"
      >
        <template #filter-student>
          <input v-model="detailKeyword" aria-label="按学号或姓名筛选考勤明细" />
        </template>
        <template #filter-status>
          <select v-model="detailStatus" aria-label="按状态筛选考勤明细">
            <option value="">全部</option>
            <option value="unrecorded">未查</option>
            <option value="0">签到</option>
            <option value="1">迟到</option>
            <option value="2">缺勤</option>
            <option value="3">请假</option>
          </select>
        </template>
        <template #cell-course>
          {{ activeSession?.course_name ?? '-' }}
        </template>
        <template #cell-teacher>
          {{ activeSession?.teacher_name ?? '-' }}
        </template>
        <template #cell-week>
          {{ activeSession ? `第 ${activeSession.week_no} 周 / 第 ${activeSession.session_no} 次` : '-' }}
        </template>
        <template #cell-student="{ row }">
          {{ row.student_id }} / {{ row.real_name }}
        </template>
        <template #cell-class_name="{ value }">
          {{ value || '其他学生' }}
        </template>
        <template #cell-status="{ row }">
          <span class="status-badge" :class="row.status === null || row.status === undefined ? 'tag-muted' : statusClass(Number(row.status))">
            {{ row.status === null || row.status === undefined ? '未查' : statusName(Number(row.status)) }}
          </span>
        </template>
        <template #cell-edit_status="{ row }">
          <select class="mini-select" :value="row.status ?? ''" @change="onStatusChange($event, Number(row.id))">
            <option value="">未查</option>
            <option :value="0">签到</option>
            <option :value="1">迟到</option>
            <option :value="2">缺勤</option>
            <option :value="3">请假</option>
          </select>
        </template>
        <template #actions="{ row }">
          <div class="inline-actions user-actions">
            <button class="ghost-button compact-button" type="button" :disabled="!asAttendanceRecordStudentItem(row).attendance_record_id" @click="openRecordLogs(asAttendanceRecordStudentItem(row))">查看修改记录</button>
          </div>
        </template>
        <template #empty>
          <template v-if="detailLoading">加载中...</template>
          <template v-else-if="detailError">{{ detailError }}</template>
          <template v-else>暂无符合条件的考勤明细</template>
        </template>
      </AdminDataList>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>修改记录</th>
              <th>操作人</th>
              <th>原状态</th>
              <th>新状态</th>
              <th>操作类型</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="logsLoading">
              <td colspan="5" class="empty-cell">加载修改记录中...</td>
            </tr>
            <tr v-else-if="logsError">
              <td colspan="5" class="empty-cell">{{ logsError }}</td>
            </tr>
            <tr v-else-if="selectedRecordLogs.length === 0">
              <td colspan="5" class="empty-cell">
                {{ selectedRecordLogName ? `“${selectedRecordLogName}”暂无修改记录` : '请选择一条考勤明细查看修改记录' }}
              </td>
            </tr>
            <tr v-for="item in selectedRecordLogs" :key="item.id">
              <td>{{ formatDateTime(item.operated_at) }}</td>
              <td>{{ item.operator_login_id }}</td>
              <td>{{ item.operation_type === 'create_record' || item.old_status === null || item.old_status === undefined ? '-' : statusName(item.old_status) }}</td>
              <td>{{ statusName(item.new_status) }}</td>
              <td>{{ item.operation_type }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <template v-else>
      <AdminDataList
        :rows="sessionRows as unknown as Array<Record<string, unknown>>"
        :columns="attendanceSessionColumns as unknown as Array<{ key: string; label: string; colClass?: string }>"
        row-key="course_group_lesson_id"
        empty-text="暂无符合条件的考勤记录"
        :show-actions="true"
        action-col-class="col-pct-14"
        :pagination="{ page: sessionPage, pageSize: sessionPageSize, totalPages: sessionTotalPages, pageOptions: PAGE_OPTIONS }"
        @update-page="sessionPage = $event"
        @update-page-size="sessionPageSize = $event"
      >
        <template #filter-course_name>
          <input v-model="sessionKeyword" aria-label="按课程或教师筛选考勤记录" />
        </template>
        <template #filter-week_no>
          <input v-model="sessionWeekNo" type="number" min="1" aria-label="按周次筛选考勤记录" />
        </template>
        <template #filter-summary>
          <select v-model="sessionStatus" aria-label="按状态筛选考勤记录">
            <option value="">全部</option>
            <option value="0">包含签到</option>
            <option value="1">包含迟到</option>
            <option value="2">包含缺勤</option>
            <option value="3">包含请假</option>
          </select>
        </template>
        <template #cell-week_no="{ row }">
          第 {{ row.week_no }} 周 / 第 {{ row.session_no }} 次
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
          <template v-else>暂无符合条件的考勤记录</template>
        </template>
      </AdminDataList>
    </template>
  </section>
</template>
