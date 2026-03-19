<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import {
  api,
  type AvailableCourseGroupClassItem,
  type AvailableCourseGroupStudentItem,
  type CourseGroupDetail,
  type CourseGroupItem,
  type CourseGroupLessonItem,
  type CourseGroupStudentItem,
  type CourseItem,
} from '../../api'
import { sectionLabels, weekdayLabels } from '../../constants'
import { getCurrentAcademicTerm } from '../../utils/free-time'
import { selectDefaultTermName, sortTermsForSelect } from '../../utils/terms'
import AdminDataList from './AdminDataList.vue'
import type { AdminCourseManageProps } from './types'

const props = defineProps<AdminCourseManageProps>()

const emit = defineEmits<{
  openCreateCourseModal: []
  openEditCourseModal: [item: CourseItem]
  closeCourseModal: []
  openDeleteCourseModal: [item: CourseItem]
  closeDeleteCourseModal: []
  openBulkDeleteCourseModal: []
  closeBulkDeleteCourseModal: []
  saveCourse: []
  deleteCourse: []
  updateCoursePage: [page: number]
  updateCoursePageSize: [size: number]
  toggleCourseSelection: [courseId: number]
  toggleCoursePageSelection: []
  bulkDeleteCourses: []
}>()

const currentTerm = getCurrentAcademicTerm()
const selectedCourseIdSet = computed(() => new Set(props.selectedCourseIds))
const areAllCoursesSelected = computed(() => props.courses.length > 0 && props.courses.every((item) => selectedCourseIdSet.value.has(item.id)))
const courseColumns = [
  { key: 'term', label: '学期', colClass: 'col-pct-14' },
  { key: 'course_name', label: '课程名称', colClass: 'col-pct-22' },
  { key: 'teacher_name', label: '授课教师', colClass: 'col-pct-16' },
  { key: 'class_names', label: '班级', colClass: 'col-pct-18', copyValue: (row: Record<string, unknown>) => Array.isArray(row.class_names) ? row.class_names.join('、') : '' },
  { key: 'student_count', label: '人数', colClass: 'col-pct-10' },
] as const
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

watch(
  termOptions,
  (terms) => {
    if (!props.courseFilters.term || !terms.includes(props.courseFilters.term)) {
      props.courseFilters.term = selectDefaultTermName(props.courseTerms) || terms[0] || ''
    }
  },
  { immediate: true },
)
const courseGroupWorkspaceCourse = ref<CourseItem | null>(null)
const courseGroups = ref<CourseGroupItem[]>([])
const courseGroupsLoading = ref(false)
const courseGroupActionLoading = ref(false)
const courseGroupsError = ref('')
const activeCourseGroupId = ref<number | null>(null)
const activeCourseGroupDetail = ref<CourseGroupDetail | null>(null)
const availableCourseGroupClasses = ref<AvailableCourseGroupClassItem[]>([])
const availableCourseGroupStudents = ref<AvailableCourseGroupStudentItem[]>([])
const courseGroupClassKeyword = ref('')
const courseGroupStudentKeyword = ref('')
const courseGroupSessionForm = ref({
  weekNo: 1,
  weekday: 1,
  section: 1,
  buildingName: '',
  roomName: '',
})

const activeCourseGroup = computed(() => {
  return courseGroups.value.find((item) => item.id === activeCourseGroupId.value) ?? null
})

