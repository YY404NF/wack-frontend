<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { sectionLabels, weekdayLabels } from '../../constants'
import type { CourseItem } from '../../api'
import { getCurrentAcademicTerm } from '../../utils/free-time'
import type { AdminCourseManageProps } from './types'

const props = defineProps<AdminCourseManageProps>()

const emit = defineEmits<{
  openCreateCourseModal: []
  openEditCourseModal: [item: CourseItem]
  openCourseStudentModal: [item: CourseItem]
  closeCourseModal: []
  closeCourseStudentModal: []
  openDeleteCourseModal: [item: CourseItem]
  closeDeleteCourseModal: []
  openBulkDeleteCourseModal: []
  closeBulkDeleteCourseModal: []
  saveCourse: []
  importCourses: [files: File[]]
  addCourseStudentClass: [classId: number]
  removeCourseStudentClass: [classId: number]
  toggleCourseStudentClassSelection: [classId: number]
  toggleCourseStudentSelection: [studentId: string]
  addCourseStudent: [studentId: string]
  removeCourseStudent: [studentId: string]
  saveCourseStudents: []
  deleteCourse: []
  setCourseWeekSelected: [payload: { weekNo: number; selected: boolean }]
  addCourseSessions: []
  editCourseSession: [sessionNo: number]
  removeCourseSession: [sessionNo: number]
  updateCoursePage: [page: number]
  updateCoursePageSize: [size: number]
  toggleCourseSelection: [courseId: number]
  toggleCoursePageSelection: []
  bulkDeleteCourses: []
}>()

const importInputRef = ref<HTMLInputElement | null>(null)
const weekRows = [
  [1, 2, 3, 4, 5, 6, 7, 8],
  [9, 10, 11, 12, 13, 14, 15, 16],
]

const selectedWeeks = computed(() => new Set(props.courseForm.selectedWeeks))
const allWeeks = weekRows.flat()
const oddWeeks = allWeeks.filter((weekNo) => weekNo % 2 === 1)
const evenWeeks = allWeeks.filter((weekNo) => weekNo % 2 === 0)
const currentTerm = getCurrentAcademicTerm()
const selectedCourseIdSet = computed(() => new Set(props.selectedCourseIds))
const areAllCoursesSelected = computed(() => props.courses.length > 0 && props.courses.every((item) => selectedCourseIdSet.value.has(item.id)))
const termOptions = computed(() => {
  const terms = new Set<string>([currentTerm])
  for (const item of props.courses) {
    if (item.term) {
      terms.add(item.term)
    }
  }
  return Array.from(terms).sort((left, right) => right.localeCompare(left, 'zh-Hans-CN'))
})
const touchedWeeks = ref<number[]>([])
const pendingDeleteSessionNo = ref<number | null>(null)
const courseStudentClassKeyword = ref('')
const courseStudentIdKeyword = ref('')
const courseStudentNameKeyword = ref('')
const collapsedCourseStudentClassIds = ref<number[]>([])
const isAllWeeksSelected = computed(() => allWeeks.every((weekNo) => selectedWeeks.value.has(weekNo)))
const isOddWeeksSelected = computed(
  () => oddWeeks.every((weekNo) => selectedWeeks.value.has(weekNo)) && evenWeeks.every((weekNo) => !selectedWeeks.value.has(weekNo)),
)
const isEvenWeeksSelected = computed(
  () => evenWeeks.every((weekNo) => selectedWeeks.value.has(weekNo)) && oddWeeks.every((weekNo) => !selectedWeeks.value.has(weekNo)),
)
const courseStudentSelectedClassIdSet = computed(() => new Set(props.courseStudentSelectedClassIds))
const courseStudentSelectedStudentIdSet = computed(() => new Set(props.courseStudentSelectedStudentIds))
const courseStudentLooseStudentIdSet = computed(() => new Set(props.courseStudentLooseStudents.map((item) => item.student_id)))
const collapsedCourseStudentClassIdSet = computed(() => new Set(collapsedCourseStudentClassIds.value))
const availableCourseStudents = computed(() =>
  Array.from(
    new Map(
      props.courseStudentCandidates.map((item) => [
        item.student_id,
        {
          student_id: item.student_id,
          real_name: item.real_name,
        },
      ]),
    ).values(),
  ).sort((left, right) => left.student_id.localeCompare(right.student_id, 'zh-Hans-CN')),
)
const selectedClasses = computed(() =>
  props.allClasses
    .filter((item) => courseStudentSelectedClassIdSet.value.has(item.id))
    .slice()
    .sort((left, right) => {
      if (left.grade !== right.grade) {
        return right.grade - left.grade
      }
      return left.class_name.localeCompare(right.class_name, 'zh-Hans-CN')
    }),
)
const selectedClassStudentIds = computed(() => {
  const set = new Set<string>()
  for (const students of Object.values(props.courseStudentClassStudentMap)) {
    for (const student of students) {
      set.add(student.student_id)
    }
  }
  return set
})
const filteredCourseStudentClasses = computed(() => {
  const keyword = courseStudentClassKeyword.value.trim()
  return props.allClasses
    .filter((item) => {
      if (!keyword) {
        return true
      }
      return item.class_name.includes(keyword)
    })
    .slice()
    .sort((left, right) => {
      if (left.grade !== right.grade) {
        return right.grade - left.grade
      }
      return left.class_name.localeCompare(right.class_name, 'zh-Hans-CN')
    })
})
const filteredCourseStudentUsers = computed(() => {
  const studentIdKeyword = courseStudentIdKeyword.value.trim()
  const studentNameKeyword = courseStudentNameKeyword.value.trim()
  return availableCourseStudents.value
    .filter((item) => (!studentIdKeyword || item.student_id.includes(studentIdKeyword)) && (!studentNameKeyword || item.real_name.includes(studentNameKeyword)))
    .slice(0, 80)
})

