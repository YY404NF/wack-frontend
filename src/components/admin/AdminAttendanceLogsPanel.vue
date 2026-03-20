<script setup lang="ts">
import AdminDataList from './AdminDataList.vue'
import type { AdminAttendanceLogsProps } from './types'
import { statusName } from '../../composables/app/view'

defineProps<AdminAttendanceLogsProps>()

const emit = defineEmits<{
  updateAttendanceLogsPage: [page: number]
  updateAttendanceLogsPageSize: [size: number]
}>()
const attendanceLogColumns = [
  { key: 'operated_at', label: '操作时间', colClass: 'col-pct-18', copyValue: (row: Record<string, unknown>) => typeof row.operated_at === 'string' ? formatDateTime(row.operated_at) : '-' },
  { key: 'student_id', label: '学生', colClass: 'col-pct-14' },
  { key: 'operator_login_id', label: '操作人', colClass: 'col-pct-14' },
  { key: 'attendance_record_id', label: '考勤记录 ID', colClass: 'col-pct-14' },
  { key: 'old_status', label: '原状态', colClass: 'col-pct-12', copyValue: (row: Record<string, unknown>) => row.operation_type === 'create_record' || row.old_status === null || row.old_status === undefined ? '-' : statusName(Number(row.old_status)) },
  { key: 'new_status', label: '新状态', colClass: 'col-pct-12', copyValue: (row: Record<string, unknown>) => statusName(Number(row.new_status)) },
  { key: 'operation_type', label: '操作类型', colClass: 'col-pct-16' },
] as const

function formatDateTime(value: string) {
  return value.replace('T', ' ').slice(0, 19)
}
</script>

<template>
  <section class="workspace-card user-manage-panel">
    <AdminDataList
      :rows="attendanceLogs as unknown as Array<Record<string, unknown>>"
      :columns="attendanceLogColumns as unknown as Array<{ key: string; label: string; colClass?: string }>"
      row-key="id"
      empty-text="暂无考勤日志"
      :pagination="{ page: attendanceLogsPage, pageSize: attendanceLogsPageSize, totalPages: attendanceLogsTotalPages, pageOptions: attendanceLogsPageOptions, totalItems: attendanceLogsTotalItems }"
      @update-page="emit('updateAttendanceLogsPage', $event)"
      @update-page-size="emit('updateAttendanceLogsPageSize', $event)"
    >
      <template #filter-operated_at>
        <input v-model="attendanceLogFilters.operatedDate" type="date" aria-label="按日期筛选考勤日志" />
      </template>
      <template #filter-student_id>
        <input v-model="attendanceLogFilters.studentId" aria-label="按学生学号筛选考勤日志" />
      </template>
      <template #filter-operator_login_id>
        <input v-model="attendanceLogFilters.operatorStudentId" aria-label="按操作人筛选考勤日志" />
      </template>
      <template #filter-new_status>
        <select v-model="attendanceLogFilters.newStatus" aria-label="按新状态筛选考勤日志">
          <option value="">全部</option>
          <option value="0">签到</option>
          <option value="1">迟到</option>
          <option value="2">缺勤</option>
          <option value="3">请假</option>
        </select>
      </template>
      <template #filter-operation_type>
        <input v-model="attendanceLogFilters.operationType" aria-label="按操作类型筛选考勤日志" />
      </template>
      <template #cell-operated_at="{ value }">
        {{ typeof value === 'string' ? formatDateTime(value) : '-' }}
      </template>
      <template #cell-old_status="{ row, value }">
        {{ row.operation_type === 'create_record' || value === null || value === undefined ? '-' : statusName(Number(value)) }}
      </template>
      <template #cell-new_status="{ value }">
        {{ statusName(Number(value)) }}
      </template>
    </AdminDataList>
  </section>
</template>
