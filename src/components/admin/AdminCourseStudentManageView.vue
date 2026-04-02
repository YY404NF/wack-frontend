<script setup lang="ts">
import { ref, watch } from 'vue'

import type {
  AvailableCourseGroupClassItem,
  AvailableCourseGroupStudentItem,
  CourseGroupStudentItem,
} from '../../api'
import AppDigitInput from '../common/AppDigitInput.vue'
import AppInputSelect from '../common/AppInputSelect.vue'
import AdminDataList from './AdminDataList.vue'

type CourseGroupStudentClassEntry = {
  key: string
  kind: 'class'
  label: string
  classId: number | null
  items: CourseGroupStudentItem[]
}

type CourseGroupStudentStandaloneEntry = {
  key: string
  kind: 'student'
  student: CourseGroupStudentItem
}

type CourseGroupStudentEntry = CourseGroupStudentClassEntry | CourseGroupStudentStandaloneEntry

const props = defineProps<{
  activeCourseGroupId: number | null
  parentCourseSummary: Array<{ label: string; value: string }>
  activeCourseGroupSummary: Array<{ label: string; value: string }>
  courseGroupStudentEntries: CourseGroupStudentEntry[]
  courseGroupActionLoading: boolean
  courseGroupClassRows: AvailableCourseGroupClassItem[]
  courseGroupStudentRows: AvailableCourseGroupStudentItem[]
  courseGroupClassHasMore: boolean
  courseGroupStudentHasMore: boolean
  courseGroupClassLoading: boolean
  courseGroupStudentLoading: boolean
  courseGroupClassNameFilter: string
  courseGroupStudentNoFilter: string
  courseGroupStudentNameFilter: string
  courseGroupStudentClassNameFilter: string
  classNameOptions: string[]
}>()

const emit = defineEmits<{
  'update:courseGroupClassNameFilter': [value: string]
  'update:courseGroupStudentNoFilter': [value: string]
  'update:courseGroupStudentNameFilter': [value: string]
  'update:courseGroupStudentClassNameFilter': [value: string]
  loadMoreCourseGroupClasses: []
  loadMoreCourseGroupStudents: []
  addCourseGroupClass: [classId: number]
  addCourseGroupStudent: [studentId: number]
  openRemoveCourseGroupClassModal: [payload: { classId: number; className: string }]
  openRemoveCourseGroupStudentModal: [payload: { studentId: number; studentName: string }]
}>()

const candidateClassColumns = [
  { key: 'class_name', label: '班级名称', width: 8 },
  { key: 'student_count', label: '人数', width: 4 },
] as const

const candidateStudentColumns = [
  { key: 'student_no', label: '学号', width: 10 },
  { key: 'student_name', label: '姓名', width: 8 },
  { key: 'class_name', label: '所属班级', width: 9 },
] as const

const expandedCourseGroupClassKeys = ref<string[]>([])

watch(
  () => props.activeCourseGroupId,
  () => {
    expandedCourseGroupClassKeys.value = []
  },
)

function isCourseGroupClassExpanded(key: string) {
  return expandedCourseGroupClassKeys.value.includes(key)
}

function toggleCourseGroupClassExpanded(key: string) {
  if (expandedCourseGroupClassKeys.value.includes(key)) {
    expandedCourseGroupClassKeys.value = expandedCourseGroupClassKeys.value.filter((item) => item !== key)
    return
  }
  expandedCourseGroupClassKeys.value = [...expandedCourseGroupClassKeys.value, key]
}
</script>