const courseGroupBoundClassIdSet = computed(() => new Set(activeCourseGroupDetail.value?.course_group.class_ids ?? []))
const courseGroupStudentIdSet = computed(() => new Set((activeCourseGroupDetail.value?.students ?? []).map((item) => item.student_id)))
const filteredAvailableCourseGroupClasses = computed(() => {
  const keyword = courseGroupClassKeyword.value.trim()
  return availableCourseGroupClasses.value
    .filter((item) => {
      if (!keyword) {
        return true
      }
      return item.class_name.includes(keyword) || item.major_name.includes(keyword) || String(item.grade).includes(keyword)
    })
    .slice()
    .sort((left, right) => {
      if (left.grade !== right.grade) {
        return right.grade - left.grade
      }
      return left.class_name.localeCompare(right.class_name, 'zh-Hans-CN')
    })
})
const filteredAvailableCourseGroupStudents = computed(() => {
  const keyword = courseGroupStudentKeyword.value.trim()
  return availableCourseGroupStudents.value
    .filter((item) => {
      if (!keyword) {
        return true
      }
      return item.student_no.includes(keyword) || item.student_name.includes(keyword) || item.class_name.includes(keyword)
    })
    .slice()
    .sort((left, right) => left.student_no.localeCompare(right.student_no, 'zh-Hans-CN'))
    .slice(0, 80)
})
const groupedCourseGroupStudents = computed(() => {
  if (!activeCourseGroupDetail.value) {
    return []
  }
  const grouped = new Map<string, { key: string; label: string; items: CourseGroupStudentItem[] }>()
  for (const student of activeCourseGroupDetail.value.students) {
    const label = student.class_name?.trim() || '其他学生'
    const key = student.class_id ? `class-${student.class_id}` : `other-${label}`
    if (!grouped.has(key)) {
      grouped.set(key, { key, label, items: [] })
    }
    grouped.get(key)?.items.push(student)
  }
  return Array.from(grouped.values()).map((group) => ({
    ...group,
    items: group.items.slice().sort((left, right) => left.student_no.localeCompare(right.student_no, 'zh-Hans-CN')),
  }))
})

async function loadCourseGroupEditorOptions(courseId: number, groupId: number) {
  const [classes, students] = await Promise.all([
    api.listAvailableCourseGroupClasses(courseId, groupId),
    api.listAvailableCourseGroupStudents(courseId, groupId),
  ])
  availableCourseGroupClasses.value = classes
  availableCourseGroupStudents.value = students
}

async function loadCourseGroupDetail(courseId: number, groupId: number) {
  activeCourseGroupId.value = groupId
  const [detail] = await Promise.all([api.getCourseGroup(courseId, groupId), loadCourseGroupEditorOptions(courseId, groupId)])
  activeCourseGroupDetail.value = detail
}

async function refreshCourseGroups(targetGroupId = activeCourseGroupId.value) {
  if (!courseGroupWorkspaceCourse.value) {
    return
  }
  const groups = await api.listCourseGroups(courseGroupWorkspaceCourse.value.id)
  courseGroups.value = groups
  const nextGroupId = targetGroupId !== null && groups.some((item) => item.id === targetGroupId) ? targetGroupId : groups[0]?.id ?? null
  if (nextGroupId !== null) {
    await loadCourseGroupDetail(courseGroupWorkspaceCourse.value.id, nextGroupId)
    return
  }
  activeCourseGroupId.value = null
  activeCourseGroupDetail.value = null
  availableCourseGroupClasses.value = []
  availableCourseGroupStudents.value = []
}

async function openCourseGroupWorkspace(item: CourseItem) {
  courseGroupsLoading.value = true
  courseGroupsError.value = ''
  courseGroupWorkspaceCourse.value = item
  try {
    const groups = await api.listCourseGroups(item.id)
    courseGroups.value = groups
    if (groups.length > 0) {
      await loadCourseGroupDetail(item.id, groups[0].id)
    } else {
      activeCourseGroupId.value = null
      activeCourseGroupDetail.value = null
    }
  } catch (error) {
    courseGroupsError.value = error instanceof Error ? error.message : '加载课程组失败'
  } finally {
    courseGroupsLoading.value = false
  }
}

function closeCourseGroupWorkspace() {
  courseGroupWorkspaceCourse.value = null
  courseGroups.value = []
  courseGroupsLoading.value = false
  courseGroupActionLoading.value = false
  courseGroupsError.value = ''
  activeCourseGroupId.value = null
  activeCourseGroupDetail.value = null
  availableCourseGroupClasses.value = []
  availableCourseGroupStudents.value = []
  courseGroupClassKeyword.value = ''
  courseGroupStudentKeyword.value = ''
}

