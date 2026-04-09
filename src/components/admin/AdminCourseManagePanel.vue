<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, ref, watch } from 'vue'

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
import AdminCourseLessonAttendanceDetail from './AdminCourseLessonAttendanceDetail.vue'
import type { AdminCourseManageProps } from './types'
import type { AdminAttendanceLogsOpenPayload, AdminCourseManageRouteView } from './shared-types'

const AdminCourseListView = defineAsyncComponent(() => import('./AdminCourseListView.vue'))
const AdminCourseGroupManageView = defineAsyncComponent(() => import('./AdminCourseGroupManageView.vue'))
const AdminCourseLessonManageView = defineAsyncComponent(() => import('./AdminCourseLessonManageView.vue'))
const AdminCourseStudentManageView = defineAsyncComponent(() => import('./AdminCourseStudentManageView.vue'))

type CourseManageView = AdminCourseManageRouteView
type CourseGroupLessonRow = CourseGroupLessonItem & {
  session_no: number
  location: string
}
type CourseWeekPreset = 'all' | 'odd' | 'even' | 'first-half' | 'second-half'

const props = defineProps<AdminCourseManageProps & {
  courseManageRouteView?: CourseManageView
  courseManageRouteCourseId?: number | null
  courseManageRouteGroupId?: number | null
  courseManageRouteLessonId?: number | null
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
  updateCourseManageRoute: [payload: { view: CourseManageView; courseId?: number | null; groupId?: number | null; lessonId?: number | null }]
  openAttendanceLogs: [payload: AdminAttendanceLogsOpenPayload]
}>()

const GROUP_BATCH_SIZE = 100
const LESSON_BATCH_SIZE = 100
const CANDIDATE_PAGE_SIZE = 100

const currentView = ref<CourseManageView>(props.courseManageRouteView ?? 'courses')
const syncingRouteState = ref(false)
const classNameOptions = computed(() =>
  Array.from(new Set(props.allClasses.map((item) => item.class_name.trim()).filter((item) => item.length > 0))).sort((left, right) =>
    left.localeCompare(right, 'zh-Hans-CN'),
  ),
)