<template>
  <div class="course-student-manage-layout">
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

    <section class="course-student-main-column">
      <section class="workspace-card course-group-current-students-card">
        <div class="course-group-student-groups">
          <article
            v-for="entry in courseGroupStudentEntries"
            :key="entry.key"
            class="course-group-student-block"
            :class="{ 'course-group-student-block-expanded': entry.kind === 'class' && isCourseGroupClassExpanded(entry.key) }"
          >
            <template v-if="entry.kind === 'class'">
              <div class="course-group-student-block-header">
                <button class="course-group-student-summary" type="button" @click="toggleCourseGroupClassExpanded(entry.key)">
                  <span class="course-group-student-caret" :class="{ 'course-group-student-caret-expanded': isCourseGroupClassExpanded(entry.key) }" aria-hidden="true">▸</span>
                  <div class="course-group-student-block-title">
                    <strong>{{ entry.label }}</strong>
                    <span class="pill">{{ entry.items.length }} 人</span>
                    <span class="hint">{{ isCourseGroupClassExpanded(entry.key) ? '收起学生' : '展开学生' }}</span>
                  </div>
                </button>
                <button
                  v-if="entry.classId"
                  class="ghost-button compact-button danger-button"
                  type="button"
                  :disabled="courseGroupActionLoading"
                  @click="emit('openRemoveCourseGroupClassModal', { classId: entry.classId, className: entry.label })"
                >
                  移除班级
                </button>
              </div>
              <div v-if="isCourseGroupClassExpanded(entry.key)" class="course-group-student-list">
                <div v-for="student in entry.items" :key="student.id" class="course-group-student-row">
                  <div class="course-group-student-row-main">
                    <span class="course-student-member-id">{{ student.student_no }}</span>
                    <span class="course-student-member-name">{{ student.student_name }}</span>
                  </div>
                  <button
                    class="ghost-button compact-button danger-button"
                    type="button"
                    :disabled="courseGroupActionLoading"
                    @click="emit('openRemoveCourseGroupStudentModal', { studentId: student.student_id, studentName: student.student_name })"
                  >
                    移除
                  </button>
                </div>
              </div>
            </template>

            <template v-else>
              <div class="course-group-student-row course-group-student-row-standalone">
                <div class="course-group-student-row-main">
                  <div class="course-group-student-standalone-meta">
                    <span class="course-student-member-name">{{ entry.student.student_name }}</span>
                    <span class="course-student-member-id">{{ entry.student.student_no }}</span>
                  </div>
                  <span class="pill">其他学生</span>
                </div>
                <button
                  class="ghost-button compact-button danger-button"
                  type="button"
                  :disabled="courseGroupActionLoading"
                  @click="emit('openRemoveCourseGroupStudentModal', { studentId: entry.student.student_id, studentName: entry.student.student_name })"
                >
                  移除
                </button>
              </div>
            </template>
          </article>
          <p v-if="courseGroupStudentEntries.length === 0" class="hint">当前课程组还没有上课学生。</p>
        </div>
      </section>

      <section class="workspace-card course-group-candidates-card">
        <div class="course-group-editor-grid">
          <section class="course-group-editor-block">
            <AdminDataList
              :rows="courseGroupClassRows as unknown as Array<Record<string, unknown>>"
              :columns="candidateClassColumns as unknown as Array<{ key: string; label: string; width?: number }>"
              row-key="id"
              table-class="course-group-candidate-table"
              empty-text="没有可添加的班级"
              :show-actions="true"
              :action-col-width="20"
              :lazy-load="{ hasMore: courseGroupClassHasMore, loading: courseGroupClassLoading, buttonText: '滚动到底部继续加载班级' }"
              :active-filter-keys="courseGroupClassNameFilter.trim() ? ['class_name'] : []"
              :has-search-condition="!!courseGroupClassNameFilter.trim()"
              @load-more="emit('loadMoreCourseGroupClasses')"
            >
              <template #filter-class_name>
                <AppInputSelect
                  :model-value="courseGroupClassNameFilter"
                  :options="classNameOptions"
                  aria-label="按班级名称筛选可添加班级"
                  @update:model-value="emit('update:courseGroupClassNameFilter', $event)"
                />
              </template>
              <template #actions="{ row }">
                <div class="inline-actions user-actions">
                  <button class="ghost-button compact-button" type="button" :disabled="courseGroupActionLoading" @click="emit('addCourseGroupClass', Number(row.id))">添加</button>
                </div>
              </template>
            </AdminDataList>
          </section>

          <section class="course-group-editor-block">
            <AdminDataList
              :rows="courseGroupStudentRows as unknown as Array<Record<string, unknown>>"
              :columns="candidateStudentColumns as unknown as Array<{ key: string; label: string; width?: number }>"
              row-key="id"
              table-class="course-group-candidate-table"
              empty-text="没有可添加的学生"
              :show-actions="true"
              :action-col-width="20"
              :lazy-load="{ hasMore: courseGroupStudentHasMore, loading: courseGroupStudentLoading, buttonText: '滚动到底部继续加载学生' }"
              :active-filter-keys="[
                ...(courseGroupStudentNoFilter.trim() ? ['student_no'] : []),
                ...(courseGroupStudentNameFilter.trim() ? ['student_name'] : []),
                ...(courseGroupStudentClassNameFilter.trim() ? ['class_name'] : []),
              ]"
              :has-search-condition="!!(courseGroupStudentNoFilter.trim() || courseGroupStudentNameFilter.trim() || courseGroupStudentClassNameFilter.trim())"
              @load-more="emit('loadMoreCourseGroupStudents')"
            >
              <template #filter-student_no>
                <AppDigitInput
                  :model-value="courseGroupStudentNoFilter"
                  aria-label="按学号筛选可添加学生"
                  @update:model-value="emit('update:courseGroupStudentNoFilter', $event)"
                />
              </template>
              <template #filter-student_name>
                <input
                  :value="courseGroupStudentNameFilter"
                  aria-label="按姓名筛选可添加学生"
                  @input="emit('update:courseGroupStudentNameFilter', String(($event.target as HTMLInputElement).value))"
                />
              </template>
              <template #filter-class_name>
                <AppInputSelect
                  :model-value="courseGroupStudentClassNameFilter"
                  :options="classNameOptions"
                  aria-label="按所属班级筛选可添加学生"
                  @update:model-value="emit('update:courseGroupStudentClassNameFilter', $event)"
                />
              </template>
              <template #actions="{ row }">
                <div class="inline-actions user-actions">
                  <button class="ghost-button compact-button" type="button" :disabled="courseGroupActionLoading" @click="emit('addCourseGroupStudent', Number(row.id))">添加</button>
                </div>
              </template>
            </AdminDataList>
          </section>
        </div>
      </section>
    </section>
  </div>
</template>
