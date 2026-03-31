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
import { formatClassNameListMultiline, sectionLabels, weekdayLabels } from '../../constants'
import { getCurrentAcademicTerm } from '../../utils/free-time'
import { selectDefaultTermName, sortTermsForSelect } from '../../utils/terms'
import AppInputSelect from '../common/AppInputSelect.vue'
import AdminDataList from './AdminDataList.vue'
import type { AdminCourseManageProps } from './types'

type CourseManageView = 'courses' | 'groups' | 'lessons' | 'students'
type CourseGroupLessonRow = CourseGroupLessonItem & {
  session_no: number
  location: string
}
type CourseWeekPreset = 'all' | 'odd' | 'even' | 'first-half' | 'second-half'

const props = defineProps<AdminCourseManageProps & {
  courseManageRouteView?: CourseManageView
  courseManageRouteCourseId?: number | null
  courseManageRouteGroupId?: number | null
  courseManagePathCommand?: {
    token: number
    target: 'courses' | 'groups'
    courseId?: number | null
  } | null
}>()

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
  updateCourseManageView: [view: CourseManageView]
  updateCourseManageRoute: [payload: { view: CourseManageView; courseId?: number | null; groupId?: number | null }]
}>()

const GROUP_BATCH_SIZE = 20
const LESSON_BATCH_SIZE = 20
const CANDIDATE_PAGE_SIZE = 20
const currentTerm = getCurrentAcademicTerm()