function onCoursePageSizeChange(event: Event) {
  emit('updateCoursePageSize', Number((event.target as HTMLSelectElement).value))
}

function openImportPicker() {
  importInputRef.value?.click()
}

function onImportChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  if (files.length === 0) {
    return
  }
  emit('importCourses', files)
  input.value = ''
}

function beginWeekDrag(weekNo: number) {
  emit('setCourseWeekSelected', { weekNo, selected: !selectedWeeks.value.has(weekNo) })
  touchedWeeks.value = [weekNo]
}

function continueWeekDrag(event: PointerEvent, weekNo: number) {
  if (event.buttons === 0 || touchedWeeks.value.includes(weekNo)) {
    return
  }
  emit('setCourseWeekSelected', { weekNo, selected: !selectedWeeks.value.has(weekNo) })
  touchedWeeks.value = [...touchedWeeks.value, weekNo]
}

function stopWeekDrag() {
  touchedWeeks.value = []
}

function applyWeekSelection(weeks: number[], selected: boolean) {
  for (const weekNo of allWeeks) {
    const shouldSelect = weeks.includes(weekNo) ? selected : false
    emit('setCourseWeekSelected', { weekNo, selected: shouldSelect })
  }
}

function applyWeekSubset(weeks: number[], selected: boolean) {
  for (const weekNo of weeks) {
    emit('setCourseWeekSelected', { weekNo, selected })
  }
}

function selectAllWeeks() {
  applyWeekSelection(allWeeks, !isAllWeeksSelected.value)
}

function selectOddWeeks() {
  if (isOddWeeksSelected.value) {
    applyWeekSubset(oddWeeks, false)
    return
  }
  applyWeekSelection(oddWeeks, true)
}

function selectEvenWeeks() {
  if (isEvenWeeksSelected.value) {
    applyWeekSubset(evenWeeks, false)
    return
  }
  applyWeekSelection(evenWeeks, true)
}

function requestDeleteSession(sessionNo: number) {
  pendingDeleteSessionNo.value = sessionNo
}