async function createCourseGroup() {
  if (!courseGroupWorkspaceCourse.value) {
    return
  }
  courseGroupActionLoading.value = true
  courseGroupsError.value = ''
  try {
    const created = await api.createCourseGroup(courseGroupWorkspaceCourse.value.id)
    await refreshCourseGroups(created.id)
  } catch (error) {
    courseGroupsError.value = error instanceof Error ? error.message : '创建课程组失败'
  } finally {
    courseGroupActionLoading.value = false
  }
}

async function deleteCourseGroup(groupId: number) {
  if (!courseGroupWorkspaceCourse.value || !window.confirm('确定删除这个课程组吗？')) {
    return
  }
  courseGroupActionLoading.value = true
  courseGroupsError.value = ''
  try {
    await api.deleteCourseGroup(courseGroupWorkspaceCourse.value.id, groupId)
    await refreshCourseGroups(activeCourseGroupId.value === groupId ? null : activeCourseGroupId.value)
  } catch (error) {
    courseGroupsError.value = error instanceof Error ? error.message : '删除课程组失败'
  } finally {
    courseGroupActionLoading.value = false
  }
}

async function selectCourseGroup(groupId: number) {
  if (!courseGroupWorkspaceCourse.value || activeCourseGroupId.value === groupId) {
    return
  }
  courseGroupsLoading.value = true
  courseGroupsError.value = ''
  try {
    await loadCourseGroupDetail(courseGroupWorkspaceCourse.value.id, groupId)
  } catch (error) {
    courseGroupsError.value = error instanceof Error ? error.message : '加载课程组详情失败'
  } finally {
    courseGroupsLoading.value = false
  }
}

async function createCourseGroupSession() {
  if (!courseGroupWorkspaceCourse.value || activeCourseGroupId.value === null) {
    return
  }
  const buildingName = courseGroupSessionForm.value.buildingName.trim()
  const roomName = courseGroupSessionForm.value.roomName.trim()
  if (!buildingName || !roomName) {
    courseGroupsError.value = '请先填写完整的课次信息'
    return
  }
  courseGroupActionLoading.value = true
  courseGroupsError.value = ''
  try {
    await api.createCourseGroupSession(courseGroupWorkspaceCourse.value.id, activeCourseGroupId.value, {
      week_no: courseGroupSessionForm.value.weekNo,
      weekday: courseGroupSessionForm.value.weekday,
      section: courseGroupSessionForm.value.section,
      building_name: buildingName,
      room_name: roomName,
    })
    await refreshCourseGroups(activeCourseGroupId.value)
    courseGroupSessionForm.value = {
      weekNo: 1,
      weekday: 1,
      section: 1,
      buildingName: '',
      roomName: '',
    }
  } catch (error) {
    courseGroupsError.value = error instanceof Error ? error.message : '创建课次失败'
  } finally {
    courseGroupActionLoading.value = false
  }
}

async function deleteCourseGroupSession(session: CourseGroupLessonItem) {
  if (!courseGroupWorkspaceCourse.value || activeCourseGroupId.value === null || !window.confirm('确定删除这个课次吗？')) {
    return
  }
  courseGroupActionLoading.value = true
  courseGroupsError.value = ''
  try {
    await api.deleteCourseGroupSession(courseGroupWorkspaceCourse.value.id, activeCourseGroupId.value, session.id)
    await refreshCourseGroups(activeCourseGroupId.value)
  } catch (error) {
    courseGroupsError.value = error instanceof Error ? error.message : '删除课次失败'
  } finally {
    courseGroupActionLoading.value = false
  }
}

async function addCourseGroupClass(classId: number) {
  if (!courseGroupWorkspaceCourse.value || activeCourseGroupId.value === null) {
    return
  }
  courseGroupActionLoading.value = true
  courseGroupsError.value = ''
  try {
    await api.addCourseGroupClasses(courseGroupWorkspaceCourse.value.id, activeCourseGroupId.value, [classId])
    await refreshCourseGroups(activeCourseGroupId.value)
  } catch (error) {
    courseGroupsError.value = error instanceof Error ? error.message : '添加班级失败'
  } finally {
    courseGroupActionLoading.value = false
  }
}

