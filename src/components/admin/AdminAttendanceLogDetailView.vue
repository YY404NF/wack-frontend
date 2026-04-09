<script setup lang="ts">
import { attendanceStatusBadgeClass } from '../../constants'
import type { AdminAttendanceLogFilters } from './form-types'
import type { AdminAttendanceLogDetailContext } from './shared-types'
import AdminDataList from './AdminDataList.vue'

const props = defineProps<{
  attendanceLogs: Array<Record<string, unknown>>
  attendanceLogFilters: AdminAttendanceLogFilters
  attendanceLogDetailContext: AdminAttendanceLogDetailContext | null
  attendanceLogsLoading: boolean
  attendanceLogsHasMore: boolean
  attendanceLogsAllItems: number
  statusName: (status: number) => string
}>()

const emit = defineEmits<{
  loadMoreAttendanceLogs: []
}>()

const attendanceLogDetailColumns = [
  { key: 'old_status', label: '原状态', width: 10, copyValue: (row: Record<string, unknown>) => formatStatus(row.old_status, '未查') },
  { key: 'new_status', label: '新状态', width: 10, copyValue: (row: Record<string, unknown>) => formatStatus(row.new_status) },
  { key: 'operator_name', label: '操作用户', width: 12 },
  { key: 'operated_at', label: '操作时间', width: 18, copyValue: (row: Record<string, unknown>) => typeof row.operated_at === 'string' ? formatDateTime(row.operated_at) : '-' },
] as const

const statusOptions = [
  { value: '0', label: '签到' },
  { value: '1', label: '迟到' },
  { value: '2', label: '缺勤' },
  { value: '3', label: '请假' },
] as const

function formatDateTime(value: string) {
  return value.replace('T', ' ').slice(0, 19)
}

function formatStatus(value: unknown, emptyLabel = '-') {
  if (value === null || value === undefined || value === '') {
    return emptyLabel
  }
  return props.statusName(Number(value))
}
</script>

<template>
  <div class="attendance-detail-view">
    <div class="course-subpage-grid">
      <aside class="workspace-card course-context-card">
        <div class="settings-profile-summary-list">
          <div class="workspace-card nested-context-card">
            <div class="section-heading section-heading-compact">
              <strong>学生</strong>
            </div>
            <div class="settings-profile-summary-list">
              <div class="settings-profile-summary-item">
                <span>学号</span>
                <strong>{{ attendanceLogDetailContext?.studentId || '-' }}</strong>
              </div>
              <div class="settings-profile-summary-item">
                <span>姓名</span>
                <strong>{{ attendanceLogDetailContext?.realName || '-' }}</strong>
              </div>
              <div class="settings-profile-summary-item">
                <span>所属班级</span>
                <strong>{{ attendanceLogDetailContext?.className || '-' }}</strong>
              </div>
            </div>
          </div>

          <div class="workspace-card nested-context-card">
            <div class="section-heading section-heading-compact">
              <strong>课次</strong>
            </div>
            <div class="settings-profile-summary-list">
              <div class="settings-profile-summary-item">
                <span>日期</span>
                <strong>{{ attendanceLogDetailContext?.lessonDate || '-' }}</strong>
              </div>
              <div class="settings-profile-summary-item">
                <span>时间</span>
                <strong>{{ attendanceLogDetailContext?.timeLabel || '-' }}</strong>
              </div>
              <div class="settings-profile-summary-item">
                <span>地点</span>
                <strong>{{ attendanceLogDetailContext?.location || '-' }}</strong>
              </div>
            </div>
          </div>

          <div class="workspace-card nested-context-card">
            <div class="section-heading section-heading-compact">
              <strong>课程组</strong>
            </div>
            <div class="settings-profile-summary-list">
              <div class="settings-profile-summary-item">
                <span>上课班级</span>
                <strong>{{ attendanceLogDetailContext?.classSummary || '-' }}</strong>
              </div>
              <div class="settings-profile-summary-item">
                <span>上课人数</span>
                <strong>{{ attendanceLogDetailContext?.studentCount ?? 0 }}</strong>
              </div>
            </div>
          </div>

          <div class="workspace-card nested-context-card">
            <div class="section-heading section-heading-compact">
              <strong>课程</strong>
            </div>
            <div class="settings-profile-summary-list">
              <div class="settings-profile-summary-item">
                <span>课程名称</span>
                <strong>{{ attendanceLogDetailContext?.courseName || '-' }}</strong>
              </div>
              <div class="settings-profile-summary-item">
                <span>教师</span>
                <strong>{{ attendanceLogDetailContext?.teacherName || '-' }}</strong>
              </div>
              <div class="settings-profile-summary-item">
                <span>年级</span>
                <strong>{{ attendanceLogDetailContext?.grade ?? '-' }}</strong>
              </div>
              <div class="settings-profile-summary-item">
                <span>学期</span>
                <strong>{{ attendanceLogDetailContext?.term || '-' }}</strong>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <section class="workspace-card course-subpage-main">
        <AdminDataList
          :rows="attendanceLogs"
          :columns="attendanceLogDetailColumns as unknown as Array<{ key: string; label: string; width?: number }>"
          row-key="id"
          empty-text="暂无考勤变更记录"
          :lazy-load="{ hasMore: attendanceLogsHasMore, loading: attendanceLogsLoading }"
          :all-items="attendanceLogsAllItems"
          :active-filter-keys="[
            ...(attendanceLogFilters.oldStatus ? ['old_status'] : []),
            ...(attendanceLogFilters.newStatus ? ['new_status'] : []),
            ...(attendanceLogFilters.operatorName.trim() ? ['operator_name'] : []),
            ...(attendanceLogFilters.operatedDate ? ['operated_at'] : []),
          ]"
          :has-search-condition="!!(attendanceLogFilters.oldStatus || attendanceLogFilters.newStatus || attendanceLogFilters.operatorName.trim() || attendanceLogFilters.operatedDate)"
          @load-more="emit('loadMoreAttendanceLogs')"
        >
          <template #filter-old_status>
            <select v-model="attendanceLogFilters.oldStatus" aria-label="按原状态筛选考勤变更记录">
              <option value="">全部</option>
              <option value="none">未查</option>
              <option v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </template>
          <template #filter-new_status>
            <select v-model="attendanceLogFilters.newStatus" aria-label="按新状态筛选考勤变更记录">
              <option value="">全部</option>
              <option v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </template>
          <template #filter-operator_name>
            <input v-model="attendanceLogFilters.operatorName" aria-label="按操作用户筛选考勤变更记录" />
          </template>
          <template #filter-operated_at>
            <input v-model="attendanceLogFilters.operatedDate" type="date" aria-label="按操作时间筛选考勤变更记录" />
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
          <template #empty>
            <template v-if="attendanceLogsLoading">加载中...</template>
            <template v-else>暂无考勤变更记录</template>
          </template>
        </AdminDataList>
      </section>
    </div>
  </div>
</template>
