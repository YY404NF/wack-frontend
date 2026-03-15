<script setup lang="ts">
import type { StatusCode } from '../../constants'
import type { AdminAttendanceProps } from './types'

defineProps<AdminAttendanceProps>()

const emit = defineEmits<{
  updateAdminStatus: [detailId: number, status: StatusCode]
}>()

function onStatusChange(event: Event, detailId: number) {
  const target = event.target as HTMLSelectElement
  emit('updateAdminStatus', detailId, Number(target.value) as StatusCode)
}
</script>

<template>
  <section class="workspace-card">
    <div class="section-heading">
      <h2>查课详情</h2>
      <span class="pill">{{ attendanceResults.length }} 条结果</span>
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>课程</th>
            <th>教师</th>
            <th>学生</th>
            <th>周次</th>
            <th>状态</th>
            <th>修改</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in attendanceResults" :key="row.attendance_detail_id">
            <td>{{ row.course_name }}</td>
            <td>{{ row.teacher_name }}</td>
            <td>{{ row.student_id }}</td>
            <td>第 {{ row.week_no }} 周 / 第 {{ row.session_no }} 次</td>
            <td><span class="status-badge" :class="statusClass(row.status)">{{ statusName(row.status) }}</span></td>
            <td>
              <select class="mini-select" :value="row.status" @change="onStatusChange($event, row.attendance_detail_id)">
                <option :value="0">未设置</option>
                <option :value="1">签到</option>
                <option :value="2">迟到</option>
                <option :value="3">缺勤</option>
                <option :value="4">请假</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