const courseGroupWorkspaceCourse = ref<CourseItem | null>(null)
const courseGroups = ref<CourseGroupItem[]>([])
const courseGroupsLoading = ref(false)
const courseGroupActionLoading = ref(false)
const courseGroupsError = ref('')
const selectedCourseGroupIds = ref<number[]>([])
const activeCourseGroupId = ref<number | null>(null)
const activeCourseGroupDetail = ref<CourseGroupDetail | null>(null)
const activeAttendanceLessonId = ref<number | null>(null)
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
const suppressCourseGroupCandidateFilterWatch = ref(false)
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
    if (sessionNoKeyword && !String(item.session_no).includes(sessionNoKeyword)) {
      return false
    }
    if (lessonWeekFilter.value && !String(item.week_no).includes(lessonWeekFilter.value)) {
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
const termStartMap = computed(() => new Map(props.courseTerms.map((item) => [item.name, item.term_start_date])))

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

const activeCourseGroupLesson = computed(() =>
  courseGroupLessonRows.value.find((item) => item.id === activeAttendanceLessonId.value) ?? null,
)

const activeLessonDate = computed(() => {
  if (!activeCourseGroupLesson.value || !courseGroupWorkspaceCourse.value) {
    return '-'
  }
  return formatLessonDate(courseGroupWorkspaceCourse.value.term, activeCourseGroupLesson.value.week_no, activeCourseGroupLesson.value.weekday) || '-'
})

const activeLessonTime = computed(() => {
  if (!activeCourseGroupLesson.value) {
    return '-'
  }
  return sectionLabels[activeCourseGroupLesson.value.section] ?? `第 ${activeCourseGroupLesson.value.section} 节`
})

const activeLessonLocation = computed(() => {
  if (!activeCourseGroupLesson.value) {
    return '-'
  }
  return `${activeCourseGroupLesson.value.building_name}-${activeCourseGroupLesson.value.room_name}`
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
  () => courseGroupClassNameFilter.value,
  async () => {
    if (suppressCourseGroupCandidateFilterWatch.value || currentView.value !== 'students' || activeCourseGroupId.value === null) {
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
    if (suppressCourseGroupCandidateFilterWatch.value || currentView.value !== 'students' || activeCourseGroupId.value === null) {
      return
    }
    await resetCourseGroupStudentCandidates()
  },
)

watch(
  () => [props.courseManageRouteView, props.courseManageRouteCourseId, props.courseManageRouteGroupId, props.courseManageRouteLessonId],
  async ([view, routeCourseId, routeGroupId, routeLessonId]) => {
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
      const targetLessonId = routeLessonId ? Number(routeLessonId) : null
      const existingCourse = courseGroupWorkspaceCourse.value?.id === targetCourseId ? courseGroupWorkspaceCourse.value : null
      const matchedCourse = safeCourses.value.find((item) => item.id === targetCourseId) ?? null
      const course = existingCourse ?? matchedCourse ?? await api.getCourseSummary(targetCourseId)
      if (!course) {
        return
      }
      const shouldReloadWorkspace =
        courseGroupWorkspaceCourse.value?.id !== targetCourseId ||
        (normalizedView === 'groups' && currentView.value === 'courses') ||
        ((normalizedView === 'lessons' || normalizedView === 'students' || normalizedView === 'attendance-detail') && activeCourseGroupId.value !== targetGroupId)
      if (shouldReloadWorkspace) {
        await openCourseGroupPage(course, normalizedView, targetGroupId, targetLessonId)
        return
      }
      if (normalizedView === 'groups') {
        closeSessionModal()
        activeAttendanceLessonId.value = null
        currentView.value = 'groups'
        return
      }
      if (normalizedView === 'lessons') {
        activeAttendanceLessonId.value = null
        currentView.value = 'lessons'
        return
      }
      if (normalizedView === 'attendance-detail') {
        activeAttendanceLessonId.value = targetLessonId
        currentView.value = 'attendance-detail'
        return
      }
      if (normalizedView === 'students') {
        activeAttendanceLessonId.value = null
        currentView.value = normalizedView
      }
    } finally {
      syncingRouteState.value = false
    }
  },
  { immediate: true },
)

function syncCourseManageRoute(view: CourseManageView, courseId: number | null = null, groupId: number | null = null, lessonId: number | null = null) {
  if (syncingRouteState.value) {
    return
  }
  emit('updateCourseManageRoute', {
    view,
    courseId,
    groupId: view === 'lessons' || view === 'attendance-detail' || view === 'students' ? groupId : null,
    lessonId: view === 'attendance-detail' ? lessonId : null,
  })
}

function openCourseGroupsManagerByItem(item: CourseItem) {
  void openCourseGroupPage(item)
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

async function openCourseGroupPage(
  item: CourseItem,
  targetView: CourseManageView = 'groups',
  targetGroupId: number | null = null,
  targetLessonId: number | null = null,
) {
  courseGroupsLoading.value = true
  courseGroupsError.value = ''
  courseGroupWorkspaceCourse.value = item
  currentView.value = targetView
  activeAttendanceLessonId.value = targetView === 'attendance-detail' ? targetLessonId : null
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
    if (targetView === 'lessons' || targetView === 'attendance-detail' || targetView === 'students') {
      if (targetView === 'students') {
        await resetCourseGroupCandidateFilters()
      }
      currentView.value = targetView
      if (targetView === 'students') {
        await Promise.all([resetCourseGroupClassCandidates(), resetCourseGroupStudentCandidates()])
      }
      syncCourseManageRoute(
        targetView,
        courseGroupWorkspaceCourse.value?.id ?? item.id,
        activeCourseGroupId.value,
        targetLessonId,
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
  activeAttendanceLessonId.value = null
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
}

async function openCourseGroupLessons(group: CourseGroupItem) {
  if (!courseGroupWorkspaceCourse.value) {
    return
  }
  courseGroupsLoading.value = true
  courseGroupsError.value = ''
  try {
    await loadCourseGroupDetail(courseGroupWorkspaceCourse.value.id, group.id)
    activeAttendanceLessonId.value = null
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
    activeAttendanceLessonId.value = null
    await resetCourseGroupCandidateFilters()
    currentView.value = 'students'
    await Promise.all([resetCourseGroupClassCandidates(), resetCourseGroupStudentCandidates()])
    syncCourseManageRoute('students', courseGroupWorkspaceCourse.value.id, group.id)
  } catch (error) {
    courseGroupsError.value = error instanceof Error ? error.message : '加载上课学生失败'
  } finally {
    courseGroupsLoading.value = false
  }
}

function openCourseGroupLessonAttendanceDetail(session: CourseGroupLessonItem) {
  if (!courseGroupWorkspaceCourse.value || activeCourseGroupId.value === null) {
    return
  }
  activeAttendanceLessonId.value = session.id
  currentView.value = 'attendance-detail'
  syncCourseManageRoute('attendance-detail', courseGroupWorkspaceCourse.value.id, activeCourseGroupId.value, session.id)
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

function openCreateSessionModal() {
  editingSessionId.value = null
  sessionHistoryHint.value = ''
  resetCreateSessionForm()
  sessionModalOpen.value = true
}

function closeSessionModal() {
  sessionModalOpen.value = false
  editingSessionId.value = null
  sessionHistoryHint.value = ''
  resetCreateSessionForm()
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
    closeSessionModal()
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

async function resetCourseGroupCandidateFilters() {
  suppressCourseGroupCandidateFilterWatch.value = true
  courseGroupClassNameFilter.value = ''
  courseGroupStudentNoFilter.value = ''
  courseGroupStudentNameFilter.value = ''
  courseGroupStudentClassNameFilter.value = ''
  await nextTick()
  suppressCourseGroupCandidateFilterWatch.value = false
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

function formatLessonDate(term: string, weekNo: number, weekday: number) {
  const termStart = termStartMap.value.get(term)
  if (!termStart) {
    return ''
  }
  const date = parseDate(termStart)
  if (!date) {
    return ''
  }
  date.setDate(date.getDate() + (weekNo - 1) * 7 + (weekday - 1))
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map((item) => Number(item))
  if (!year || !month || !day) {
    return null
  }
  return new Date(year, month - 1, day)
}

function pad(value: number) {
  return String(value).padStart(2, '0')
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
            <h3>{{ editingSessionId === null ? '创建课次' : '编辑课次信息' }}</h3>
            <button class="ghost-button compact-button modal-close" type="button" @click="closeSessionModal">关闭</button>
          </div>
          <form class="form-grid single-column-form" @submit.prevent="saveCourseGroupSession">
            <label v-if="editingSessionId !== null" class="field">
              <span>上课周</span>
              <select v-model.number="courseGroupSessionForm.weekNo">
                <option v-for="weekNo in 16" :key="weekNo" :value="weekNo">第 {{ weekNo }} 周</option>
              </select>
            </label>
            <div class="course-session-form-row">
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
            </div>
            <div class="course-session-form-row">
              <label class="field">
                <span>教学楼</span>
                <input v-model="courseGroupSessionForm.buildingName" />
              </label>
              <label class="field">
                <span>教室</span>
                <input v-model="courseGroupSessionForm.roomName" />
              </label>
            </div>
            <div v-if="editingSessionId === null" class="course-lesson-week-picker">
              <div class="inline-actions course-lesson-week-shortcuts">
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
    <AdminCourseListView
      v-if="currentView === 'courses'"
      key="courses"
      :courses="courses"
      :all-classes="allClasses"
      :course-terms="courseTerms"
      :course-filters="courseFilters"
      :selected-course-ids="selectedCourseIds"
      :course-deleting="courseDeleting"
      :course-loading="courseLoading"
      :course-page="coursePage"
      :course-page-size="coursePageSize"
      :course-total-pages="courseTotalPages"
      :course-total-items="courseTotalItems"
      :course-all-items="courseAllItems"
      :course-page-options="coursePageOptions"
      :course-focus-row-key="courseFocusRowKey"
      :course-focus-token="courseFocusToken"
      @open-create-course-modal="emit('openCreateCourseModal')"
      @open-edit-course-modal="emit('openEditCourseModal', $event)"
      @open-delete-course-modal="emit('openDeleteCourseModal', $event)"
      @open-course-groups-manager="openCourseGroupsManagerByItem($event)"
      @open-bulk-delete-course-modal="emit('openBulkDeleteCourseModal')"
      @update-course-page="emit('updateCoursePage', $event)"
      @update-course-page-size="emit('updateCoursePageSize', $event)"
      @toggle-course-selection="emit('toggleCourseSelection', $event)"
      @toggle-course-page-selection="emit('toggleCoursePageSelection')"
    />

    <AdminCourseGroupManageView
      v-else-if="currentView === 'groups'"
      key="groups"
      :loading="courseGroupsLoading"
      :parent-course-summary="parentCourseSummary"
      :visible-course-groups="visibleCourseGroups"
      :course-groups="courseGroups"
      :selected-course-group-ids="selectedCourseGroupIds"
      :are-all-course-groups-selected="areAllCourseGroupsSelected"
      :course-group-action-loading="courseGroupActionLoading"
      @toggle-course-group-selection="toggleCourseGroupSelection($event)"
      @toggle-course-group-page-selection="toggleCourseGroupPageSelection"
      @open-bulk-delete-course-group-modal="openBulkDeleteCourseGroupModal"
      @create-course-group="createCourseGroup"
      @load-more-course-groups="loadMoreCourseGroups"
      @open-course-group-lessons="openCourseGroupLessons($event)"
      @open-course-group-students="openCourseGroupStudents($event)"
      @open-delete-course-group-modal="openDeleteCourseGroupModal($event)"
    />

    <AdminCourseLessonManageView
      v-else-if="currentView === 'lessons'"
      key="lessons"
      :parent-course-summary="parentCourseSummary"
      :active-course-group-summary="activeCourseGroupSummary"
      :loading="courseGroupsLoading"
      :visible-course-group-lessons="visibleCourseGroupLessons"
      :filtered-course-group-lessons="filteredCourseGroupLessons"
      :course-group-lesson-rows="courseGroupLessonRows"
      :selected-lesson-ids="selectedLessonIds"
      :are-all-visible-lessons-selected="areAllVisibleLessonsSelected"
      :course-group-action-loading="courseGroupActionLoading"
      :lesson-session-no-filter="lessonSessionNoFilter"
      :lesson-week-filter="lessonWeekFilter"
      :lesson-weekday-filter="lessonWeekdayFilter"
      :lesson-section-filter="lessonSectionFilter"
      :lesson-location-filter="lessonLocationFilter"
      @update:lesson-session-no-filter="lessonSessionNoFilter = $event"
      @update:lesson-week-filter="lessonWeekFilter = $event"
      @update:lesson-weekday-filter="lessonWeekdayFilter = $event"
      @update:lesson-section-filter="lessonSectionFilter = $event"
      @update:lesson-location-filter="lessonLocationFilter = $event"
      @toggle-lesson-selection="toggleLessonSelection($event)"
      @toggle-lesson-page-selection="toggleLessonPageSelection"
      @load-more-course-group-lessons="loadMoreCourseGroupLessons"
      @open-bulk-delete-lesson-modal="openBulkDeleteLessonModal"
      @open-create-session-modal="openCreateSessionModal"
      @open-course-group-lesson-attendance-detail="openCourseGroupLessonAttendanceDetail($event)"
      @open-edit-session-modal="openEditSessionModal($event)"
      @delete-course-group-session="deleteCourseGroupSession($event)"
    />

    <div v-else-if="currentView === 'attendance-detail'" key="attendance-detail">
      <AdminCourseLessonAttendanceDetail
        v-if="activeCourseGroupLesson && activeCourseGroup && courseGroupWorkspaceCourse"
        :session-id="activeCourseGroupLesson.id"
        :session-date="activeLessonDate"
        :session-time="activeLessonTime"
        :location="activeLessonLocation"
        :class-summary="formatClassNameListMultiline(activeCourseGroup.class_names)"
        :student-count="activeCourseGroup.student_count"
        :course-name="courseGroupWorkspaceCourse.course_name"
        :teacher-name="courseGroupWorkspaceCourse.teacher_name"
        :grade="courseGroupWorkspaceCourse.grade"
        :term="courseGroupWorkspaceCourse.term"
        @open-attendance-logs="emit('openAttendanceLogs', $event)"
      />

      <template v-else>
        <div class="course-subpage-grid">
          <aside class="workspace-card course-context-card">
            <div class="settings-profile-summary-list">
              <div class="workspace-card nested-context-card">
                <div class="section-heading section-heading-compact">
                  <strong>课次</strong>
                </div>
                <p class="hint">{{ courseGroupsLoading ? '正在加载课次考勤明细...' : '未找到对应课次。' }}</p>
              </div>
            </div>
          </aside>
          <section class="workspace-card course-subpage-main">
            <p class="hint">{{ courseGroupsLoading ? '正在加载课次考勤明细...' : '未找到对应课次。' }}</p>
          </section>
        </div>
      </template>
    </div>

    <AdminCourseStudentManageView
      v-else
      key="students"
      :active-course-group-id="activeCourseGroupId"
      :parent-course-summary="parentCourseSummary"
      :active-course-group-summary="activeCourseGroupSummary"
      :course-group-student-entries="courseGroupStudentEntries"
      :course-group-action-loading="courseGroupActionLoading"
      :course-group-class-rows="courseGroupClassRows"
      :course-group-student-rows="courseGroupStudentRows"
      :course-group-class-has-more="courseGroupClassHasMore"
      :course-group-student-has-more="courseGroupStudentHasMore"
      :course-group-class-loading="courseGroupClassLoading"
      :course-group-student-loading="courseGroupStudentLoading"
      :course-group-class-name-filter="courseGroupClassNameFilter"
      :course-group-student-no-filter="courseGroupStudentNoFilter"
      :course-group-student-name-filter="courseGroupStudentNameFilter"
      :course-group-student-class-name-filter="courseGroupStudentClassNameFilter"
      :class-name-options="classNameOptions"
      @update:course-group-class-name-filter="courseGroupClassNameFilter = $event"
      @update:course-group-student-no-filter="courseGroupStudentNoFilter = $event"
      @update:course-group-student-name-filter="courseGroupStudentNameFilter = $event"
      @update:course-group-student-class-name-filter="courseGroupStudentClassNameFilter = $event"
      @load-more-course-group-classes="loadMoreCourseGroupClasses"
      @load-more-course-group-students="loadMoreCourseGroupStudents"
      @add-course-group-class="addCourseGroupClass($event)"
      @add-course-group-student="addCourseGroupStudent($event)"
      @open-remove-course-group-class-modal="openRemoveCourseGroupClassModal($event.classId, $event.className)"
      @open-remove-course-group-student-modal="openRemoveCourseGroupStudentModal($event.studentId, $event.studentName)"
    />
    </Transition>
    <Teleport to="body">
      <div v-if="actionToast" class="toast-banner admin-data-list-copy-toast">{{ actionToast }}</div>
    </Teleport>
  </section>
</template>