function confirmDeleteSession() {
  if (pendingDeleteSessionNo.value === null) {
    return
  }
  emit('removeCourseSession', pendingDeleteSessionNo.value)
  pendingDeleteSessionNo.value = null
}

function classSelectedCount(classId: number) {
  return (props.courseStudentClassStudentMap[classId] ?? []).filter((student) => courseStudentSelectedStudentIdSet.value.has(student.student_id)).length
}

function classSelectionMark(classId: number) {
  const total = (props.courseStudentClassStudentMap[classId] ?? []).length
  const selected = classSelectedCount(classId)
  if (total > 0 && selected === total) {
    return 'check'
  }
  if (selected > 0) {
    return 'indeterminate'
  }
  return 'empty'
}

function toggleCourseStudentClassCollapse(classId: number) {
  const next = new Set(collapsedCourseStudentClassIds.value)
  if (next.has(classId)) {
    next.delete(classId)
  } else {
    next.add(classId)
  }
  collapsedCourseStudentClassIds.value = Array.from(next)
}

function formatCourseStudentClassLabel(grade: number, majorName: string, className: string) {
  return {
    grade: `${grade}级`,
    major: majorName,
    className,
  }
}

function setClassCheckboxState(element: unknown, classId: number) {
  if (!(element instanceof HTMLInputElement)) {
    return
  }
  element.checked = classSelectionMark(classId) === 'check'
  element.indeterminate = classSelectionMark(classId) === 'indeterminate'
}

onMounted(() => {
  window.addEventListener('pointerup', stopWeekDrag)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointerup', stopWeekDrag)
})
</script>