const currentView = ref<CourseManageView>('courses')
const syncingRouteState = ref(false)
const selectedCourseIdSet = computed(() => new Set(props.selectedCourseIds))
const areAllCoursesSelected = computed(() => props.courses.length > 0 && props.courses.every((item) => selectedCourseIdSet.value.has(item.id)))
const classNameOptions = computed(() =>
  Array.from(new Set(props.allClasses.map((item) => item.class_name.trim()).filter((item) => item.length > 0))).sort((left, right) =>
    left.localeCompare(right, 'zh-Hans-CN'),
  ),
)
const courseColumns = [
  { key: 'grade', label: '年级', width: 3 },
  { key: 'course_name', label: '课程名称', width: 8 },
  { key: 'teacher_name', label: '教师', width: 3 },
  { key: 'class_names', label: '上课班级', width: 8, copyValue: (row: Record<string, unknown>) => Array.isArray(row.class_names) ? row.class_names.join('、') : '' },
  { key: 'student_count', label: '上课人数', width: 4 },
] as const
const groupColumns = [
  { key: 'class_names', label: '上课班级', width: 20, copyValue: (row: Record<string, unknown>) => Array.isArray(row.class_names) ? row.class_names.join('、') : '' },
  { key: 'student_count', label: '上课人数', width: 5 },
  { key: 'lesson_count', label: '课次', width: 4 },
] as const
const lessonColumns = [
  { key: 'session_no', label: '课次', width: 6, copyable: false },
  { key: 'week_no', label: '上课周', width: 8, copyable: false },
  { key: 'weekday', label: '星期', width: 6, copyable: false },
  { key: 'section', label: '时间节', width: 10, copyable: false },
  { key: 'location', label: '地点', width: 9, copyable: true, copyValue: (row: Record<string, unknown>) => String(row.location ?? '') },
] as const
const candidateClassColumns = [
  { key: 'class_name', label: '班级名称', width: 8 },
  { key: 'student_count', label: '人数', width: 4 },
] as const
const candidateStudentColumns = [
  { key: 'student_no', label: '学号', width: 10 },
  { key: 'student_name', label: '姓名', width: 8 },
  { key: 'class_name', label: '所属班级', width: 9 },
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
const selectedCourseGroupIds = ref<number[]>([])
const activeCourseGroupId = ref<number | null>(null)
const activeCourseGroupDetail = ref<CourseGroupDetail | null>(null)
const visibleCourseGroupCount = ref(GROUP_BATCH_SIZE)
const visibleLessonCount = ref(LESSON_BATCH_SIZE)
const lessonSessionNoFilter = ref('')
const lessonWeekFilter = ref('')
const lessonWeekdayFilter = ref('')
const lessonSectionFilter = ref('')
const lessonLocationFilter = ref('')
const sessionModalOpen = ref(false)
const editingSessionId = ref<number | null>(null)
const sessionHistoryHint = ref('')
const actionToast = ref('')
const selectedLessonIds = ref<number[]>([])
const bulkDeleteCourseGroupModalOpen = ref(false)
const bulkDeleteLessonModalOpen = ref(false)
const selectedCreateSessionWeeks = ref<number[]>([])
const selectedCreateSessionPreset = ref<CourseWeekPreset | null>(null)
const deleteCourseGroupModalOpen = ref(false)
const pendingDeleteCourseGroupId = ref<number | null>(null)
const pendingDeleteCourseGroupName = ref('')
const removeCourseGroupMemberModalOpen = ref(false)
const pendingRemoveCourseGroupMember = ref<{ type: 'class' | 'student'; id: number; name: string } | null>(null)
const courseGroupClassNameFilter = ref('')
const courseGroupStudentNoFilter = ref('')
const courseGroupStudentNameFilter = ref('')
const courseGroupStudentClassNameFilter = ref('')
const courseGroupClassRows = ref<AvailableCourseGroupClassItem[]>([])
const courseGroupStudentRows = ref<AvailableCourseGroupStudentItem[]>([])
const courseGroupClassPage = ref(1)
const courseGroupStudentPage = ref(1)
const courseGroupClassHasMore = ref(false)
const courseGroupStudentHasMore = ref(false)
const courseGroupClassLoading = ref(false)
const courseGroupStudentLoading = ref(false)
const expandedCourseGroupClassKeys = ref<string[]>([])
const courseGroupSessionForm = ref({
  weekNo: 1,
  weekday: '' as number | '',
  section: '' as number | '',
  buildingName: '',
  roomName: '',
})
let actionToastTimer: ReturnType<typeof setTimeout> | null = null
const safeCourses = computed(() => props.courses.filter((item): item is CourseItem => !!item))
const safeCourseGroups = computed(() => courseGroups.value.filter((item): item is CourseGroupItem => !!item))

const showActionToast = (message: string) => {
  if (!message) {
    return
  }
  actionToast.value = message
  if (actionToastTimer) {
    clearTimeout(actionToastTimer)
  }
  actionToastTimer = setTimeout(() => {
    if (actionToast.value === message) {
      actionToast.value = ''
    }
  }, 2400)
}

const activeCourseGroup = computed(() => {
  return safeCourseGroups.value.find((item) => item.id === activeCourseGroupId.value) ?? null
})

const selectedCourseGroupIdSet = computed(() => new Set(selectedCourseGroupIds.value))
const areAllCourseGroupsSelected = computed(
  () => safeCourseGroups.value.length > 0 && safeCourseGroups.value.every((item) => selectedCourseGroupIdSet.value.has(item.id)),
)
const visibleCourseGroups = computed(() => safeCourseGroups.value.slice(0, visibleCourseGroupCount.value))
const courseGroupLessonRows = computed<CourseGroupLessonRow[]>(() =>
  (activeCourseGroupDetail.value?.sessions ?? [])
    .filter((item): item is CourseGroupLessonItem => !!item)
    .map((item, index) => ({
      ...item,
      session_no: index + 1,
      location: `${item.building_name}-${item.room_name}`,
    })),
)
const filteredCourseGroupLessons = computed(() => {
  const sessionNoKeyword = lessonSessionNoFilter.value.trim()
  const locationKeyword = lessonLocationFilter.value.trim().toLowerCase()

  return courseGroupLessonRows.value.filter((item) => {
    if (sessionNoKeyword && String(item.session_no) !== sessionNoKeyword) {
      return false
    }
    if (lessonWeekFilter.value && String(item.week_no) !== lessonWeekFilter.value) {
      return false
    }
    if (lessonWeekdayFilter.value && String(item.weekday) !== lessonWeekdayFilter.value) {
      return false
    }
    if (lessonSectionFilter.value && String(item.section) !== lessonSectionFilter.value) {
      return false
    }
    if (locationKeyword && !item.location.toLowerCase().includes(locationKeyword)) {
      return false
    }
    return true
  })
})
const visibleCourseGroupLessons = computed(() => filteredCourseGroupLessons.value.slice(0, visibleLessonCount.value))
const selectedLessonIdSet = computed(() => new Set(selectedLessonIds.value))
const safeFilteredLessons = computed(() => filteredCourseGroupLessons.value.filter((item): item is CourseGroupLessonRow => !!item))
const areAllVisibleLessonsSelected = computed(
  () =>
    safeFilteredLessons.value.length > 0 &&
    safeFilteredLessons.value.every((item) => selectedLessonIdSet.value.has(item.id)),
)
const activeCourseGroupStudents = computed(() => {
  const students = activeCourseGroupDetail.value?.students
  return Array.isArray(students) ? students : []
})
const groupedCourseGroupStudents = computed(() => {
  if (!activeCourseGroupDetail.value) {
    return []
  }
  const grouped = new Map<string, { key: string; label: string; items: CourseGroupStudentItem[]; classId: number | null }>()
  for (const student of activeCourseGroupStudents.value) {
    const label = student.class_name?.trim() || '其他学生'
    const classId = student.class_id ?? null
    const key = classId ? `class-${classId}` : `other-${student.student_id}`
    if (!grouped.has(key)) {
      grouped.set(key, { key, label, items: [], classId })
    }
    grouped.get(key)?.items.push(student)
  }
  return Array.from(grouped.values())
    .map((group) => ({
      ...group,
      items: group.items.slice().sort((left, right) => left.student_no.localeCompare(right.student_no, 'zh-Hans-CN')),
    }))
    .sort((left, right) => {
      if (left.classId === null && right.classId !== null) {
        return 1
      }
      if (left.classId !== null && right.classId === null) {
        return -1
      }
      return left.label.localeCompare(right.label, 'zh-Hans-CN')
    })
})
const courseGroupStudentEntries = computed(() => {
  const classEntries = groupedCourseGroupStudents.value
    .filter((group) => group.classId !== null)
    .map((group) => ({
      key: group.key,
      kind: 'class' as const,
      label: group.label,
      classId: group.classId,
      items: group.items,
    }))
  const otherStudentEntries = activeCourseGroupStudents.value
    .filter((student) => student.class_id === null || student.class_id === undefined)
    .slice()
    .sort((left, right) => left.student_no.localeCompare(right.student_no, 'zh-Hans-CN'))
    .map((student) => ({
      key: `student-${student.student_id}`,
      kind: 'student' as const,
      student,
    }))
  return [...classEntries, ...otherStudentEntries]
})
const allSessionWeeks = computed(() => Array.from({ length: 16 }, (_, index) => index + 1))

const parentCourseSummary = computed(() => {
  const course = courseGroupWorkspaceCourse.value
  if (!course) {
    return []
  }
  return [
    { label: '课程名称', value: course.course_name },
    { label: '教师', value: course.teacher_name },
    { label: '年级', value: `${course.grade}` },
    { label: '学期', value: course.term },
  ]
})

const activeCourseGroupSummary = computed(() => {
  const group = activeCourseGroup.value
  if (!group) {
    return []
  }
  return [
    { label: '上课班级', value: formatClassNameListMultiline(group.class_names) },
  ]
})

watch(
  () => courseGroups.value.length,
  () => {
    visibleCourseGroupCount.value = GROUP_BATCH_SIZE
    selectedCourseGroupIds.value = selectedCourseGroupIds.value.filter((id) => courseGroups.value.some((item) => item.id === id))
  },
)

watch(courseGroupsError, (message) => {
  if (message) {
    showActionToast(message)
  }
})

watch(sessionHistoryHint, (message) => {
  if (message) {
    showActionToast(message)
  }
})

watch(
  () => [
    courseGroupLessonRows.value.length,
    lessonSessionNoFilter.value,
    lessonWeekFilter.value,
    lessonWeekdayFilter.value,
    lessonSectionFilter.value,
    lessonLocationFilter.value,
  ],
  () => {
    visibleLessonCount.value = LESSON_BATCH_SIZE
    selectedLessonIds.value = []
  },
)

watch(
  () => activeCourseGroupId.value,
  () => {
    expandedCourseGroupClassKeys.value = []
  },
)

watch(
  () => courseGroupClassNameFilter.value,
  async () => {
    if (currentView.value !== 'students' || activeCourseGroupId.value === null) {
      return
    }
    await resetCourseGroupClassCandidates()
  },
)

watch(
  () => [
    courseGroupStudentNoFilter.value,
    courseGroupStudentNameFilter.value,
    courseGroupStudentClassNameFilter.value,
  ],
  async () => {
    if (currentView.value !== 'students' || activeCourseGroupId.value === null) {
      return
    }
    await resetCourseGroupStudentCandidates()
  },
)

watch(
  () => [props.courseManageRouteView, props.courseManageRouteCourseId, props.courseManageRouteGroupId],
  async ([view, routeCourseId, routeGroupId]) => {
    const normalizedView = view as CourseManageView | undefined
    if (!normalizedView) {
      return
    }
    syncingRouteState.value = true
    try {
      if (normalizedView === 'courses' || !routeCourseId) {
        if (currentView.value !== 'courses' || courseGroupWorkspaceCourse.value) {
          closeCourseGroupWorkspace()
        }
        return
      }
      const targetCourseId = Number(routeCourseId)
      const targetGroupId = routeGroupId ? Number(routeGroupId) : null
      const existingCourse = courseGroupWorkspaceCourse.value?.id === targetCourseId ? courseGroupWorkspaceCourse.value : null
      const matchedCourse = safeCourses.value.find((item) => item.id === targetCourseId) ?? null
      const course = existingCourse ?? matchedCourse ?? await api.getCourseSummary(targetCourseId)
      if (!course) {
        return
      }
      const shouldReloadWorkspace =
        courseGroupWorkspaceCourse.value?.id !== targetCourseId ||
        (normalizedView === 'groups' && currentView.value === 'courses') ||
        ((normalizedView === 'lessons' || normalizedView === 'students') && activeCourseGroupId.value !== targetGroupId)
      if (shouldReloadWorkspace) {
        await openCourseGroupPage(course, normalizedView, targetGroupId)
        return
      }
      if (normalizedView === 'groups') {
        closeSessionModal()
        currentView.value = 'groups'
        return
      }
      if (normalizedView === 'lessons' || normalizedView === 'students') {
        currentView.value = normalizedView
      }
    } finally {
      syncingRouteState.value = false
    }
  },
  { immediate: true },
)

watch(
  currentView,
  (view) => {
    emit('updateCourseManageView', view)
  },
)

watch(
  () => props.courseManagePathCommand?.token,
  () => {
    const target = props.courseManagePathCommand?.target
    if (!target) {
      return
    }
    if (target === 'courses') {
      closeCourseGroupWorkspace()
      return
    }
    if (target === 'groups' && courseGroupWorkspaceCourse.value) {
      closeSessionModal()
      currentView.value = 'groups'
    }
  },
)

function syncCourseManageRoute(view: CourseManageView, courseId: number | null = null, groupId: number | null = null) {
  if (syncingRouteState.value) {
    return
  }
  emit('updateCourseManageRoute', {
    view,
    courseId,
    groupId: view === 'lessons' || view === 'students' ? groupId : null,
  })
}

function asCourseItem(row: Record<string, unknown>) {
  return row as unknown as CourseItem
}

function openCourseEditor(row: Record<string, unknown> | null | undefined) {
  if (!row) {
    return
  }
  emit('openEditCourseModal', asCourseItem(row))
}

function openCourseGroupsManager(row: Record<string, unknown> | null | undefined) {
  if (!row) {
    return
  }
  void openCourseGroupPage(asCourseItem(row))
}

function openCourseDelete(row: Record<string, unknown> | null | undefined) {
  if (!row) {
    return
  }
  emit('openDeleteCourseModal', asCourseItem(row))
}

function asCourseGroupItem(row: Record<string, unknown>) {
  return row as unknown as CourseGroupItem
}

async function loadCourseGroupDetail(courseId: number, groupId: number) {
  activeCourseGroupId.value = groupId
  activeCourseGroupDetail.value = await api.getCourseGroup(courseId, groupId)
}

async function refreshCourseGroups(targetGroupId = activeCourseGroupId.value) {
  if (!courseGroupWorkspaceCourse.value) {
    return
  }
  const groups = (await api.listCourseGroups(courseGroupWorkspaceCourse.value.id)).filter((item): item is CourseGroupItem => !!item)
  courseGroups.value = groups
  selectedCourseGroupIds.value = selectedCourseGroupIds.value.filter((id) => groups.some((item) => item.id === id))
  const nextGroupId = targetGroupId !== null && groups.some((item) => item.id === targetGroupId) ? targetGroupId : groups[0]?.id ?? null
  if (nextGroupId !== null) {
    await loadCourseGroupDetail(courseGroupWorkspaceCourse.value.id, nextGroupId)
    return
  }
  activeCourseGroupId.value = null
  activeCourseGroupDetail.value = null
}

async function openCourseGroupPage(item: CourseItem, targetView: CourseManageView = 'groups', targetGroupId: number | null = null) {
  courseGroupsLoading.value = true
  courseGroupsError.value = ''
  courseGroupWorkspaceCourse.value = item
  currentView.value = 'groups'
  lessonSessionNoFilter.value = ''
  lessonWeekFilter.value = ''
  lessonWeekdayFilter.value = ''
  lessonSectionFilter.value = ''
  lessonLocationFilter.value = ''
  if (targetView === 'groups') {
    syncCourseManageRoute('groups', item.id, null)
  }
  try {
    await refreshCourseGroups(targetGroupId)
    if (targetView === 'lessons' || targetView === 'students') {
      if (targetView === 'students') {
        courseGroupClassNameFilter.value = ''
        courseGroupStudentNoFilter.value = ''
        courseGroupStudentNameFilter.value = ''
        courseGroupStudentClassNameFilter.value = ''
      }
      currentView.value = targetView
      if (targetView === 'students') {
        await Promise.all([resetCourseGroupClassCandidates(), resetCourseGroupStudentCandidates()])
      }
      syncCourseManageRoute(
        targetView,
        courseGroupWorkspaceCourse.value?.id ?? item.id,
        activeCourseGroupId.value,
      )
    }
  } catch (error) {
    courseGroupsError.value = error instanceof Error ? error.message : '加载课程组失败'
  } finally {
    courseGroupsLoading.value = false
  }
}

function closeCourseGroupWorkspace() {
  currentView.value = 'courses'
  courseGroupWorkspaceCourse.value = null
  courseGroups.value = []
  courseGroupsLoading.value = false
  courseGroupActionLoading.value = false
  courseGroupsError.value = ''
  selectedCourseGroupIds.value = []
  activeCourseGroupId.value = null
  activeCourseGroupDetail.value = null
  visibleCourseGroupCount.value = GROUP_BATCH_SIZE
  visibleLessonCount.value = LESSON_BATCH_SIZE
  lessonSessionNoFilter.value = ''
  lessonWeekFilter.value = ''
  lessonWeekdayFilter.value = ''
  lessonSectionFilter.value = ''
  lessonLocationFilter.value = ''
  sessionModalOpen.value = false
  editingSessionId.value = null
  sessionHistoryHint.value = ''
  bulkDeleteCourseGroupModalOpen.value = false
  selectedLessonIds.value = []
  bulkDeleteLessonModalOpen.value = false
  selectedCreateSessionWeeks.value = []
  selectedCreateSessionPreset.value = null
  deleteCourseGroupModalOpen.value = false
  pendingDeleteCourseGroupId.value = null
  pendingDeleteCourseGroupName.value = ''
  removeCourseGroupMemberModalOpen.value = false
  pendingRemoveCourseGroupMember.value = null
  courseGroupClassNameFilter.value = ''
  courseGroupStudentNoFilter.value = ''
  courseGroupStudentNameFilter.value = ''
  courseGroupStudentClassNameFilter.value = ''
  courseGroupClassRows.value = []
  courseGroupStudentRows.value = []
  courseGroupClassPage.value = 1
  courseGroupStudentPage.value = 1
  courseGroupClassHasMore.value = false
  courseGroupStudentHasMore.value = false
  expandedCourseGroupClassKeys.value = []
}

async function openCourseGroupLessons(group: CourseGroupItem) {
  if (!courseGroupWorkspaceCourse.value) {
    return
  }
  courseGroupsLoading.value = true
  courseGroupsError.value = ''
  try {
    await loadCourseGroupDetail(courseGroupWorkspaceCourse.value.id, group.id)
    currentView.value = 'lessons'
    lessonSessionNoFilter.value = ''
    lessonWeekFilter.value = ''
    lessonWeekdayFilter.value = ''
    lessonSectionFilter.value = ''
    lessonLocationFilter.value = ''
    syncCourseManageRoute('lessons', courseGroupWorkspaceCourse.value.id, group.id)
  } catch (error) {
    courseGroupsError.value = error instanceof Error ? error.message : '加载课次失败'
  } finally {
    courseGroupsLoading.value = false
  }
}

async function openCourseGroupStudents(group: CourseGroupItem) {
  if (!courseGroupWorkspaceCourse.value) {
    return
  }
  courseGroupsLoading.value = true
  courseGroupsError.value = ''
  try {
    await loadCourseGroupDetail(courseGroupWorkspaceCourse.value.id, group.id)
    courseGroupClassNameFilter.value = ''
    courseGroupStudentNoFilter.value = ''
    courseGroupStudentNameFilter.value = ''
    courseGroupStudentClassNameFilter.value = ''
    currentView.value = 'students'
    await Promise.all([resetCourseGroupClassCandidates(), resetCourseGroupStudentCandidates()])
    syncCourseManageRoute('students', courseGroupWorkspaceCourse.value.id, group.id)
  } catch (error) {
    courseGroupsError.value = error instanceof Error ? error.message : '加载上课学生失败'
  } finally {
    courseGroupsLoading.value = false
  }
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

function toggleCourseGroupSelection(groupId: number) {
  if (selectedCourseGroupIds.value.includes(groupId)) {
    selectedCourseGroupIds.value = selectedCourseGroupIds.value.filter((item) => item !== groupId)
    return
  }
  selectedCourseGroupIds.value = [...selectedCourseGroupIds.value, groupId]
}

function toggleCourseGroupPageSelection() {
  if (areAllCourseGroupsSelected.value) {
    selectedCourseGroupIds.value = []
    return
  }
  selectedCourseGroupIds.value = safeCourseGroups.value.map((item) => item.id)
}

function openBulkDeleteCourseGroupModal() {
  if (selectedCourseGroupIds.value.length === 0) {
    return
  }
  bulkDeleteCourseGroupModalOpen.value = true
}

function closeBulkDeleteCourseGroupModal() {
  bulkDeleteCourseGroupModalOpen.value = false
}

function openDeleteCourseGroupModal(group: CourseGroupItem) {
  pendingDeleteCourseGroupId.value = group.id
  pendingDeleteCourseGroupName.value = `课程组 ${group.id}`
  deleteCourseGroupModalOpen.value = true
}

function closeDeleteCourseGroupModal() {
  deleteCourseGroupModalOpen.value = false
  pendingDeleteCourseGroupId.value = null
  pendingDeleteCourseGroupName.value = ''
}

async function deleteCourseGroup() {
  if (!courseGroupWorkspaceCourse.value || pendingDeleteCourseGroupId.value === null) {
    return
  }
  courseGroupActionLoading.value = true
  courseGroupsError.value = ''
  try {
    await api.deleteCourseGroup(courseGroupWorkspaceCourse.value.id, pendingDeleteCourseGroupId.value)
    await refreshCourseGroups(activeCourseGroupId.value === pendingDeleteCourseGroupId.value ? null : activeCourseGroupId.value)
    closeDeleteCourseGroupModal()
  } catch (error) {
    courseGroupsError.value = error instanceof Error ? error.message : '删除课程组失败'
  } finally {
    courseGroupActionLoading.value = false
  }
}

async function bulkDeleteCourseGroups() {
  if (!courseGroupWorkspaceCourse.value || selectedCourseGroupIds.value.length === 0) {
    return
  }
  courseGroupActionLoading.value = true
  courseGroupsError.value = ''
  const targetIds = [...selectedCourseGroupIds.value]
  const failedIds: number[] = []
  const failed: string[] = []
  let deletedCount = 0
  try {
    for (const groupId of targetIds) {
      try {
        await api.deleteCourseGroup(courseGroupWorkspaceCourse.value.id, groupId)
        deletedCount += 1
      } catch (error) {
        const message = error instanceof Error ? error.message : '删除失败'
        failedIds.push(groupId)
        failed.push(`课程组 ${groupId}（${message}）`)
      }
    }
    if (deletedCount > 0) {
      await refreshCourseGroups(activeCourseGroupId.value)
    }
    selectedCourseGroupIds.value = failedIds
    closeBulkDeleteCourseGroupModal()
    if (failed.length > 0) {
      courseGroupsError.value = `部分删除失败：${failed.join('；')}`
    }
  } finally {
    courseGroupActionLoading.value = false
  }
}

function openEditSessionModal(session: CourseGroupLessonItem) {
  editingSessionId.value = session.id
  sessionHistoryHint.value = '若该课次已有考勤历史，后端会继续校验并阻止破坏性修改。'
  courseGroupSessionForm.value = {
    weekNo: session.week_no,
    weekday: session.weekday,
    section: session.section,
    buildingName: session.building_name,
    roomName: session.room_name,
  }
  sessionModalOpen.value = true
}

function closeSessionModal() {
  sessionModalOpen.value = false
  editingSessionId.value = null
  sessionHistoryHint.value = ''
}

function toggleLessonSelection(lessonId: number) {
  if (selectedLessonIds.value.includes(lessonId)) {
    selectedLessonIds.value = selectedLessonIds.value.filter((item) => item !== lessonId)
    return
  }
  selectedLessonIds.value = [...selectedLessonIds.value, lessonId]
}

function toggleLessonPageSelection() {
  if (areAllVisibleLessonsSelected.value) {
    const visibleIds = new Set(filteredCourseGroupLessons.value.map((item) => item.id))
    selectedLessonIds.value = selectedLessonIds.value.filter((item) => !visibleIds.has(item))
    return
  }
  selectedLessonIds.value = Array.from(
    new Set([...selectedLessonIds.value, ...filteredCourseGroupLessons.value.map((item) => item.id)]),
  )
}

function openBulkDeleteLessonModal() {
  if (selectedLessonIds.value.length === 0) {
    return
  }
  bulkDeleteLessonModalOpen.value = true
}

function closeBulkDeleteLessonModal() {
  bulkDeleteLessonModalOpen.value = false
}

function resetCreateSessionForm() {
  selectedCreateSessionWeeks.value = []
  selectedCreateSessionPreset.value = null
  courseGroupSessionForm.value = {
    weekNo: 1,
    weekday: '',
    section: '',
    buildingName: '',
    roomName: '',
  }
}

function selectAllSessionWeeks() {
  if (selectedCreateSessionPreset.value === 'all') {
    selectedCreateSessionPreset.value = null
    selectedCreateSessionWeeks.value = []
    return
  }
  selectedCreateSessionPreset.value = 'all'
  selectedCreateSessionWeeks.value = [...allSessionWeeks.value]
}

function selectOddSessionWeeks() {
  if (selectedCreateSessionPreset.value === 'odd') {
    selectedCreateSessionPreset.value = null
    selectedCreateSessionWeeks.value = []
    return
  }
  selectedCreateSessionPreset.value = 'odd'
  selectedCreateSessionWeeks.value = allSessionWeeks.value.filter((weekNo) => weekNo % 2 === 1)
}

function selectEvenSessionWeeks() {
  if (selectedCreateSessionPreset.value === 'even') {
    selectedCreateSessionPreset.value = null
    selectedCreateSessionWeeks.value = []
    return
  }
  selectedCreateSessionPreset.value = 'even'
  selectedCreateSessionWeeks.value = allSessionWeeks.value.filter((weekNo) => weekNo % 2 === 0)
}

function selectFirstHalfSessionWeeks() {
  if (selectedCreateSessionPreset.value === 'first-half') {
    selectedCreateSessionPreset.value = null
    selectedCreateSessionWeeks.value = []
    return
  }
  selectedCreateSessionPreset.value = 'first-half'
  selectedCreateSessionWeeks.value = allSessionWeeks.value.filter((weekNo) => weekNo <= 8)
}

function selectSecondHalfSessionWeeks() {
  if (selectedCreateSessionPreset.value === 'second-half') {
    selectedCreateSessionPreset.value = null
    selectedCreateSessionWeeks.value = []
    return
  }
  selectedCreateSessionPreset.value = 'second-half'
  selectedCreateSessionWeeks.value = allSessionWeeks.value.filter((weekNo) => weekNo >= 9)
}

function toggleCreateSessionWeek(weekNo: number) {
  selectedCreateSessionPreset.value = null
  if (selectedCreateSessionWeeks.value.includes(weekNo)) {
    selectedCreateSessionWeeks.value = selectedCreateSessionWeeks.value.filter((item) => item !== weekNo)
    return
  }
  selectedCreateSessionWeeks.value = [...selectedCreateSessionWeeks.value, weekNo].sort((left, right) => left - right)
}

async function saveCourseGroupSession() {
  if (!courseGroupWorkspaceCourse.value || activeCourseGroupId.value === null) {
    return
  }
  const courseId = courseGroupWorkspaceCourse.value.id
  const groupId = activeCourseGroupId.value
  const buildingName = courseGroupSessionForm.value.buildingName.trim()
  const roomName = courseGroupSessionForm.value.roomName.trim()
  const weekday = Number(courseGroupSessionForm.value.weekday)
  const section = Number(courseGroupSessionForm.value.section)
  if (!buildingName || !roomName) {
    courseGroupsError.value = '请先填写完整的课次信息'
    return
  }
  if (!weekday || !section) {
    courseGroupsError.value = '请先选择星期和时间节'
    return
  }
  if (editingSessionId.value === null && selectedCreateSessionWeeks.value.length === 0) {
    courseGroupsError.value = '请至少选择一个周次'
    return
  }
  courseGroupActionLoading.value = true
  courseGroupsError.value = ''
  try {
    if (editingSessionId.value === null) {
      await Promise.all(
        selectedCreateSessionWeeks.value.map((weekNo) =>
          api.createCourseGroupSession(courseId, groupId, {
            week_no: weekNo,
            weekday,
            section,
            building_name: buildingName,
            room_name: roomName,
          }),
        ),
      )
    } else {
      await api.updateCourseGroupSession(courseId, groupId, editingSessionId.value, {
        week_no: courseGroupSessionForm.value.weekNo,
        weekday,
        section,
        building_name: buildingName,
        room_name: roomName,
      })
    }
    await refreshCourseGroups(activeCourseGroupId.value)
    if (editingSessionId.value === null) {
      resetCreateSessionForm()
    } else {
      closeSessionModal()
    }
  } catch (error) {
    courseGroupsError.value = error instanceof Error ? error.message : editingSessionId.value === null ? '创建课次失败' : '编辑课次失败'
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

async function bulkDeleteCourseGroupSessions() {
  if (!courseGroupWorkspaceCourse.value || activeCourseGroupId.value === null || selectedLessonIds.value.length === 0) {
    return
  }
  courseGroupActionLoading.value = true
  courseGroupsError.value = ''
  try {
    const targetIds = [...selectedLessonIds.value]
    for (const lessonId of targetIds) {
      await api.deleteCourseGroupSession(courseGroupWorkspaceCourse.value.id, activeCourseGroupId.value, lessonId)
    }
    selectedLessonIds.value = []
    closeBulkDeleteLessonModal()
    await refreshCourseGroups(activeCourseGroupId.value)
  } catch (error) {
    courseGroupsError.value = error instanceof Error ? error.message : '批量删除课次失败'
  } finally {
    courseGroupActionLoading.value = false
  }
}

async function resetCourseGroupClassCandidates() {
  courseGroupClassRows.value = []
  courseGroupClassPage.value = 1
  courseGroupClassHasMore.value = true
  await loadMoreCourseGroupClasses()
}

async function resetCourseGroupStudentCandidates() {
  courseGroupStudentRows.value = []
  courseGroupStudentPage.value = 1
  courseGroupStudentHasMore.value = true
  await loadMoreCourseGroupStudents()
}

async function loadMoreCourseGroupClasses() {
  if (
    !courseGroupWorkspaceCourse.value ||
    activeCourseGroupId.value === null ||
    (!courseGroupClassHasMore.value && courseGroupClassPage.value > 1) ||
    courseGroupClassLoading.value
  ) {
    return
  }
  courseGroupClassLoading.value = true
  try {
    const page = await api.listAvailableCourseGroupClasses(courseGroupWorkspaceCourse.value.id, activeCourseGroupId.value, {
      class_name: courseGroupClassNameFilter.value,
      page: courseGroupClassPage.value,
      page_size: CANDIDATE_PAGE_SIZE,
    })
    const incoming = page.items ?? []
    courseGroupClassRows.value = courseGroupClassPage.value === 1 ? incoming : [...courseGroupClassRows.value, ...incoming]
    const loadedCount = courseGroupClassRows.value.length
    courseGroupClassHasMore.value = loadedCount < (page.total ?? 0)
    if (courseGroupClassHasMore.value) {
      courseGroupClassPage.value += 1
    }
  } catch (error) {
    courseGroupsError.value = error instanceof Error ? error.message : '加载可添加班级失败'
    courseGroupClassHasMore.value = false
  } finally {
    courseGroupClassLoading.value = false
  }
}

async function loadMoreCourseGroupStudents() {
  if (
    !courseGroupWorkspaceCourse.value ||
    activeCourseGroupId.value === null ||
    (!courseGroupStudentHasMore.value && courseGroupStudentPage.value > 1) ||
    courseGroupStudentLoading.value
  ) {
    return
  }
  courseGroupStudentLoading.value = true
  try {
    const page = await api.listAvailableCourseGroupStudents(courseGroupWorkspaceCourse.value.id, activeCourseGroupId.value, {
      student_no: courseGroupStudentNoFilter.value,
      student_name: courseGroupStudentNameFilter.value,
      class_name: courseGroupStudentClassNameFilter.value,
      page: courseGroupStudentPage.value,
      page_size: CANDIDATE_PAGE_SIZE,
    })
    const incoming = page.items ?? []
    courseGroupStudentRows.value = courseGroupStudentPage.value === 1 ? incoming : [...courseGroupStudentRows.value, ...incoming]
    const loadedCount = courseGroupStudentRows.value.length
    courseGroupStudentHasMore.value = loadedCount < (page.total ?? 0)
    if (courseGroupStudentHasMore.value) {
      courseGroupStudentPage.value += 1
    }
  } catch (error) {
    courseGroupsError.value = error instanceof Error ? error.message : '加载可添加学生失败'
    courseGroupStudentHasMore.value = false
  } finally {
    courseGroupStudentLoading.value = false
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
    await Promise.all([resetCourseGroupClassCandidates(), resetCourseGroupStudentCandidates()])
  } catch (error) {
    courseGroupsError.value = error instanceof Error ? error.message : '添加班级失败'
  } finally {
    courseGroupActionLoading.value = false
  }
}

async function removeCourseGroupClass(classId: number) {
  if (!courseGroupWorkspaceCourse.value || activeCourseGroupId.value === null) {
    return
  }
  courseGroupActionLoading.value = true
  courseGroupsError.value = ''
  try {
    await api.removeCourseGroupClass(courseGroupWorkspaceCourse.value.id, activeCourseGroupId.value, classId)
    await refreshCourseGroups(activeCourseGroupId.value)
    await Promise.all([resetCourseGroupClassCandidates(), resetCourseGroupStudentCandidates()])
  } catch (error) {
    courseGroupsError.value = error instanceof Error ? error.message : '移除班级失败'
  } finally {
    courseGroupActionLoading.value = false
  }
}

function openRemoveCourseGroupClassModal(classId: number, className: string) {
  pendingRemoveCourseGroupMember.value = {
    type: 'class',
    id: classId,
    name: className,
  }
  removeCourseGroupMemberModalOpen.value = true
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
    await Promise.all([resetCourseGroupClassCandidates(), resetCourseGroupStudentCandidates()])
  } catch (error) {
    courseGroupsError.value = error instanceof Error ? error.message : '添加学生失败'
  } finally {
    courseGroupActionLoading.value = false
  }
}

async function removeCourseGroupStudent(studentId: number) {
  if (!courseGroupWorkspaceCourse.value || activeCourseGroupId.value === null) {
    return
  }
  courseGroupActionLoading.value = true
  courseGroupsError.value = ''
  try {
    await api.removeCourseGroupStudent(courseGroupWorkspaceCourse.value.id, activeCourseGroupId.value, studentId)
    await refreshCourseGroups(activeCourseGroupId.value)
    await Promise.all([resetCourseGroupClassCandidates(), resetCourseGroupStudentCandidates()])
  } catch (error) {
    courseGroupsError.value = error instanceof Error ? error.message : '移除学生失败'
  } finally {
    courseGroupActionLoading.value = false
  }
}

function openRemoveCourseGroupStudentModal(studentId: number, studentName: string) {
  pendingRemoveCourseGroupMember.value = {
    type: 'student',
    id: studentId,
    name: studentName,
  }
  removeCourseGroupMemberModalOpen.value = true
}

function closeRemoveCourseGroupMemberModal() {
  removeCourseGroupMemberModalOpen.value = false
  pendingRemoveCourseGroupMember.value = null
}

async function confirmRemoveCourseGroupMember() {
  if (!pendingRemoveCourseGroupMember.value) {
    return
  }
  const target = pendingRemoveCourseGroupMember.value
  if (target.type === 'class') {
    await removeCourseGroupClass(target.id)
  } else {
    await removeCourseGroupStudent(target.id)
  }
  if (!courseGroupsError.value) {
    closeRemoveCourseGroupMemberModal()
  }
}

function loadMoreCourseGroups() {
  visibleCourseGroupCount.value += GROUP_BATCH_SIZE
}

function loadMoreCourseGroupLessons() {
  visibleLessonCount.value += LESSON_BATCH_SIZE
}

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
  <section class="workspace-card user-manage-panel course-manage-panel">
    <Transition name="modal-float" appear>
      <div v-if="courseModalOpen" class="modal-backdrop modal-backdrop-contained">
        <article class="modal-card modal-card-narrow">
          <div class="wide-modal-header">
            <div class="wide-modal-header-top">
              <h3 class="wide-modal-header-title">{{ isEditingCourse ? '编辑课程信息' : '创建课程' }}</h3>
              <div class="wide-modal-header-actions">
                <button class="ghost-button compact-button" type="button" @click="emit('closeCourseModal')">关闭</button>
              </div>
            </div>
          </div>

          <div>
            <aside class="split-modal-side">
              <form class="form-grid single-column-form" @submit.prevent="emit('saveCourse')">
                <label class="field">
                  <span>学期</span>
                  <select v-model="courseForm.termId">
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
                  <span>教师</span>
                  <input v-model="courseForm.teacherName" />
                </label>
              </form>
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

    <Transition name="modal-float" appear>
      <div v-if="deleteCourseGroupModalOpen" class="modal-backdrop modal-backdrop-contained">
        <article class="modal-card modal-card-narrow">
          <div class="modal-header">
            <h3>确认删除课程组</h3>
            <button class="ghost-button compact-button modal-close" type="button" @click="closeDeleteCourseGroupModal">关闭</button>
          </div>
          <p class="hint">
            确定删除“{{ pendingDeleteCourseGroupName }}”吗？如果该课程组下已有考勤历史，将改为逻辑删除。
          </p>
          <div class="inline-actions">
            <button class="ghost-button" type="button" @click="closeDeleteCourseGroupModal">取消</button>
            <button class="ghost-button danger-button" type="button" :disabled="courseGroupActionLoading" @click="deleteCourseGroup">
              <span v-if="courseGroupActionLoading" class="button-spinner" aria-hidden="true"></span>
              <span>{{ courseGroupActionLoading ? '删除中...' : '确认删除' }}</span>
            </button>
          </div>
        </article>
      </div>
    </Transition>

    <Transition name="modal-float" appear>
      <div v-if="bulkDeleteCourseGroupModalOpen" class="modal-backdrop modal-backdrop-contained">
        <article class="modal-card modal-card-narrow">
          <div class="modal-header">
            <h3>确认批量删除课程组</h3>
            <button class="ghost-button compact-button modal-close" type="button" @click="closeBulkDeleteCourseGroupModal">关闭</button>
          </div>
          <p class="hint">确定删除已选中的 {{ selectedCourseGroupIds.length }} 个课程组吗？</p>
          <div class="inline-actions">
            <button class="ghost-button" type="button" @click="closeBulkDeleteCourseGroupModal">取消</button>
            <button class="ghost-button danger-button" type="button" :disabled="courseGroupActionLoading" @click="bulkDeleteCourseGroups">
              <span v-if="courseGroupActionLoading" class="button-spinner" aria-hidden="true"></span>
              <span>{{ courseGroupActionLoading ? '删除中...' : '确认删除' }}</span>
            </button>
          </div>
        </article>
      </div>
    </Transition>

    <Transition name="modal-float" appear>
      <div v-if="removeCourseGroupMemberModalOpen" class="modal-backdrop modal-backdrop-contained">
        <article class="modal-card modal-card-narrow">
          <div class="modal-header">
            <h3>确认移除</h3>
            <button class="ghost-button compact-button modal-close" type="button" @click="closeRemoveCourseGroupMemberModal">关闭</button>
          </div>
          <p class="hint">
            确定移除“{{ pendingRemoveCourseGroupMember?.name }}”吗？
          </p>
          <div class="inline-actions">
            <button class="ghost-button" type="button" @click="closeRemoveCourseGroupMemberModal">取消</button>
            <button class="ghost-button danger-button" type="button" :disabled="courseGroupActionLoading" @click="confirmRemoveCourseGroupMember">
              <span v-if="courseGroupActionLoading" class="button-spinner" aria-hidden="true"></span>
              <span>{{ courseGroupActionLoading ? '处理中...' : '确认移除' }}</span>
            </button>
          </div>
        </article>
      </div>
    </Transition>

    <Transition name="modal-float" appear>
      <div v-if="sessionModalOpen" class="modal-backdrop modal-backdrop-contained">
        <article class="modal-card modal-card-narrow">
          <div class="modal-header">
            <h3>{{ editingSessionId === null ? '创建课次' : '编辑课次' }}</h3>
            <button class="ghost-button compact-button modal-close" type="button" @click="closeSessionModal">关闭</button>
          </div>
          <form class="form-grid single-column-form" @submit.prevent="saveCourseGroupSession">
            <label class="field">
              <span>周次</span>
              <select v-model.number="courseGroupSessionForm.weekNo">
                <option v-for="weekNo in 16" :key="weekNo" :value="weekNo">第 {{ weekNo }} 周</option>
              </select>
            </label>
            <label class="field">
              <span>星期</span>
              <select v-model.number="courseGroupSessionForm.weekday">
                <option v-for="day in Object.entries(weekdayLabels)" :key="day[0]" :value="Number(day[0])">{{ day[1] }}</option>
              </select>
            </label>
            <label class="field">
              <span>时间节</span>
              <select v-model.number="courseGroupSessionForm.section">
                <option v-for="slot in Object.entries(sectionLabels)" :key="slot[0]" :value="Number(slot[0])">{{ slot[1] }}</option>
              </select>
            </label>
            <label class="field">
              <span>教学楼</span>
              <input v-model="courseGroupSessionForm.buildingName" />
            </label>
            <label class="field">
              <span>教室</span>
              <input v-model="courseGroupSessionForm.roomName" />
            </label>
            <button class="primary-button" type="submit" :disabled="courseGroupActionLoading">
              <span v-if="courseGroupActionLoading" class="button-spinner" aria-hidden="true"></span>
              <span>{{ courseGroupActionLoading ? '处理中...' : '保存' }}</span>
            </button>
          </form>
        </article>
      </div>
    </Transition>

    <Transition name="modal-float" appear>
      <div v-if="bulkDeleteLessonModalOpen" class="modal-backdrop modal-backdrop-contained">
        <article class="modal-card modal-card-narrow">
          <div class="modal-header">
            <h3>确认批量删除课次</h3>
            <button class="ghost-button compact-button modal-close" type="button" @click="closeBulkDeleteLessonModal">关闭</button>
          </div>
          <p class="hint">确定删除已选中的 {{ selectedLessonIds.length }} 个课次吗？</p>
          <div class="inline-actions">
            <button class="ghost-button" type="button" @click="closeBulkDeleteLessonModal">取消</button>
            <button class="ghost-button danger-button" type="button" :disabled="courseGroupActionLoading" @click="bulkDeleteCourseGroupSessions">
              <span v-if="courseGroupActionLoading" class="button-spinner" aria-hidden="true"></span>
              <span>{{ courseGroupActionLoading ? '删除中...' : '确认删除' }}</span>
            </button>
          </div>
        </article>
      </div>
    </Transition>

    <Transition name="subpage-fade" mode="out-in" appear>
    <div v-if="currentView === 'courses'" key="courses" class="course-manage-page">
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
        :active-filter-keys="[
          ...(courseFilters.grade.trim() ? ['grade'] : []),
          ...(courseFilters.courseName.trim() ? ['course_name'] : []),
          ...(courseFilters.teacherName.trim() ? ['teacher_name'] : []),
          ...(courseFilters.className.trim() ? ['class_names'] : []),
          ...(courseFilters.studentCount.trim() ? ['student_count'] : []),
        ]"
        :has-search-condition="!!(courseFilters.grade.trim() || courseFilters.courseName.trim() || courseFilters.teacherName.trim() || courseFilters.className.trim() || courseFilters.studentCount.trim() || (courseFilters.term && courseFilters.term !== termOptions[0]))"
        @update-page="emit('updateCoursePage', $event)"
        @update-page-size="emit('updateCoursePageSize', $event)"
        @toggle-row-selection="emit('toggleCourseSelection', Number($event))"
      >
        <template #filter-grade>
          <input v-model="courseFilters.grade" type="number" inputmode="numeric" aria-label="按年级筛选课程" />
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
        <template #filter-student_count>
          <input v-model="courseFilters.studentCount" type="number" inputmode="numeric" aria-label="按上课人数筛选课程" />
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
          <button class="ghost-button compact-button" type="button" :disabled="courseLoading || !row" @click="openCourseEditor(row as Record<string, unknown> | null)">编辑</button>
            <button class="ghost-button compact-button" type="button" :disabled="courseLoading || !row" @click="openCourseGroupsManager(row as Record<string, unknown> | null)">课程组管理</button>
            <button class="ghost-button compact-button danger-button" type="button" :disabled="!row" @click="openCourseDelete(row as Record<string, unknown> | null)">删除</button>
          </div>
        </template>
      </AdminDataList>
    </div>

    <div v-else-if="currentView === 'groups'" key="groups" class="course-subpage-grid">
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
        <p v-if="courseGroupsLoading" class="hint">正在加载课程组数据...</p>
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
          @toggle-row-selection="toggleCourseGroupSelection(Number($event))"
          @load-more="loadMoreCourseGroups"
        >
          <template #filter-actions>
            <button class="ghost-button compact-button" :class="{ selected: areAllCourseGroupsSelected }" type="button" @click="toggleCourseGroupPageSelection">
              全选
            </button>
            <button class="ghost-button compact-button danger-button" type="button" :disabled="courseGroupActionLoading || selectedCourseGroupIds.length === 0" @click="openBulkDeleteCourseGroupModal">
              批量删除
            </button>
            <button class="primary-button compact-button filter-action-push" type="button" :disabled="courseGroupActionLoading" @click="createCourseGroup">
              创建课程组
            </button>
          </template>
          <template #cell-class_names="{ value }">
            {{ Array.isArray(value) && value.length > 0 ? value.join('、') : '未绑定班级' }}
          </template>
        <template #actions="{ row }">
          <div class="inline-actions user-actions">
            <button class="ghost-button compact-button" type="button" @click="openCourseGroupLessons(asCourseGroupItem(row))">课次管理</button>
            <button class="ghost-button compact-button" type="button" @click="openCourseGroupStudents(asCourseGroupItem(row))">上课学生管理</button>
            <button class="ghost-button compact-button danger-button" type="button" @click="openDeleteCourseGroupModal(asCourseGroupItem(row))">删除</button>
          </div>
        </template>
      </AdminDataList>
      </section>
    </div>

    <div v-else-if="currentView === 'lessons'" key="lessons" class="course-subpage-grid">
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
          <p v-if="courseGroupsLoading" class="hint">正在加载课次数据...</p>
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
            :action-col-width="28"
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
            @toggle-row-selection="toggleLessonSelection(Number($event))"
            @toggle-page-selection="toggleLessonPageSelection"
            @load-more="loadMoreCourseGroupLessons"
          >
            <template #filter-session_no>
              <input v-model="lessonSessionNoFilter" type="number" inputmode="numeric" aria-label="按课次筛选课次列表" />
            </template>
            <template #filter-week_no>
              <input v-model="lessonWeekFilter" type="number" inputmode="numeric" aria-label="按上课周筛选课次" />
            </template>
            <template #filter-weekday>
              <select v-model="lessonWeekdayFilter" aria-label="按星期筛选课次">
                <option value="">全部</option>
                <option v-for="day in Object.entries(weekdayLabels)" :key="day[0]" :value="day[0]">{{ day[1] }}</option>
              </select>
            </template>
            <template #filter-section>
              <select v-model="lessonSectionFilter" aria-label="按时间节筛选课次">
                <option value="">全部</option>
                <option v-for="slot in Object.entries(sectionLabels)" :key="slot[0]" :value="slot[0]">{{ slot[1] }}</option>
              </select>
            </template>
            <template #filter-location>
              <input v-model="lessonLocationFilter" aria-label="按地点筛选课次" />
            </template>
            <template #filter-actions>
              <button class="ghost-button compact-button" :class="{ selected: areAllVisibleLessonsSelected }" type="button" @click="toggleLessonPageSelection">
                全选
              </button>
              <button class="ghost-button compact-button danger-button" type="button" :disabled="courseGroupActionLoading || selectedLessonIds.length === 0" @click="openBulkDeleteLessonModal">
                批量删除
              </button>
            </template>
            <template #cell-week_no="{ value }">第 {{ value }} 周</template>
            <template #cell-weekday="{ value }">{{ weekdayLabels[Number(value)] }}</template>
            <template #cell-section="{ value }">{{ sectionLabels[Number(value)] }}</template>
            <template #actions="{ row }">
              <div class="inline-actions user-actions">
                <button class="ghost-button compact-button" type="button" @click="openEditSessionModal(row as unknown as CourseGroupLessonItem)">编辑课次</button>
                <button class="ghost-button compact-button danger-button" type="button" @click="deleteCourseGroupSession(row as unknown as CourseGroupLessonItem)">删除</button>
              </div>
            </template>
          </AdminDataList>
        </div>

        <div class="course-lesson-create-card">
          <div class="section-heading">
            <strong>创建课次</strong>
          </div>
          <div class="course-lesson-create-form">
            <label class="field">
              <span>星期</span>
              <select v-model.number="courseGroupSessionForm.weekday">
                <option v-for="day in Object.entries(weekdayLabels)" :key="day[0]" :value="Number(day[0])">{{ day[1] }}</option>
              </select>
            </label>
            <label class="field">
              <span>时间节</span>
              <select v-model.number="courseGroupSessionForm.section">
                <option v-for="slot in Object.entries(sectionLabels)" :key="slot[0]" :value="Number(slot[0])">{{ slot[1] }}</option>
              </select>
            </label>
            <label class="field">
              <span>教学楼</span>
              <input v-model="courseGroupSessionForm.buildingName" />
            </label>
            <label class="field">
              <span>教室</span>
              <input v-model="courseGroupSessionForm.roomName" />
            </label>
          </div>
          <div class="course-lesson-week-picker">
            <div class="inline-actions">
              <button class="ghost-button compact-button" :class="{ selected: selectedCreateSessionPreset === 'all' }" type="button" @click="selectAllSessionWeeks">全周</button>
              <button class="ghost-button compact-button" :class="{ selected: selectedCreateSessionPreset === 'odd' }" type="button" @click="selectOddSessionWeeks">单周</button>
              <button class="ghost-button compact-button" :class="{ selected: selectedCreateSessionPreset === 'even' }" type="button" @click="selectEvenSessionWeeks">双周</button>
              <button class="ghost-button compact-button" :class="{ selected: selectedCreateSessionPreset === 'first-half' }" type="button" @click="selectFirstHalfSessionWeeks">上半学期</button>
              <button class="ghost-button compact-button" :class="{ selected: selectedCreateSessionPreset === 'second-half' }" type="button" @click="selectSecondHalfSessionWeeks">下半学期</button>
            </div>
            <div class="course-lesson-week-grid">
              <button
                v-for="weekNo in allSessionWeeks"
                :key="weekNo"
                class="ghost-button compact-button"
                :class="{ selected: selectedCreateSessionWeeks.includes(weekNo) }"
                type="button"
                @click="toggleCreateSessionWeek(weekNo)"
              >
                {{ weekNo }}
              </button>
            </div>
          </div>
          <div class="inline-actions">
            <button class="primary-button" type="button" :disabled="courseGroupActionLoading" @click="saveCourseGroupSession">
              <span v-if="courseGroupActionLoading" class="button-spinner" aria-hidden="true"></span>
              <span>{{ courseGroupActionLoading ? '添加中...' : '添加课次' }}</span>
            </button>
          </div>
        </div>
      </section>
    </div>

    <div v-else key="students" class="course-student-manage-layout">
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
                    @click="openRemoveCourseGroupClassModal(entry.classId, entry.label)"
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
                    <button class="ghost-button compact-button danger-button" type="button" :disabled="courseGroupActionLoading" @click="openRemoveCourseGroupStudentModal(student.student_id, student.student_name)">
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
                  <button class="ghost-button compact-button danger-button" type="button" :disabled="courseGroupActionLoading" @click="openRemoveCourseGroupStudentModal(entry.student.student_id, entry.student.student_name)">
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
                @load-more="loadMoreCourseGroupClasses"
              >
                <template #filter-class_name>
                  <AppInputSelect
                    v-model="courseGroupClassNameFilter"
                    :options="classNameOptions"
                    aria-label="按班级名称筛选可添加班级"
                  />
                </template>
                <template #actions="{ row }">
                  <div class="inline-actions user-actions">
                    <button class="ghost-button compact-button" type="button" :disabled="courseGroupActionLoading" @click="addCourseGroupClass(Number(row.id))">添加</button>
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
                @load-more="loadMoreCourseGroupStudents"
              >
                <template #filter-student_no>
                  <input v-model="courseGroupStudentNoFilter" inputmode="numeric" aria-label="按学号筛选可添加学生" />
                </template>
                <template #filter-student_name>
                  <input v-model="courseGroupStudentNameFilter" aria-label="按姓名筛选可添加学生" />
                </template>
                <template #filter-class_name>
                  <AppInputSelect
                    v-model="courseGroupStudentClassNameFilter"
                    :options="classNameOptions"
                    aria-label="按所属班级筛选可添加学生"
                  />
                </template>
                <template #actions="{ row }">
                  <div class="inline-actions user-actions">
                    <button class="ghost-button compact-button" type="button" :disabled="courseGroupActionLoading" @click="addCourseGroupStudent(Number(row.id))">添加</button>
                  </div>
                </template>
              </AdminDataList>
            </section>
          </div>
        </section>
      </section>
    </div>
    </Transition>
    <Teleport to="body">
      <div v-if="actionToast" class="toast-banner admin-data-list-copy-toast">{{ actionToast }}</div>
    </Teleport>
  </section>
</template>
