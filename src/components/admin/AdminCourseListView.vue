<script setup lang="ts">
import { computed, watch } from 'vue'

import type { ClassItem, CourseItem, MetaTermItem } from '../../api'
import AppDigitInput from '../common/AppDigitInput.vue'
import AppInputSelect from '../common/AppInputSelect.vue'
import AdminDataList from './AdminDataList.vue'
import { selectDefaultTermName, sortTermsForSelect } from '../../utils/terms'
import { getCurrentAcademicTerm } from '../../utils/free-time'

const props = defineProps<{
  courses: CourseItem[]
  allClasses: ClassItem[]
  courseTerms: MetaTermItem[]
  courseFilters: {
    term: string
    grade: string
    courseName: string
    teacherName: string
    className: string
  }
  selectedCourseIds: number[]
  courseDeleting: boolean
  courseLoading: boolean
  coursePage: number
  coursePageSize: number
  courseTotalPages: number
  courseTotalItems: number
  courseAllItems: number
  coursePageOptions: number[]
  courseFocusRowKey?: number | null
  courseFocusToken?: number
}>()

const emit = defineEmits<{
  openCreateCourseModal: []
  openEditCourseModal: [item: CourseItem]
  openDeleteCourseModal: [item: CourseItem]
  openCourseGroupsManager: [item: CourseItem]
  openBulkDeleteCourseModal: []
  updateCoursePage: [page: number]
  updateCoursePageSize: [size: number]
  toggleCourseSelection: [courseId: number]
  toggleCoursePageSelection: []
}>()

const currentTerm = getCurrentAcademicTerm()
const selectedCourseIdSet = computed(() => new Set(props.selectedCourseIds))
const areAllCoursesSelected = computed(() => props.courses.length > 0 && props.courses.every((item) => selectedCourseIdSet.value.has(item.id)))
const classNameOptions = computed(() =>
  Array.from(new Set(props.allClasses.map((item) => item.class_name.trim()).filter((item) => item.length > 0))).sort((left, right) =>
    left.localeCompare(right, 'zh-Hans-CN'),
  ),
)
const termOptions = computed(() => {
  if (props.courseTerms.length > 0) {
    return sortTermsForSelect(props.courseTerms).map((item) => item.name)
  }
  const terms = new Set<string>([currentTerm])
  for (const item of props.courses) {
    if (item.term) {
      terms.add(item.term)
    }
  }
  return Array.from(terms).sort((left, right) => right.localeCompare(left, 'zh-Hans-CN'))
})

const courseColumns = [
  { key: 'grade', label: '年级', width: 3 },
  { key: 'course_name', label: '课程名称', width: 8 },
  { key: 'teacher_name', label: '教师', width: 3 },
  { key: 'class_names', label: '上课班级', width: 8, copyValue: (row: Record<string, unknown>) => Array.isArray(row.class_names) ? row.class_names.join('、') : '' },
  { key: 'student_count', label: '上课人数', width: 4 },
] as const

watch(
  termOptions,
  (terms) => {
    if (!props.courseFilters.term || !terms.includes(props.courseFilters.term)) {
      props.courseFilters.term = selectDefaultTermName(props.courseTerms) || terms[0] || ''
    }
  },
  { immediate: true },
)

function asCourseItem(row: Record<string, unknown>) {
  return row as unknown as CourseItem
}
</script>

<template>
  <div class="course-manage-page">
    <AdminDataList
      :rows="courses as unknown as Array<Record<string, unknown>>"
      :columns="courseColumns as unknown as Array<{ key: string; label: string; width?: number }>"
      row-key="id"
      table-class="course-manage-table"
      empty-text="暂无符合条件的课程"
      :show-selection="true"
      :selected-row-keys="selectedCourseIds"
      :show-actions="true"
      :action-col-width="24"
      :pagination="{ page: coursePage, pageSize: coursePageSize, totalPages: courseTotalPages, pageOptions: coursePageOptions, totalItems: courseTotalItems }"
      :all-items="courseAllItems"
      :selected-items="selectedCourseIds.length"
      :highlight-row-key="courseFocusRowKey ?? null"
      :highlight-token="courseFocusToken ?? 0"
      :active-filter-keys="[
        ...(String(courseFilters.grade ?? '').trim() ? ['grade'] : []),
        ...(courseFilters.courseName.trim() ? ['course_name'] : []),
        ...(courseFilters.teacherName.trim() ? ['teacher_name'] : []),
        ...(courseFilters.className.trim() ? ['class_names'] : []),
      ]"
      :has-search-condition="!!(String(courseFilters.grade ?? '').trim() || courseFilters.courseName.trim() || courseFilters.teacherName.trim() || courseFilters.className.trim() || (courseFilters.term && courseFilters.term !== termOptions[0]))"
      @update-page="emit('updateCoursePage', $event)"
      @update-page-size="emit('updateCoursePageSize', $event)"
      @toggle-row-selection="emit('toggleCourseSelection', Number($event))"
    >
      <template #filter-grade>
        <AppDigitInput v-model="courseFilters.grade" aria-label="按年级筛选课程" />
      </template>
      <template #filter-course_name>
        <input v-model="courseFilters.courseName" aria-label="按课程名称筛选课程" />
      </template>
      <template #filter-teacher_name>
        <input v-model="courseFilters.teacherName" aria-label="按授课教师筛选课程" />
      </template>
      <template #filter-class_names>
        <AppInputSelect
          v-model="courseFilters.className"
          :options="classNameOptions"
          aria-label="按班级筛选课程"
        />
      </template>
      <template #filter-actions>
        <button class="ghost-button compact-button" :class="{ selected: areAllCoursesSelected }" type="button" @click="emit('toggleCoursePageSelection')">
          全选
        </button>
        <button class="ghost-button compact-button danger-button" type="button" :disabled="courseDeleting || selectedCourseIds.length === 0" @click="emit('openBulkDeleteCourseModal')">
          批量删除
        </button>
        <button class="primary-button compact-button filter-action-push" type="button" @click="emit('openCreateCourseModal')">
          创建课程
        </button>
      </template>
      <template #footer-trailing>
        <label class="course-manage-term-filter">
          <span class="visually-hidden">学期</span>
          <select v-model="courseFilters.term" aria-label="按学期筛选课程">
            <option v-for="term in termOptions" :key="term" :value="term">{{ term }}</option>
          </select>
        </label>
      </template>
      <template #cell-class_names="{ value }">
        {{ Array.isArray(value) ? value.join('、') : '' }}
      </template>
      <template #actions="{ row }">
        <div class="inline-actions user-actions">
          <button class="ghost-button compact-button" type="button" :disabled="courseLoading || !row" @click="emit('openEditCourseModal', asCourseItem(row))">编辑</button>
          <button class="ghost-button compact-button" type="button" :disabled="courseLoading || !row" @click="emit('openCourseGroupsManager', asCourseItem(row))">课程组管理</button>
          <button class="ghost-button compact-button danger-button" type="button" :disabled="!row" @click="emit('openDeleteCourseModal', asCourseItem(row))">删除</button>
        </div>
      </template>
    </AdminDataList>
  </div>
</template>
