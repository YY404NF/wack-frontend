<script setup lang="ts">
import type { AdminAttendanceLogsProps } from './types'

defineProps<AdminAttendanceLogsProps>()

const emit = defineEmits<{
  updateAttendanceLogsPage: [page: number]
  updateAttendanceLogsPageSize: [size: number]
}>()

function onPageSizeChange(event: Event) {
  emit('updateAttendanceLogsPageSize', Number((event.target as HTMLSelectElement).value))
}

function formatDateTime(value: string) {
  return value.replace('T', ' ').slice(0, 19)
}
</script>

<template>
  <section class="workspace-card user-manage-panel">
    <div class="section-heading">
      <h2>查课日志</h2>
    </div>

    <div class="table-filters log-filters">
      <label class="field">
        <span>学生学号</span>
        <input v-model="attendanceLogFilters.studentId" />
      </label>
      <label class="field">
        <span>操作人</span>
        <input v-model="attendanceLogFilters.operatorStudentId" />
      </label>
      <label class="field">
        <span>操作类型</span>
        <input v-model="attendanceLogFilters.operationType" />
      </label>
      <label class="field">
        <span>新状态</span>
        <select v-model="attendanceLogFilters.newStatus">
          <option value="">全部</option>
          <option value="0">未设置</option>
          <option value="1">签到</option>
          <option value="2">迟到</option>
          <option value="3">缺勤</option>
          <option value="4">请假</option>
        </select>
      </label>
      <label class="field">
        <span>日期</span>
        <input v-model="attendanceLogFilters.operatedDate" type="date" />
      </label>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>操作时间</th>
            <th>学生</th>
            <th>操作人</th>
            <th>查课明细 ID</th>
            <th>原状态</th>
            <th>新状态</th>
            <th>操作类型</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in attendanceLogs" :key="item.id">
            <td>{{ formatDateTime(item.operated_at) }}</td>
            <td>{{ item.student_id }}</td>
            <td>{{ item.operator_student_id }}</td>
            <td>{{ item.attendance_detail_id }}</td>
            <td>{{ item.old_status === null || item.old_status === undefined ? '-' : statusName(item.old_status) }}</td>
            <td>{{ statusName(item.new_status) }}</td>
            <td>{{ item.operation_type }}</td>
          </tr>
          <tr v-if="attendanceLogs.length === 0">
            <td colspan="7" class="empty-cell">暂无查课日志</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination-bar">
      <div class="pagination-pages">
        <button
          v-for="page in attendanceLogsTotalPages"
          :key="page"
          class="ghost-button compact-button pagination-button"
          :class="{ selected: attendanceLogsPage === page }"
          type="button"
          @click="emit('updateAttendanceLogsPage', page)"
        >
          {{ page }}
        </button>
      </div>
      <div class="pagination-size">
        <select :value="attendanceLogsPageSize" @change="onPageSizeChange">
          <option v-for="size in attendanceLogsPageOptions" :key="size" :value="size">{{ size }}</option>
        </select>
      </div>
    </div>
  </section>
</template>