async function removeCourseGroupClass(classId: number) {
  if (!courseGroupWorkspaceCourse.value || activeCourseGroupId.value === null || !window.confirm('确定将这个班级从课程组中移除吗？')) {
    return
  }
  courseGroupActionLoading.value = true
  courseGroupsError.value = ''
  try {
    await api.removeCourseGroupClass(courseGroupWorkspaceCourse.value.id, activeCourseGroupId.value, classId)
    await refreshCourseGroups(activeCourseGroupId.value)
  } catch (error) {
    courseGroupsError.value = error instanceof Error ? error.message : '移除班级失败'
  } finally {
    courseGroupActionLoading.value = false
  }
}

async function addCourseGroupStudent(studentId: number) {
  if (!courseGroupWorkspaceCourse.value || activeCourseGroupId.value === null) {
    return
  }
  courseGroupActionLoading.value = true
  courseGroupsError.value = ''
  try {
    await api.addCourseGroupStudents(courseGroupWorkspaceCourse.value.id, activeCourseGroupId.value, [studentId])
    await refreshCourseGroups(activeCourseGroupId.value)
  } catch (error) {
    courseGroupsError.value = error instanceof Error ? error.message : '添加学生失败'
  } finally {
    courseGroupActionLoading.value = false
  }
}

async function removeCourseGroupStudent(studentId: number) {
  if (!courseGroupWorkspaceCourse.value || activeCourseGroupId.value === null || !window.confirm('确定将这个学生从课程组中移除吗？')) {
    return
  }
  courseGroupActionLoading.value = true
  courseGroupsError.value = ''
  try {
    await api.removeCourseGroupStudent(courseGroupWorkspaceCourse.value.id, activeCourseGroupId.value, studentId)
    await refreshCourseGroups(activeCourseGroupId.value)
  } catch (error) {
    courseGroupsError.value = error instanceof Error ? error.message : '移除学生失败'
  } finally {
    courseGroupActionLoading.value = false
  }
}

function asCourseItem(row: Record<string, unknown>) {
  return row as unknown as CourseItem
}

</script>

