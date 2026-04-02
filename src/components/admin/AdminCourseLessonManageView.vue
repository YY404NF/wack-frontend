<script setup lang="ts">
import type { CourseGroupLessonItem } from '../../api'
import { sectionLabels, weekdayLabels } from '../../constants'
import AppDigitInput from '../common/AppDigitInput.vue'
import AdminDataList from './AdminDataList.vue'

type CourseGroupLessonRow = CourseGroupLessonItem & {
  session_no: number
  location: string
}

const props = defineProps<{
  parentCourseSummary: Array<{ label: string; value: string }>
  activeCourseGroupSummary: Array<{ label: string; value: string }>
  loading: boolean
  visibleCourseGroupLessons: CourseGroupLessonRow[]
  filteredCourseGroupLessons: CourseGroupLessonRow[]
  courseGroupLessonRows: CourseGroupLessonRow[]
  selectedLessonIds: number[]
  areAllVisibleLessonsSelected: boolean
  courseGroupActionLoading: boolean
  lessonSessionNoFilter: string
  lessonWeekFilter: string
  lessonWeekdayFilter: string
  lessonSectionFilter: string
  lessonLocationFilter: string
}>()

const emit = defineEmits<{
  'update:lessonSessionNoFilter': [value: string]
  'update:lessonWeekFilter': [value: string]
  'update:lessonWeekdayFilter': [value: string]
  'update:lessonSectionFilter': [value: string]
  'update:lessonLocationFilter': [value: string]
  toggleLessonSelection: [lessonId: number]
  toggleLessonPageSelection: []
  loadMoreCourseGroupLessons: []
  openBulkDeleteLessonModal: []
  openCreateSessionModal: []
  openCourseGroupLessonAttendanceDetail: [lesson: CourseGroupLessonItem]
  openEditSessionModal: [lesson: CourseGroupLessonItem]
  deleteCourseGroupSession: [lesson: CourseGroupLessonItem]
}>()

const lessonColumns = [
  { key: 'session_no', label: '课次', width: 6, copyable: false },
  { key: 'week_no', label: '上课周', width: 8, copyable: false },
  { key: 'weekday', label: '星期', width: 6, copyable: false },
  { key: 'section', label: '时间节', width: 10, copyable: false },
  { key: 'location', label: '地点', width: 9, copyable: true, copyValue: (row: Record<string, unknown>) => String(row.location ?? '') },
] as const
</script>

