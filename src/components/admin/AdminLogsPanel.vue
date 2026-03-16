<script setup lang="ts">
import type { AdminLogsProps } from './types'

defineProps<AdminLogsProps>()

const emit = defineEmits<{
  updateLogsPage: [page: number]
  updateLogsPageSize: [size: number]
}>()

function onPageSizeChange(event: Event) {
  emit('updateLogsPageSize', Number((event.target as HTMLSelectElement).value))
}

function formatDateTime(value: string) {
  return value.replace('T', ' ').slice(0, 19)
}
</script>

<template>
  <section class="workspace-card user-manage-panel">
    <div class="section-heading">
      <h2>系统日志</h2>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>操作人</th>
            <th>目标表</th>
            <th>目标 ID</th>
            <th>操作类型</th>
            <th>新值</th>
          </tr>
          <tr class="table-filter-row">
            <th class="table-filter-cell">
              <input v-model="logFilters.createdDate" type="date" aria-label="按日期筛选系统日志" />
            </th>
            <th class="table-filter-cell">
              <input v-model="logFilters.operatorStudentId" aria-label="按操作人筛选系统日志" />
            </th>
            <th class="table-filter-cell">
              <input v-model="logFilters.targetTable" aria-label="按目标表筛选系统日志" />
            </th>
            <th class="table-filter-cell">
              <input v-model="logFilters.targetId" inputmode="numeric" aria-label="按目标 ID 筛选系统日志" />
            </th>
            <th class="table-filter-cell">
              <input v-model="logFilters.actionType" aria-label="按操作类型筛选系统日志" />
            </th>
            <th class="table-filter-cell">
              <input v-model="logFilters.keyword" aria-label="按新值关键词筛选系统日志" />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in logs" :key="item.id">
            <td>{{ formatDateTime(item.created_at) }}</td>
            <td>{{ item.operator_student_id }}</td>
            <td>{{ item.target_table }}</td>
            <td>{{ item.target_id }}</td>
            <td>{{ item.action_type }}</td>
            <td>{{ item.new_value || '-' }}</td>
          </tr>
          <tr v-if="logs.length === 0">
            <td colspan="6" class="empty-cell">暂无系统日志</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination-bar">
      <div class="pagination-pages">
        <button
          v-for="page in logsTotalPages"
          :key="page"
          class="ghost-button compact-button pagination-button"
          :class="{ selected: logsPage === page }"
          type="button"
          @click="emit('updateLogsPage', page)"
        >
          {{ page }}
        </button>
      </div>
      <div class="pagination-size">
        <select :value="logsPageSize" @change="onPageSizeChange">
          <option v-for="size in logsPageOptions" :key="size" :value="size">{{ size }}</option>
        </select>
      </div>
    </div>
  </section>
</template>