<template>
  <section class="workspace-card user-manage-panel">
    <div class="section-heading">
      <h2>课程管理</h2>
      <div class="inline-actions">
        <input ref="importInputRef" class="hidden-input" type="file" accept="application/json,.json" multiple @change="onImportChange" />
        <button class="ghost-button compact-button" type="button" :disabled="courseImporting" @click="openImportPicker">
          {{ courseImporting ? '导入中...' : '导入' }}
        </button>
        <button class="primary-button" type="button" @click="emit('openCreateCourseModal')">创建课程</button>
      </div>
    </div>

    <div v-if="courseModalOpen" class="modal-backdrop modal-backdrop-contained">
      <article class="modal-card modal-card-wide course-manage-modal">
        <div class="wide-modal-header">
          <div class="wide-modal-header-top">
            <h3 class="wide-modal-header-title">{{ isEditingCourse ? '编辑课程' : '创建课程' }}</h3>
            <div class="wide-modal-header-actions">
              <button class="ghost-button compact-button" type="button" @click="emit('closeCourseModal')">关闭</button>
            </div>
          </div>
          <p class="hint wide-modal-header-meta">先填写课程基础信息，再通过下方快捷组件批量添加上课时间。</p>
        </div>

        <div class="split-modal-layout">
          <div class="split-modal-main">
            <div class="table-wrap course-session-table-wrap">
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>次序</th>
                    <th>周数</th>
                    <th>星期</th>
                    <th>时间</th>
                    <th>地点</th>
                    <th class="actions-column">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="session in courseForm.sessions" :key="session.sessionNo">
                    <td>{{ session.sessionNo }}</td>
                    <td>第 {{ session.weekNo }} 周</td>
                    <td>{{ weekdayLabels[session.weekday] }}</td>
                    <td>{{ sectionLabels[session.section] }}</td>
                    <td>{{ session.buildingName }}-{{ session.roomName }}</td>
                    <td class="actions-column">
                      <div class="inline-actions user-actions">
                        <button class="ghost-button compact-button" type="button" @click="emit('editCourseSession', session.sessionNo)">编辑信息</button>
                        <button class="ghost-button compact-button danger-button" type="button" @click="requestDeleteSession(session.sessionNo)">删除</button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="courseForm.sessions.length === 0">
                    <td colspan="6" class="empty-cell">还没有上课时间</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <aside class="split-modal-side">
            <div class="course-section-heading">
              <h4>基本信息</h4>
            </div>
            <form class="form-grid single-column-form" @submit.prevent="emit('saveCourse')">
              <label class="field">
                <span>学期</span>
                <input v-model="courseForm.term" />
              </label>
              <label class="field">
                <span>课程名称</span>
                <input v-model="courseForm.courseName" />
              </label>
              <label class="field">
                <span>授课教师</span>
                <input v-model="courseForm.teacherName" />
              </label>
            </form>

            <div class="course-section-heading">
              <h4>上课时间</h4>
            </div>
            <div class="course-quick-editor course-quick-editor-paired">
              <label class="field">
                <span>星期</span>
                <select v-model="courseForm.weekday">
                  <option :value="null"></option>
                  <option v-for="day in Object.entries(weekdayLabels)" :key="day[0]" :value="Number(day[0])">{{ day[1] }}</option>
                </select>
              </label>
              <label class="field">
                <span>时间</span>
                <select v-model="courseForm.section">
                  <option :value="null"></option>
                  <option v-for="slot in Object.entries(sectionLabels)" :key="slot[0]" :value="Number(slot[0])">{{ slot[1] }}</option>
                </select>
              </label>
              <label class="field">
                <span>教学楼</span>
                <input v-model="courseForm.buildingName" />
              </label>
              <label class="field">
                <span>教室</span>
                <input v-model="courseForm.roomName" />
              </label>
            </div>

            <div class="course-week-picker" @pointerleave="stopWeekDrag">
              <div class="course-section-heading">
                <h4>周数</h4>
              </div>
              <div class="inline-actions course-week-shortcuts">
                <button class="ghost-button compact-button course-week-shortcut-button" :class="{ selected: isAllWeeksSelected }" type="button" @click="selectAllWeeks">全周</button>
                <button class="ghost-button compact-button course-week-shortcut-button" :class="{ selected: isOddWeeksSelected }" type="button" @click="selectOddWeeks">单周</button>
                <button class="ghost-button compact-button course-week-shortcut-button" :class="{ selected: isEvenWeeksSelected }" type="button" @click="selectEvenWeeks">双周</button>
              </div>
              <div v-for="(row, rowIndex) in weekRows" :key="rowIndex" class="course-week-row">
                <button
                  v-for="weekNo in row"
                  :key="weekNo"
                  class="ghost-button course-week-button"
                  :class="{ selected: selectedWeeks.has(weekNo) }"
                  type="button"
                  @pointerdown.prevent="beginWeekDrag(weekNo)"
                  @pointerenter="continueWeekDrag($event, weekNo)"
                >
                  {{ weekNo }}
                </button>
              </div>
            </div>

            <div class="course-quick-actions">
              <button class="primary-button narrow-button" type="button" @click="emit('addCourseSessions')">添加上课时间</button>
            </div>

            <div class="class-student-footer">
              <button class="primary-button narrow-button" type="button" :disabled="courseSaving || courseLoading" @click="emit('saveCourse')">
                <span v-if="courseSaving || courseLoading" class="button-spinner" aria-hidden="true"></span>
                <span>{{ courseSaving ? '保存中...' : '保存' }}</span>
              </button>
            </div>
          </aside>
        </div>

        <div v-if="pendingDeleteSessionNo !== null" class="modal-backdrop nested-modal-backdrop">
          <article class="modal-card modal-card-narrow">
            <div class="modal-header">
              <h3>确认删除</h3>
              <button class="ghost-button compact-button modal-close" type="button" @click="pendingDeleteSessionNo = null">关闭</button>
            </div>
            <p class="hint">确定删除第 {{ pendingDeleteSessionNo }} 次课吗？</p>
            <div class="inline-actions">
              <button class="ghost-button" type="button" @click="pendingDeleteSessionNo = null">取消</button>
              <button class="ghost-button danger-button" type="button" @click="confirmDeleteSession">确认删除</button>
            </div>
          </article>
        </div>
      </article>
    </div>

    <div v-if="courseStudentModalOpen" class="modal-backdrop modal-backdrop-contained">
      <article class="modal-card modal-card-wide course-student-editor-modal">
        <div class="wide-modal-header">
          <div class="wide-modal-header-top">
            <h3 class="wide-modal-header-title">编辑学生</h3>
            <div class="wide-modal-header-actions">
              <button class="ghost-button compact-button" type="button" @click="emit('closeCourseStudentModal')">关闭</button>
            </div>
          </div>
          <p class="hint wide-modal-header-meta">课程：{{ courseStudentTargetName }}</p>
        </div>

        <div class="split-modal-layout course-student-editor-layout">
          <div class="split-modal-main course-student-editor-main">
            <div class="section-heading modal-section-heading">
              <h4>已添加的班级与学生</h4>
            </div>

            <div class="course-student-selected-list">
              <article v-for="item in selectedClasses" :key="item.id" class="course-student-class-card">
                <div class="course-student-class-row">
                  <input
                    :ref="(element) => setClassCheckboxState(element, item.id)"
                    class="course-student-check-input"
                    type="checkbox"
                    @change="emit('toggleCourseStudentClassSelection', item.id)"
                  />
                  <button class="course-student-class-toggle" type="button" @click="toggleCourseStudentClassCollapse(item.id)">
                    <span class="course-student-class-collapse" aria-hidden="true">
                      {{ collapsedCourseStudentClassIdSet.has(item.id) ? '▸' : '▾' }}
                    </span>
                    <strong class="course-student-class-label">
                      <span>{{ formatCourseStudentClassLabel(item.grade, item.major_name, item.class_name).grade }}</span>
                      <span>{{ formatCourseStudentClassLabel(item.grade, item.major_name, item.class_name).major }}</span>
                      <span>{{ formatCourseStudentClassLabel(item.grade, item.major_name, item.class_name).className }}</span>
                    </strong>
                  </button>
                  <button class="ghost-button compact-button danger-button" type="button" @click="emit('removeCourseStudentClass', item.id)">删除</button>
                </div>
                <div v-if="!collapsedCourseStudentClassIdSet.has(item.id)" class="course-student-member-list">
                  <label
                    v-for="student in (courseStudentClassStudentMap[item.id] ?? []).slice().sort((left, right) => left.student_id.localeCompare(right.student_id, 'zh-Hans-CN'))"
                    :key="`${item.id}-${student.id}`"
                    class="course-student-member-row"
                  >
                    <input
                      class="course-student-check-input"
                      type="checkbox"
                      :checked="courseStudentSelectedStudentIdSet.has(student.student_id)"
                      @change="emit('toggleCourseStudentSelection', student.student_id)"
                    />
                    <span class="course-student-member-id">{{ student.student_id }}</span>
                    <span class="course-student-member-name">{{ student.real_name }}</span>
                  </label>
                </div>
              </article>

              <div v-if="courseStudentLooseStudents.length > 0" class="course-student-loose-block">
                <div class="course-section-heading">
                  <h4>其他学生</h4>
                </div>
                <div class="course-student-member-list course-student-member-list-loose">
                  <div v-for="student in courseStudentLooseStudents" :key="student.student_id" class="course-student-loose-row">
                    <div class="course-student-loose-text">
                      <span class="course-student-member-id">{{ student.student_id }}</span>
                      <span class="course-student-member-name">{{ student.real_name }}</span>
                    </div>
                    <button class="ghost-button compact-button danger-button" type="button" @click="emit('removeCourseStudent', student.student_id)">删除</button>
                  </div>
                </div>
              </div>

              <p v-if="selectedClasses.length === 0 && courseStudentLooseStudents.length === 0" class="hint">还没有添加班级或学生。</p>
            </div>
          </div>

          <aside class="split-modal-side course-student-editor-side">
            <section class="course-student-side-block">
              <div class="table-wrap course-student-side-table-wrap">
                <table class="data-table compact-table course-student-side-table">
                  <colgroup>
                    <col />
                    <col class="course-student-side-col-action" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>班级</th>
                      <th class="actions-column">操作</th>
                    </tr>
                    <tr class="table-filter-row">
                      <th class="table-filter-cell">
                        <input v-model="courseStudentClassKeyword" aria-label="搜索班级" />
                      </th>
                      <th class="table-filter-spacer" aria-hidden="true"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in filteredCourseStudentClasses" :key="item.id">
                      <td>{{ item.class_name }}</td>
                      <td class="actions-column">
                        <button
                          class="ghost-button compact-button"
                          type="button"
                          :disabled="courseStudentSelectedClassIdSet.has(item.id) || courseStudentLoading"
                          @click="emit('addCourseStudentClass', item.id)"
                        >
                          {{ courseStudentSelectedClassIdSet.has(item.id) ? '已添加' : '添加' }}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section class="course-student-side-block">
              <div class="table-wrap course-student-side-table-wrap">
                <table class="data-table compact-table course-student-side-table">
                  <colgroup>
                    <col class="course-student-side-col-id" />
                    <col class="course-student-side-col-name" />
                    <col class="course-student-side-col-action" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>学号</th>
                      <th>姓名</th>
                      <th class="actions-column">操作</th>
                    </tr>
                    <tr class="table-filter-row">
                      <th class="table-filter-cell">
                        <input v-model="courseStudentIdKeyword" aria-label="搜索学号" />
                      </th>
                      <th class="table-filter-cell">
                        <input v-model="courseStudentNameKeyword" aria-label="搜索姓名" />
                      </th>
                      <th class="table-filter-spacer" aria-hidden="true"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in filteredCourseStudentUsers" :key="item.student_id">
                      <td class="course-student-member-id">{{ item.student_id }}</td>
                      <td class="course-student-member-name">{{ item.real_name }}</td>
                      <td class="actions-column">
                        <button
                          class="ghost-button compact-button"
                          type="button"
                          :disabled="courseStudentSelectedStudentIdSet.has(item.student_id)"
                          @click="emit('addCourseStudent', item.student_id)"
                        >
                          {{
                            courseStudentSelectedStudentIdSet.has(item.student_id)
                              ? '已勾选'
                              : selectedClassStudentIds.has(item.student_id) || courseStudentLooseStudentIdSet.has(item.student_id)
                                ? '勾选'
                                : '添加'
                          }}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <div class="class-student-footer">
              <button class="primary-button narrow-button" type="button" :disabled="courseStudentSaving || courseStudentLoading" @click="emit('saveCourseStudents')">
                <span v-if="courseStudentSaving || courseStudentLoading" class="button-spinner" aria-hidden="true"></span>
                <span>{{ courseStudentSaving ? '保存中...' : '保存' }}</span>
              </button>
            </div>
          </aside>
        </div>
      </article>
    </div>

    <div v-if="deleteCourseModalOpen" class="modal-backdrop">
      <article class="modal-card modal-card-narrow">
        <div class="modal-header">
          <h3>确认删除</h3>
          <button class="ghost-button compact-button modal-close" type="button" @click="emit('closeDeleteCourseModal')">关闭</button>
        </div>
        <p class="hint">删除后无法恢复。确定删除课程“{{ deletingCourseName }}”吗？</p>
        <div class="inline-actions">
          <button class="ghost-button" type="button" @click="emit('closeDeleteCourseModal')">取消</button>
          <button class="ghost-button danger-button" type="button" :disabled="courseDeleting" @click="emit('deleteCourse')">
            <span v-if="courseDeleting" class="button-spinner" aria-hidden="true"></span>
            <span>{{ courseDeleting ? '删除中...' : '确认删除' }}</span>
          </button>
        </div>
      </article>
    </div>

    <div v-if="bulkDeleteCourseModalOpen" class="modal-backdrop">
      <article class="modal-card modal-card-narrow">
        <div class="modal-header">
          <h3>确认批量删除</h3>
          <button class="ghost-button compact-button modal-close" type="button" @click="emit('closeBulkDeleteCourseModal')">关闭</button>
        </div>
        <p class="hint">删除后无法恢复。确定删除已选中的 {{ selectedCourseCount }} 门课程吗？</p>
        <div class="inline-actions">
          <button class="ghost-button" type="button" @click="emit('closeBulkDeleteCourseModal')">取消</button>
          <button class="ghost-button danger-button" type="button" :disabled="courseDeleting" @click="emit('bulkDeleteCourses')">
            <span v-if="courseDeleting" class="button-spinner" aria-hidden="true"></span>
            <span>{{ courseDeleting ? '删除中...' : '确认删除' }}</span>
          </button>
        </div>
      </article>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th class="selection-column">
              <span class="visually-hidden">选择</span>
            </th>
            <th>学期</th>
            <th>课程名称</th>
            <th>授课教师</th>
            <th>班级</th>
            <th>人数</th>
            <th class="actions-column">操作</th>
          </tr>
          <tr class="table-filter-row">
            <th class="table-filter-spacer" aria-hidden="true"></th>
            <th class="table-filter-cell">
              <select v-model="courseFilters.term" aria-label="按学期筛选课程">
                <option v-for="term in termOptions" :key="term" :value="term">{{ term }}</option>
              </select>
            </th>
            <th class="table-filter-cell">
              <input v-model="courseFilters.courseName" aria-label="按课程名称筛选课程" />
            </th>
            <th class="table-filter-cell">
              <input v-model="courseFilters.teacherName" aria-label="按授课教师筛选课程" />
            </th>
            <th class="table-filter-cell">
              <select v-model="courseFilters.classId" aria-label="按班级筛选课程">
                <option value="">全部</option>
                <option v-for="item in allClasses" :key="item.id" :value="String(item.id)">{{ item.class_name }}</option>
              </select>
            </th>
            <th class="table-filter-spacer" aria-hidden="true"></th>
            <th class="table-filter-cell table-filter-actions-cell">
              <div class="table-filter-actions">
                <button
                  class="ghost-button compact-button"
                  :class="{ selected: areAllCoursesSelected }"
                  type="button"
                  @click="emit('toggleCoursePageSelection')"
                >
                  全选
                </button>
                <button class="ghost-button compact-button danger-button" type="button" :disabled="courseDeleting || selectedCourseIds.length === 0" @click="emit('openBulkDeleteCourseModal')">
                  批量删除
                </button>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in courses" :key="item.id">
            <td class="selection-column">
              <input
                type="checkbox"
                :checked="selectedCourseIdSet.has(item.id)"
                :aria-label="`选择课程 ${item.course_name}`"
                @change="emit('toggleCourseSelection', item.id)"
              />
            </td>
            <td>{{ item.term }}</td>
            <td>{{ item.course_name }}</td>
            <td>{{ item.teacher_name }}</td>
            <td>{{ item.class_names.join('、') }}</td>
            <td>{{ item.attendance_student_count }}</td>
            <td class="actions-column">
              <div class="inline-actions user-actions">
                <button class="ghost-button compact-button" type="button" :disabled="courseLoading" @click="emit('openEditCourseModal', item)">编辑信息</button>
                <button class="ghost-button compact-button" type="button" :disabled="courseLoading" @click="emit('openCourseStudentModal', item)">编辑学生</button>
                <button class="ghost-button compact-button danger-button" type="button" @click="emit('openDeleteCourseModal', item)">删除</button>
              </div>
            </td>
          </tr>
          <tr v-if="courses.length === 0">
            <td colspan="7" class="empty-cell">暂无符合条件的课程</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination-bar">
      <div class="pagination-pages">
        <button
          v-for="page in courseTotalPages"
          :key="page"
          class="ghost-button compact-button pagination-button"
          :class="{ selected: coursePage === page }"
          type="button"
          @click="emit('updateCoursePage', page)"
        >
          {{ page }}
        </button>
      </div>
      <div class="pagination-size">
        <select :value="coursePageSize" @change="onCoursePageSizeChange">
          <option v-for="size in coursePageOptions" :key="size" :value="size">{{ size }}</option>
        </select>
      </div>
    </div>
  </section>
</template>