<template>
  <div class="course-subpage-grid">
    <aside class="workspace-card course-context-card">
      <div class="settings-profile-summary-list">
        <div class="workspace-card nested-context-card">
          <div class="section-heading section-heading-compact">
            <strong>课程组</strong>
          </div>
          <div class="settings-profile-summary-list">
            <div v-for="item in activeCourseGroupSummary" :key="item.label" class="settings-profile-summary-item">
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
            <div v-for="item in parentCourseSummary" :key="item.label" class="settings-profile-summary-item">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <section class="workspace-card course-subpage-main course-lessons-main">
      <div class="course-lesson-list-card">
        <p v-if="loading" class="hint">正在加载课次数据...</p>
        <AdminDataList
          v-else
          :rows="visibleCourseGroupLessons as unknown as Array<Record<string, unknown>>"
          :columns="lessonColumns as unknown as Array<{ key: string; label: string; width?: number }>"
          row-key="id"
          table-class="course-group-table"
          empty-text="当前课程组还没有课次"
          :show-selection="true"
          :selected-row-keys="selectedLessonIds"
          :show-actions="true"
          :action-col-width="30"
          :selected-items="selectedLessonIds.length"
          :lazy-load="{ hasMore: visibleCourseGroupLessons.length < filteredCourseGroupLessons.length, loading: false, buttonText: '滚动到底部继续加载课次' }"
          :current-items="visibleCourseGroupLessons.length"
          :total-items="filteredCourseGroupLessons.length"
          :all-items="courseGroupLessonRows.length"
          :active-filter-keys="[
            ...(lessonSessionNoFilter ? ['session_no'] : []),
            ...(lessonWeekFilter ? ['week_no'] : []),
            ...(lessonWeekdayFilter ? ['weekday'] : []),
            ...(lessonSectionFilter ? ['section'] : []),
            ...(lessonLocationFilter.trim() ? ['location'] : []),
          ]"
          :has-search-condition="!!(lessonSessionNoFilter || lessonWeekFilter || lessonWeekdayFilter || lessonSectionFilter || lessonLocationFilter.trim())"
          @toggle-row-selection="emit('toggleLessonSelection', Number($event))"
          @toggle-page-selection="emit('toggleLessonPageSelection')"
          @load-more="emit('loadMoreCourseGroupLessons')"
        >
          <template #filter-session_no>
            <AppDigitInput
              :model-value="lessonSessionNoFilter"
              aria-label="按课次筛选课次列表"
              @update:model-value="emit('update:lessonSessionNoFilter', $event)"
            />
          </template>
          <template #filter-week_no>
            <AppDigitInput
              :model-value="lessonWeekFilter"
              aria-label="按上课周筛选课次"
              @update:model-value="emit('update:lessonWeekFilter', $event)"
            />
          </template>
          <template #filter-weekday>
            <select :value="lessonWeekdayFilter" aria-label="按星期筛选课次" @change="emit('update:lessonWeekdayFilter', String(($event.target as HTMLSelectElement).value))">
              <option value="">全部</option>
              <option v-for="day in Object.entries(weekdayLabels)" :key="day[0]" :value="day[0]">{{ day[1] }}</option>
            </select>
          </template>
          <template #filter-section>
            <select :value="lessonSectionFilter" aria-label="按时间节筛选课次" @change="emit('update:lessonSectionFilter', String(($event.target as HTMLSelectElement).value))">
              <option value="">全部</option>
              <option v-for="slot in Object.entries(sectionLabels)" :key="slot[0]" :value="slot[0]">{{ slot[1] }}</option>
            </select>
          </template>
          <template #filter-location>
            <input :value="lessonLocationFilter" aria-label="按地点筛选课次" @input="emit('update:lessonLocationFilter', String(($event.target as HTMLInputElement).value))" />
          </template>
          <template #filter-actions>
            <button class="ghost-button compact-button" :class="{ selected: areAllVisibleLessonsSelected }" type="button" @click="emit('toggleLessonPageSelection')">
              全选
            </button>
            <button class="ghost-button compact-button danger-button" type="button" :disabled="courseGroupActionLoading || selectedLessonIds.length === 0" @click="emit('openBulkDeleteLessonModal')">
              批量删除
            </button>
            <button class="primary-button compact-button filter-action-push" type="button" :disabled="courseGroupActionLoading" @click="emit('openCreateSessionModal')">
              创建课次
            </button>
          </template>
          <template #cell-week_no="{ value }">第 {{ value }} 周</template>
          <template #cell-weekday="{ value }">{{ weekdayLabels[Number(value)] }}</template>
          <template #cell-section="{ value }">{{ sectionLabels[Number(value)] }}</template>
          <template #actions="{ row }">
            <div class="inline-actions user-actions">
              <button class="ghost-button compact-button" type="button" @click="emit('openCourseGroupLessonAttendanceDetail', row as unknown as CourseGroupLessonItem)">考勤明细</button>
              <button class="ghost-button compact-button" type="button" @click="emit('openEditSessionModal', row as unknown as CourseGroupLessonItem)">编辑</button>
              <button class="ghost-button compact-button danger-button" type="button" @click="emit('deleteCourseGroupSession', row as unknown as CourseGroupLessonItem)">删除</button>
            </div>
          </template>
        </AdminDataList>
      </div>
    </section>
  </div>
</template>
