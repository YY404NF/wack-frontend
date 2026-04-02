<script setup lang="ts">
import type { CourseGroupItem } from '../../api'
import AdminDataList from './AdminDataList.vue'

const props = defineProps<{
  loading: boolean
  parentCourseSummary: Array<{ label: string; value: string }>
  visibleCourseGroups: CourseGroupItem[]
  courseGroups: CourseGroupItem[]
  selectedCourseGroupIds: number[]
  areAllCourseGroupsSelected: boolean
  courseGroupActionLoading: boolean
}>()

const emit = defineEmits<{
  toggleCourseGroupSelection: [groupId: number]
  toggleCourseGroupPageSelection: []
  openBulkDeleteCourseGroupModal: []
  createCourseGroup: []
  loadMoreCourseGroups: []
  openCourseGroupLessons: [group: CourseGroupItem]
  openCourseGroupStudents: [group: CourseGroupItem]
  openDeleteCourseGroupModal: [group: CourseGroupItem]
}>()

const groupColumns = [
  {
    key: 'class_names',
    label: '上课班级',
    width: 20,
    copyValue: (row: Record<string, unknown>) => Array.isArray(row.class_names) ? row.class_names.join('、') : '',
  },
  { key: 'student_count', label: '上课人数', width: 5 },
  { key: 'lesson_count', label: '课次', width: 4 },
] as const

function asCourseGroupItem(row: Record<string, unknown>) {
  return row as unknown as CourseGroupItem
}
</script>

<template>
  <div class="course-subpage-grid">
    <aside class="workspace-card course-context-card">
      <div class="settings-profile-summary-list">
        <div class="workspace-card nested-context-card">
          <div class="section-heading section-heading-compact">
            <strong>课程</strong>
          </div>
          <div class="settings-profile-summary-list">
            <div v-for="item in parentCourseSummary" :key="item.label" class="settings-profile-summary-item">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <section class="workspace-card course-subpage-main course-groups-main">
      <p v-if="loading" class="hint">正在加载课程组数据...</p>
      <AdminDataList
        v-else
        :rows="visibleCourseGroups as unknown as Array<Record<string, unknown>>"
        :columns="groupColumns as unknown as Array<{ key: string; label: string; width?: number }>"
        row-key="id"
        table-class="course-group-table"
        empty-text="当前课程还没有课程组"
        :show-selection="true"
        :selected-row-keys="selectedCourseGroupIds"
        :show-actions="true"
        :action-col-width="28"
        :selected-items="selectedCourseGroupIds.length"
        :current-items="visibleCourseGroups.length"
        :total-items="courseGroups.length"
        :all-items="courseGroups.length"
        :lazy-load="{ hasMore: visibleCourseGroups.length < courseGroups.length, loading: false, buttonText: '滚动到底部继续加载课程组' }"
        @toggle-row-selection="emit('toggleCourseGroupSelection', Number($event))"
        @load-more="emit('loadMoreCourseGroups')"
      >
        <template #filter-actions>
          <button class="ghost-button compact-button" :class="{ selected: areAllCourseGroupsSelected }" type="button" @click="emit('toggleCourseGroupPageSelection')">
            全选
          </button>
          <button class="ghost-button compact-button danger-button" type="button" :disabled="courseGroupActionLoading || selectedCourseGroupIds.length === 0" @click="emit('openBulkDeleteCourseGroupModal')">
            批量删除
          </button>
          <button class="primary-button compact-button filter-action-push" type="button" :disabled="courseGroupActionLoading" @click="emit('createCourseGroup')">
            创建课程组
          </button>
        </template>
        <template #cell-class_names="{ value }">
          {{ Array.isArray(value) && value.length > 0 ? value.join('、') : '未绑定班级' }}
        </template>
        <template #actions="{ row }">
          <div class="inline-actions user-actions">
            <button class="ghost-button compact-button" type="button" @click="emit('openCourseGroupLessons', asCourseGroupItem(row))">课次管理</button>
            <button class="ghost-button compact-button" type="button" @click="emit('openCourseGroupStudents', asCourseGroupItem(row))">上课学生管理</button>
            <button class="ghost-button compact-button danger-button" type="button" @click="emit('openDeleteCourseGroupModal', asCourseGroupItem(row))">删除</button>
          </div>
        </template>
      </AdminDataList>
    </section>
  </div>
</template>