<template>
  <section class="workspace-card user-manage-panel">
    <div class="section-heading section-heading-titleless">
      <div class="inline-actions">
        <button class="primary-button" type="button" @click="emit('openCreateCourseModal')">创建课程</button>
      </div>
    </div>

    <Transition name="modal-float" appear>
    <div v-if="courseModalOpen" class="modal-backdrop modal-backdrop-contained">
      <article class="modal-card modal-card-narrow">
        <div class="wide-modal-header">
          <div class="wide-modal-header-top">
            <h3 class="wide-modal-header-title">{{ isEditingCourse ? '编辑课程' : '创建课程' }}</h3>
            <div class="wide-modal-header-actions">
              <button class="ghost-button compact-button" type="button" @click="emit('closeCourseModal')">关闭</button>
            </div>
          </div>
          <p class="hint wide-modal-header-meta">这里只维护课程基础信息。课次、班级和上课学生请在课程组工作区中继续管理。</p>
        </div>

        <div>
          <aside class="split-modal-side">
            <div class="course-section-heading">
              <h4>基本信息</h4>
            </div>
            <form class="form-grid single-column-form" @submit.prevent="emit('saveCourse')">
              <label class="field">
                <span>学期</span>
                <select v-model="courseForm.termId">
                  <option value="">请选择学期</option>
                  <option v-for="item in courseTerms" :key="item.id" :value="item.id">{{ item.name }}</option>
                </select>
              </label>
              <label class="field">
                <span>年级</span>
                <input v-model.number="courseForm.grade" type="number" min="2000" max="2999" />
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
            <p class="hint">保存后可在课程列表中打开“课程组”工作区，继续维护课次、班级和上课学生。</p>

            <div class="class-student-footer">
              <button class="primary-button narrow-button" type="button" :disabled="courseSaving || courseLoading" @click="emit('saveCourse')">
                <span v-if="courseSaving || courseLoading" class="button-spinner" aria-hidden="true"></span>
                <span>{{ courseSaving ? '保存中...' : '保存' }}</span>
              </button>
            </div>
          </aside>
        </div>
      </article>
    </div>
    </Transition>

    <Transition name="modal-float" appear>
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
    </Transition>

    <Transition name="modal-float" appear>
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
    </Transition>

    <AdminDataList
      :rows="courses as unknown as Array<Record<string, unknown>>"
      :columns="courseColumns as unknown as Array<{ key: string; label: string; colClass?: string }>"
      row-key="id"
      table-class="course-manage-table"
      empty-text="暂无符合条件的课程"
      :show-selection="true"
      :selected-row-keys="selectedCourseIds"
      :show-actions="true"
      action-col-class="col-pct-18"
      :pagination="{ page: coursePage, pageSize: coursePageSize, totalPages: courseTotalPages, pageOptions: coursePageOptions }"
      @update-page="emit('updateCoursePage', $event)"
      @update-page-size="emit('updateCoursePageSize', $event)"
      @toggle-row-selection="emit('toggleCourseSelection', Number($event))"
    >
      <template #filter-term>
        <select v-model="courseFilters.term" aria-label="按学期筛选课程">
          <option v-for="term in termOptions" :key="term" :value="term">{{ term }}</option>
        </select>
      </template>
      <template #filter-course_name>
        <input v-model="courseFilters.courseName" aria-label="按课程名称筛选课程" />
      </template>
      <template #filter-teacher_name>
        <input v-model="courseFilters.teacherName" aria-label="按授课教师筛选课程" />
      </template>
      <template #filter-class_names>
        <select v-model="courseFilters.classId" aria-label="按班级筛选课程">
          <option value="">全部</option>
          <option v-for="item in allClasses" :key="item.id" :value="String(item.id)">{{ item.class_name }}</option>
        </select>
      </template>
      <template #filter-actions>
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
      </template>
      <template #cell-class_names="{ value }">
        {{ Array.isArray(value) ? value.join('、') : '' }}
      </template>
      <template #actions="{ row }">
        <div class="inline-actions user-actions">
          <button class="ghost-button compact-button" type="button" :disabled="courseLoading" @click="emit('openEditCourseModal', asCourseItem(row))">编辑信息</button>
          <button class="ghost-button compact-button" type="button" :disabled="courseLoading" @click="openCourseGroupWorkspace(asCourseItem(row))">课程组</button>
          <button class="ghost-button compact-button danger-button" type="button" @click="emit('openDeleteCourseModal', asCourseItem(row))">删除</button>
        </div>
      </template>
    </AdminDataList>

    <section v-if="courseGroupWorkspaceCourse" class="workspace-card user-manage-panel course-group-workspace">
      <div class="section-heading">
        <div>
          <h2>课程组管理</h2>
          <p class="hint">{{ courseGroupWorkspaceCourse.course_name }} / {{ courseGroupWorkspaceCourse.teacher_name }}</p>
        </div>
        <div class="inline-actions">
          <button class="ghost-button compact-button" type="button" :disabled="courseGroupActionLoading" @click="createCourseGroup">
            {{ courseGroupActionLoading ? '处理中...' : '创建课程组' }}
          </button>
          <button class="ghost-button compact-button" type="button" @click="closeCourseGroupWorkspace">关闭</button>
        </div>
      </div>

      <p v-if="courseGroupsError" class="hint">{{ courseGroupsError }}</p>
      <p v-else-if="courseGroupsLoading" class="hint">正在加载课程组数据...</p>

      <div v-else class="course-group-workspace-grid">
        <aside class="course-group-sidebar">
          <div class="course-group-sidebar-header">
            <h3>课程组列表</h3>
            <span class="pill">{{ courseGroups.length }} 组</span>
          </div>
          <div class="course-group-list">
            <article
              v-for="group in courseGroups"
              :key="group.id"
              class="course-group-card"
              :class="{ selected: activeCourseGroupId === group.id }"
            >
              <button class="course-group-card-main" type="button" @click="selectCourseGroup(group.id)">
                <strong>课程组 {{ group.id }}</strong>
                <span class="hint">{{ group.class_names.length > 0 ? group.class_names.join('、') : '未绑定班级' }}</span>
                <span class="hint">学生 {{ group.student_count }} 人 / 课次 {{ group.lesson_count }} 节</span>
              </button>
              <button class="ghost-button compact-button danger-button course-group-card-delete" type="button" @click="deleteCourseGroup(group.id)">删除</button>
            </article>
            <p v-if="courseGroups.length === 0" class="hint">当前课程还没有课程组。</p>
          </div>
        </aside>

        <div class="course-group-detail">
          <template v-if="activeCourseGroup && activeCourseGroupDetail">
            <div class="course-group-detail-header">
              <div>
                <h3>课程组 {{ activeCourseGroup.id }}</h3>
                <p class="hint">班级：{{ activeCourseGroup.class_names.length > 0 ? activeCourseGroup.class_names.join('、') : '未绑定班级' }}</p>
              </div>
              <div class="inline-actions">
                <span class="pill">学生 {{ activeCourseGroup.student_count }}</span>
                <span class="pill">课次 {{ activeCourseGroup.lesson_count }}</span>
              </div>
            </div>

            <div class="course-group-detail-sections">
              <section class="workspace-card course-group-detail-card">
                <div class="section-heading">
                  <h4>课次管理</h4>
                </div>
                <div class="course-group-session-form">
                  <select v-model.number="courseGroupSessionForm.weekNo">
                    <option v-for="weekNo in 16" :key="weekNo" :value="weekNo">第 {{ weekNo }} 周</option>
                  </select>
                  <select v-model.number="courseGroupSessionForm.weekday">
                    <option v-for="day in Object.entries(weekdayLabels)" :key="day[0]" :value="Number(day[0])">{{ day[1] }}</option>
                  </select>
                  <select v-model.number="courseGroupSessionForm.section">
                    <option v-for="slot in Object.entries(sectionLabels)" :key="slot[0]" :value="Number(slot[0])">{{ slot[1] }}</option>
                  </select>
                  <input v-model="courseGroupSessionForm.buildingName" placeholder="教学楼" />
                  <input v-model="courseGroupSessionForm.roomName" placeholder="教室" />
                  <button class="primary-button narrow-button" type="button" :disabled="courseGroupActionLoading" @click="createCourseGroupSession">新增课次</button>
                </div>
                <div class="table-wrap">
                  <table class="data-table compact-table">
                    <thead>
                      <tr>
                        <th>周次</th>
                        <th>星期</th>
                        <th>时间</th>
                        <th>地点</th>
                        <th class="actions-column">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="session in activeCourseGroupDetail.sessions" :key="session.id">
                        <td>第 {{ session.week_no }} 周</td>
                        <td>{{ weekdayLabels[session.weekday] }}</td>
                        <td>{{ sectionLabels[session.section] }}</td>
                        <td>{{ session.building_name }}-{{ session.room_name }}</td>
                        <td class="actions-column">
                          <button class="ghost-button compact-button danger-button" type="button" :disabled="courseGroupActionLoading" @click="deleteCourseGroupSession(session)">删除</button>
                        </td>
                      </tr>
                      <tr v-if="activeCourseGroupDetail.sessions.length === 0">
                        <td colspan="5" class="empty-cell">当前课程组还没有课次。</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section class="workspace-card course-group-detail-card">
                <div class="section-heading">
                  <h4>上课学生</h4>
                </div>
                <div class="course-group-student-groups">
                  <article v-for="group in groupedCourseGroupStudents" :key="group.key" class="course-group-student-block">
                    <div class="course-group-student-block-header">
                      <div class="course-group-student-block-title">
                        <strong>{{ group.label }}</strong>
                        <span class="pill">{{ group.items.length }} 人</span>
                      </div>
                      <button
                        v-if="group.items[0]?.class_id"
                        class="ghost-button compact-button danger-button"
                        type="button"
                        :disabled="courseGroupActionLoading"
                        @click="removeCourseGroupClass(group.items[0].class_id)"
                      >
                        移除班级
                      </button>
                    </div>
                    <div class="course-group-student-list">
                      <div v-for="student in group.items" :key="student.id" class="course-group-student-row">
                        <div class="course-group-student-row-main">
                          <span class="course-student-member-id">{{ student.student_no }}</span>
                          <span class="course-student-member-name">{{ student.student_name }}</span>
                        </div>
                        <button class="ghost-button compact-button danger-button" type="button" :disabled="courseGroupActionLoading" @click="removeCourseGroupStudent(student.student_id)">
                          移除
                        </button>
                      </div>
                    </div>
                  </article>
                  <p v-if="groupedCourseGroupStudents.length === 0" class="hint">当前课程组还没有上课学生。</p>
                </div>

                <div class="course-group-editor-grid">
                  <section class="course-group-editor-block">
                    <div class="course-group-student-block-header">
                      <strong>添加班级</strong>
                      <span class="hint">绑定后自动纳入班级学生</span>
                    </div>
                    <input v-model="courseGroupClassKeyword" placeholder="搜索班级 / 专业 / 年级" />
                    <div class="table-wrap course-group-editor-table-wrap">
                      <table class="data-table compact-table">
                        <thead>
                          <tr>
                            <th>班级</th>
                            <th>人数</th>
                            <th class="actions-column">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="item in filteredAvailableCourseGroupClasses" :key="item.id">
                            <td>{{ item.grade }}级 {{ item.major_name }} {{ item.class_name }}</td>
                            <td>{{ item.student_count }}</td>
                            <td class="actions-column">
                              <button
                                class="ghost-button compact-button"
                                type="button"
                                :disabled="courseGroupActionLoading || courseGroupBoundClassIdSet.has(item.id)"
                                @click="addCourseGroupClass(item.id)"
                              >
                                {{ courseGroupBoundClassIdSet.has(item.id) ? '已绑定' : '添加' }}
                              </button>
                            </td>
                          </tr>
                          <tr v-if="filteredAvailableCourseGroupClasses.length === 0">
                            <td colspan="3" class="empty-cell">没有可添加的班级。</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section class="course-group-editor-block">
                    <div class="course-group-student-block-header">
                      <strong>添加学生</strong>
                      <span class="hint">可补充未按班级绑定的个别学生</span>
                    </div>
                    <input v-model="courseGroupStudentKeyword" placeholder="搜索学号 / 姓名 / 班级" />
                    <div class="table-wrap course-group-editor-table-wrap">
                      <table class="data-table compact-table">
                        <thead>
                          <tr>
                            <th>学号</th>
                            <th>姓名</th>
                            <th>班级</th>
                            <th class="actions-column">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="item in filteredAvailableCourseGroupStudents" :key="item.id">
                            <td class="course-student-member-id">{{ item.student_no }}</td>
                            <td class="course-student-member-name">{{ item.student_name }}</td>
                            <td>{{ item.class_name }}</td>
                            <td class="actions-column">
                              <button
                                class="ghost-button compact-button"
                                type="button"
                                :disabled="courseGroupActionLoading || courseGroupStudentIdSet.has(item.id)"
                                @click="addCourseGroupStudent(item.id)"
                              >
                                {{ courseGroupStudentIdSet.has(item.id) ? '已添加' : '添加' }}
                              </button>
                            </td>
                          </tr>
                          <tr v-if="filteredAvailableCourseGroupStudents.length === 0">
                            <td colspan="4" class="empty-cell">没有可添加的学生。</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              </section>
            </div>
          </template>

          <div v-else class="empty-state-card">
            <p class="hint">请先创建课程组，或从左侧选择一个课程组查看详情。</p>
          </div>
        </div>
      </div>
    </section>
  </section>
</template>
