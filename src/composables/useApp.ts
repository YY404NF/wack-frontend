import { computed, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  api,
  type AdminOperationLogItem,
  type AttendanceDetailLogItem,
  type AttendanceCheckDetail,
  type AttendanceResultItem,
  type AvailableCourseItem,
  type ClassItem,
  type ClassStudentCandidateItem,
  type ClassStudentItem,
  type CourseDetail,
  type CourseCalendarItem,
  type CourseItem,
  type DashboardSummary,
  type FreeTimeItem,
  type SessionUser,
  type SystemSetting,
  type UserItem,
} from '../api'
import { adminTabKeys, studentTabKeys, type AppTab } from '../constants'
import type { AdminWorkspaceProps } from '../components/admin/types'
import {
  createClassFilters,
  createClassForm,
  createClassStudentFilters,
  createClassStudentForm,
  createCourseFilters,
  createCourseForm,
  createAttendanceLogFilters,
  createFreeTimeForm,
  createLoginForm,
  createPasswordForm,
  createProfileForm,
  createSetupForm,
  createSystemLogFilters,
  createUserFilters,
  createUserForm,
  createUserPasswordForm,
} from './app/forms'
import { FREE_TIME_VISIBLE_SECTIONS, FREE_TIME_VISIBLE_WEEKDAYS, buildFreeTimeCellKey, getCurrentAcademicTerm, parseFreeWeeks } from '../utils/free-time'
import { usePagedCollection } from './app/usePagedCollection'
import { useSessionFlow } from './app/useSessionFlow'
import { useSelection } from './app/useSelection'
import { useStudentApp } from './useStudentApp'

type AdminAppInstance = ReturnType<(typeof import('./useAdminApp'))['useAdminApp']>

export function useApp() {
  const router = useRouter()
  const route = useRoute()

  const loginForm = reactive(createLoginForm())

  const setupForm = reactive(createSetupForm())

  const passwordForm = reactive(createPasswordForm())

  const profileForm = reactive(createProfileForm())

  const userPasswordForm = reactive(createUserPasswordForm())

  const freeTimeForm = reactive(createFreeTimeForm())

  const userForm = reactive(createUserForm())

  const userFilters = reactive(createUserFilters())

  const classForm = reactive(createClassForm())
  const classStudentForm = reactive(createClassStudentForm())
  const editingClassStudentForm = reactive(createClassStudentForm())

  const classFilters = reactive(createClassFilters())
  const classStudentFilters = reactive(createClassStudentFilters())
  const logFilters = reactive(createSystemLogFilters())
  const attendanceLogFilters = reactive(createAttendanceLogFilters())

  const courseFilters = reactive(createCourseFilters())
  const courseForm = reactive(createCourseForm())

  const me = ref<SessionUser | null>(null)
  const authLoading = ref(false)
  const setupLoading = ref(false)
  const userSaving = ref(false)
  const passwordResetting = ref(false)
  const profileSaving = ref(false)
  const courseLoading = ref(false)
  const courseSaving = ref(false)
  const courseImporting = ref(false)
  const courseDeleting = ref(false)
  const classSaving = ref(false)
  const classDeleting = ref(false)
  const userStatusUpdating = ref(false)
  const classStudentSaving = ref(false)
  const classStudentImporting = ref(false)
  const courseStudentLoading = ref(false)
  const courseStudentSaving = ref(false)
  const passwordSaving = ref(false)
  const freeTimeSaving = ref(false)
  const userFreeTimeLoading = ref(false)
  const userFreeTimeSaving = ref(false)
  const systemSettingSaving = ref(false)
  const attendanceCompleting = ref(false)
  const booting = ref(true)
  const initialized = ref(true)

  const setupError = ref('')
  const loginError = ref('')
  const adminError = ref('')
  const studentError = ref('')
  const adminToast = ref('')
  const studentToast = ref('')

  const users = ref<UserItem[]>([])
  const classes = ref<ClassItem[]>([])
  const courseStudentCandidates = ref<ClassStudentCandidateItem[]>([])
  const classStudents = ref<ClassStudentItem[]>([])
  const courses = ref<CourseItem[]>([])
  const courseCalendar = ref<CourseCalendarItem[]>([])
  const dashboard = ref<DashboardSummary | null>(null)
  const attendanceResults = ref<AttendanceResultItem[]>([])
  const freeTimes = ref<FreeTimeItem[]>([])
  const logs = ref<AdminOperationLogItem[]>([])
  const attendanceLogs = ref<AttendanceDetailLogItem[]>([])
  const availableCourses = ref<AvailableCourseItem[]>([])
  const activeCheck = ref<AttendanceCheckDetail | null>(null)
  const systemSettings = ref<SystemSetting | null>(null)

  const editingFreeTimeId = ref<number | null>(null)
  const editingUserStudentId = ref('')
  const editingCourseId = ref<number | null>(null)
  const editingClassId = ref<number | null>(null)
  const editingClassStudentId = ref<number | null>(null)
  const classStudentTargetClassId = ref<number | null>(null)
  const courseStudentTargetCourseId = ref<number | null>(null)
  const courseStudentTargetName = ref('')
  const courseStudentSelectedClassIds = ref<number[]>([])
  const courseStudentSelectedStudentIds = ref<string[]>([])
  const courseStudentClassStudentMap = ref<Record<number, ClassStudentItem[]>>({})
  const courseStudentLooseStudents = ref<Array<{ student_id: string; real_name: string }>>([])
  const passwordTargetStudentId = ref('')
  const passwordTargetName = ref('')
  const freeTimeTargetName = ref('')
  const freeTimeTargetStudentId = ref('')
  const userFreeTimeTerm = ref(getCurrentAcademicTerm())
  const userFreeTimeItems = ref<FreeTimeItem[]>([])
  const userFreeTimeDraft = ref<Record<string, number[]>>({})
  const deletingCourseId = ref<number | null>(null)
  const deletingCourseName = ref('')
  const deletingClassId = ref<number | null>(null)
  const deletingClassName = ref('')
  const classStudentTargetName = ref('')
  const selectedStudentId = ref<number | null>(null)
  const studentCoreLoaded = ref(false)
  const studentFreeTimesLoaded = ref(false)
  const studentActiveCheckLoaded = ref(false)

  const userModalOpen = ref(false)
  const courseModalOpen = ref(false)
  const classModalOpen = ref(false)
  const classStudentModalOpen = ref(false)
  const courseStudentModalOpen = ref(false)
  const deleteCourseModalOpen = ref(false)
  const deleteClassModalOpen = ref(false)
  const bulkDeleteCourseModalOpen = ref(false)
  const bulkDeleteClassModalOpen = ref(false)
  const passwordModalOpen = ref(false)
  const profileModalOpen = ref(false)
  const userPasswordModalOpen = ref(false)
  const userFreeTimeModalOpen = ref(false)
  const activeTab = ref<AppTab>('overview')

  const studentSegmentToTab = {
    home: 'home',
    check: 'student',
    settings: 'settings',
  } as const

  const tabToStudentSegment: Record<'home' | 'student' | 'settings', keyof typeof studentSegmentToTab> = {
    home: 'home',
    student: 'check',
    settings: 'settings',
  }

  function defaultTabForRole(role?: number): AppTab {
    return role === 1 ? 'overview' : 'home'
  }

  function tabAllowedForRole(tab: string, role?: number): tab is AppTab {
    if (!role) {
      return false
    }
    return role === 1
      ? (adminTabKeys as readonly string[]).includes(tab)
      : (studentTabKeys as readonly string[]).includes(tab)
  }

  function readTabFromLocation() {
    if (route.name === 'admin') {
      const segment = typeof route.params.tab === 'string' ? route.params.tab : ''
      if ((adminTabKeys as readonly string[]).includes(segment)) {
        return segment
      }
      return null
    }

    if (route.name === 'student') {
      const segment = typeof route.params.tab === 'string' ? route.params.tab : ''
      return studentSegmentToTab[segment as keyof typeof studentSegmentToTab] ?? null
    }

    return null
  }

  async function writeTabToLocation(tab: AppTab, mode: 'push' | 'replace' = 'replace') {
    if (me.value?.role === 1 && (adminTabKeys as readonly string[]).includes(tab)) {
      await router[mode]({ name: 'admin', params: { tab } })
      return
    }

    if (me.value?.role === 2 && (studentTabKeys as readonly string[]).includes(tab)) {
      await router[mode]({ name: 'student', params: { tab: tabToStudentSegment[tab as keyof typeof tabToStudentSegment] } })
    }
  }

  async function setActiveTab(tab: AppTab, mode: 'push' | 'replace' = 'replace') {
    activeTab.value = tab
    await writeTabToLocation(tab, mode)
    if (me.value?.role !== 2) {
      return
    }
    if (tab === 'settings') {
      void ensureStudentFreeTimesLoaded()
    }
    if (tab === 'student') {
      void ensureStudentActiveCheckLoaded()
    }
  }

  function resolveTabForRole(role?: number): AppTab {
    const tab = readTabFromLocation()
    if (tab && tabAllowedForRole(tab, role)) {
      return tab
    }
    return defaultTabForRole(role)
  }

  const adminStats = computed(() => {
    if (!dashboard.value) {
      return []
    }
    return [
      { label: '签到', value: dashboard.value.present, tone: 'good' },
      { label: '迟到', value: dashboard.value.late, tone: 'warn' },
      { label: '缺勤', value: dashboard.value.absent, tone: 'bad' },
      { label: '请假', value: dashboard.value.leave, tone: 'calm' },
      { label: '未设置', value: dashboard.value.unset, tone: 'muted' },
    ]
  })

  const isAdmin = computed(() => me.value?.role === 1)
  const isStudent = computed(() => me.value?.role === 2)
  const currentUserId = computed(() => me.value?.id)
  const isEditingUser = computed(() => editingUserStudentId.value.length > 0)
  const isEditingClass = computed(() => editingClassId.value !== null)
  const userFreeTimeTermOptions = computed(() => {
    const terms = new Set<string>([userFreeTimeTerm.value, getCurrentAcademicTerm()])
    for (const item of userFreeTimeItems.value) {
      terms.add(item.term)
    }
    return Array.from(terms).filter(Boolean).sort((left, right) => right.localeCompare(left, 'zh-Hans-CN'))
  })

  const usersView = usePagedCollection({
    source: users,
    predicate: (user) => {
      const byStudentId = !userFilters.studentId || user.student_id.includes(userFilters.studentId.trim())
      const byRealName = !userFilters.realName || user.real_name.includes(userFilters.realName.trim())
      const byRole = !userFilters.role || String(user.role) === userFilters.role
      const byStatus = !userFilters.status || String(user.status) === userFilters.status
      return byStudentId && byRealName && byRole && byStatus
    },
    resetDeps: () => [userFilters.studentId, userFilters.realName, userFilters.role, userFilters.status],
  })
  const classesView = usePagedCollection({
    source: classes,
    predicate: (item) => {
      const byGrade = !classFilters.grade || String(item.grade) === classFilters.grade
      const byMajor = !classFilters.majorName || item.major_name === classFilters.majorName
      const byName = !classFilters.className || item.class_name.includes(classFilters.className.trim())
      return byGrade && byMajor && byName
    },
    resetDeps: () => [classFilters.grade, classFilters.majorName, classFilters.className],
  })
  const coursesView = usePagedCollection({
    source: courses,
    predicate: (item) => {
      const byTerm = !courseFilters.term || item.term === courseFilters.term
      const byCourseName = !courseFilters.courseName || item.course_name.includes(courseFilters.courseName.trim())
      const byTeacher = !courseFilters.teacherName || item.teacher_name.includes(courseFilters.teacherName.trim())
      const byClass = !courseFilters.classId || item.class_ids.includes(Number(courseFilters.classId))
      return byTerm && byCourseName && byTeacher && byClass
    },
    resetDeps: () => [courseFilters.term, courseFilters.courseName, courseFilters.teacherName, courseFilters.classId],
  })
  const logsView = usePagedCollection({
    source: logs,
    predicate: (item) => {
      const byOperator = !logFilters.operatorStudentId || item.operator_student_id.includes(logFilters.operatorStudentId.trim())
      const byTargetTable = !logFilters.targetTable || item.target_table.includes(logFilters.targetTable.trim())
      const byActionType = !logFilters.actionType || item.action_type.includes(logFilters.actionType.trim())
      const byTargetId = !logFilters.targetId || String(item.target_id).includes(logFilters.targetId.trim())
      const byKeyword = !logFilters.keyword || (item.new_value ?? '').includes(logFilters.keyword.trim())
      const byDate = !logFilters.createdDate || item.created_at.startsWith(logFilters.createdDate)
      return byOperator && byTargetTable && byActionType && byTargetId && byKeyword && byDate
    },
    resetDeps: () => [logFilters.operatorStudentId, logFilters.targetTable, logFilters.actionType, logFilters.targetId, logFilters.keyword, logFilters.createdDate],
  })
  const attendanceLogsView = usePagedCollection({
    source: attendanceLogs,
    predicate: (item) => {
      const byStudent = !attendanceLogFilters.studentId || item.student_id.includes(attendanceLogFilters.studentId.trim())
      const byOperator = !attendanceLogFilters.operatorStudentId || item.operator_student_id.includes(attendanceLogFilters.operatorStudentId.trim())
      const byType = !attendanceLogFilters.operationType || item.operation_type.includes(attendanceLogFilters.operationType.trim())
      const byStatus = !attendanceLogFilters.newStatus || String(item.new_status) === attendanceLogFilters.newStatus
      const byDate = !attendanceLogFilters.operatedDate || item.operated_at.startsWith(attendanceLogFilters.operatedDate)
      return byStudent && byOperator && byType && byStatus && byDate
    },
    resetDeps: () => [attendanceLogFilters.studentId, attendanceLogFilters.operatorStudentId, attendanceLogFilters.operationType, attendanceLogFilters.newStatus, attendanceLogFilters.operatedDate],
  })

  const filteredClassStudents = computed(() =>
    classStudents.value.filter((item) => {
      const byStudentId = !classStudentFilters.studentId || item.student_id.includes(classStudentFilters.studentId.trim())
      const byRealName = !classStudentFilters.realName || item.real_name.includes(classStudentFilters.realName.trim())
      return byStudentId && byRealName
    }),
  )

  const userPage = usersView.page
  const userPageSize = usersView.pageSize
  const coursePage = coursesView.page
  const coursePageSize = coursesView.pageSize
  const classPage = classesView.page
  const classPageSize = classesView.pageSize
  const logsPage = logsView.page
  const logsPageSize = logsView.pageSize
  const attendanceLogsPage = attendanceLogsView.page
  const attendanceLogsPageSize = attendanceLogsView.pageSize

  const userTotalPages = usersView.totalPages
  const courseTotalPages = coursesView.totalPages
  const classTotalPages = classesView.totalPages
  const logsTotalPages = logsView.totalPages
  const attendanceLogsTotalPages = attendanceLogsView.totalPages

  const paginatedUsers = usersView.paginatedItems
  const paginatedCourses = coursesView.paginatedItems
  const paginatedClasses = classesView.paginatedItems
  const paginatedLogs = logsView.paginatedItems
  const paginatedAttendanceLogs = attendanceLogsView.paginatedItems

  const courseSelection = useSelection({
    allItems: courses,
    pageItems: paginatedCourses,
    getId: (item) => item.id,
  })
  const classSelection = useSelection({
    allItems: classes,
    pageItems: paginatedClasses,
    getId: (item) => item.id,
  })
  const userSelection = useSelection({
    allItems: users,
    pageItems: paginatedUsers,
    getId: (item) => item.student_id,
    canSelect: (item) => item.id !== currentUserId.value,
  })

  const selectedCourseIds = courseSelection.selectedIds
  const selectedClassIds = classSelection.selectedIds
  const selectedUserStudentIds = userSelection.selectedIds

  const courseStudentSelectedStudents = computed(() => {
    const realNameByStudentId = new Map<string, string>()
    for (const item of courseStudentCandidates.value) {
      realNameByStudentId.set(item.student_id, item.real_name)
    }
    for (const students of Object.values(courseStudentClassStudentMap.value)) {
      for (const student of students) {
        realNameByStudentId.set(student.student_id, student.real_name)
      }
    }
    for (const student of courseStudentLooseStudents.value) {
      realNameByStudentId.set(student.student_id, student.real_name)
    }
    return courseStudentSelectedStudentIds.value.map((studentId) => ({
      student_id: studentId,
      real_name: realNameByStudentId.get(studentId) ?? studentId,
    }))
  })

  function clearAdminSelections() {
    courseSelection.clearSelection()
    classSelection.clearSelection()
    userSelection.clearSelection()
    bulkDeleteCourseModalOpen.value = false
    bulkDeleteClassModalOpen.value = false
  }

  watch(activeTab, (nextTab, previousTab) => {
    if (nextTab !== previousTab && isAdmin.value) {
      closeAllAdminModals()
      clearAdminSelections()
    }

    if (isAdmin.value) {
      adminError.value = ''
      adminToast.value = ''
      return
    }

    if (isStudent.value) {
      studentError.value = ''
      studentToast.value = ''
    }
  })

  watch(
    () => [route.name, route.params.tab, me.value?.role] as const,
    ([, , role]) => {
      if (!role) {
        return
      }

      const nextTab = resolveTabForRole(role)
      if (nextTab !== activeTab.value) {
        activeTab.value = nextTab
      }
    },
    { immediate: true },
  )

  function showScopedToast(target: 'admin' | 'student', message: string) {
    const toastRef = target === 'admin' ? adminToast : studentToast
    toastRef.value = message
    window.setTimeout(() => {
      if (toastRef.value === message) {
        toastRef.value = ''
      }
    }, 2200)
  }

  function clearAdminNotices() {
    adminError.value = ''
  }

  function clearStudentNotices() {
    studentError.value = ''
  }

  function clearAllNotices() {
    setupError.value = ''
    loginError.value = ''
    adminError.value = ''
    studentError.value = ''
    adminToast.value = ''
    studentToast.value = ''
  }

  function resetUserForm() {
    Object.assign(userForm, createUserForm())
    editingUserStudentId.value = ''
  }

  function resetUserPasswordForm() {
    Object.assign(userPasswordForm, createUserPasswordForm())
    passwordTargetStudentId.value = ''
    passwordTargetName.value = ''
  }

  function closeUserFreeTimeModal() {
    userFreeTimeModalOpen.value = false
    freeTimeTargetName.value = ''
    freeTimeTargetStudentId.value = ''
    userFreeTimeTerm.value = getCurrentAcademicTerm()
    userFreeTimeItems.value = []
    userFreeTimeDraft.value = {}
  }

  function resetCourseForm() {
    Object.assign(courseForm, createCourseForm())
    editingCourseId.value = null
  }

  function resetClassForm() {
    Object.assign(classForm, createClassForm())
    editingClassId.value = null
  }

  function resetClassStudentForm() {
    Object.assign(classStudentForm, createClassStudentForm())
  }

  function resetEditingClassStudentForm() {
    Object.assign(editingClassStudentForm, createClassStudentForm())
    editingClassStudentId.value = null
  }

  function resetFreeTimeForm() {
    Object.assign(freeTimeForm, createFreeTimeForm())
    editingFreeTimeId.value = null
  }

  function closeUserModal() {
    userModalOpen.value = false
    resetUserForm()
  }

  function closeCourseModal() {
    courseModalOpen.value = false
    resetCourseForm()
  }

  function closeCourseStudentModal() {
    courseStudentModalOpen.value = false
    courseStudentLoading.value = false
    courseStudentSaving.value = false
    courseStudentTargetCourseId.value = null
    courseStudentTargetName.value = ''
    courseStudentSelectedClassIds.value = []
    courseStudentSelectedStudentIds.value = []
    courseStudentClassStudentMap.value = {}
    courseStudentLooseStudents.value = []
  }

  function openCreateUserModal() {
    resetUserForm()
    userModalOpen.value = true
  }

  function openEditUserModal(user: UserItem) {
    userForm.studentId = user.student_id
    userForm.realName = user.real_name
    userForm.password = ''
    userForm.confirmPassword = ''
    userForm.role = user.role
    userForm.status = user.status
    editingUserStudentId.value = user.student_id
    userModalOpen.value = true
  }

  function createUserFreeTimeDraft(items: FreeTimeItem[], term: string) {
    const draft: Record<string, number[]> = {}
    for (const weekday of FREE_TIME_VISIBLE_WEEKDAYS) {
      for (const section of FREE_TIME_VISIBLE_SECTIONS) {
        draft[buildFreeTimeCellKey(weekday, section)] = []
      }
    }
    for (const item of items) {
      if (item.term !== term) {
        continue
      }
      draft[buildFreeTimeCellKey(item.weekday, item.section)] = parseFreeWeeks(item.free_weeks)
    }
    userFreeTimeDraft.value = draft
  }

  async function loadUserFreeTimeItems(studentId: string) {
    const page = await api.listFreeTimes({ page: 1, page_size: 200, student_id: studentId })
    userFreeTimeItems.value = page.items ?? []
    createUserFreeTimeDraft(userFreeTimeItems.value, userFreeTimeTerm.value)
  }

  async function openUserFreeTimeModal(user: UserItem) {
    if (user.role !== 2) {
      return
    }
    userFreeTimeLoading.value = true
    adminError.value = ''
    freeTimeTargetName.value = `${user.real_name}（${user.student_id}）`
    freeTimeTargetStudentId.value = user.student_id
    userFreeTimeTerm.value = getCurrentAcademicTerm()
    userFreeTimeModalOpen.value = true
    try {
      await loadUserFreeTimeItems(user.student_id)
    } catch (error) {
      adminError.value = error instanceof Error ? error.message : '加载空闲时间失败'
      closeUserFreeTimeModal()
    } finally {
      userFreeTimeLoading.value = false
    }
  }

  function updateUserFreeTimeTerm(term: string) {
    userFreeTimeTerm.value = term
    createUserFreeTimeDraft(userFreeTimeItems.value, term)
  }

  function toggleUserFreeTimeWeek(payload: { weekday: number; section: number; weekNo: number }) {
    const key = buildFreeTimeCellKey(payload.weekday, payload.section)
    const current = new Set(userFreeTimeDraft.value[key] ?? [])
    if (current.has(payload.weekNo)) {
      current.delete(payload.weekNo)
    } else {
      current.add(payload.weekNo)
    }
    userFreeTimeDraft.value = {
      ...userFreeTimeDraft.value,
      [key]: Array.from(current).sort((left, right) => left - right),
    }
  }

  function applyCourseDetail(detail: CourseDetail) {
    courseForm.term = detail.course.term
    courseForm.courseName = detail.course.course_name
    courseForm.teacherName = detail.course.teacher_name
    courseForm.weekday = null
    courseForm.section = null
    courseForm.buildingName = ''
    courseForm.roomName = ''
    courseForm.selectedWeeks = []
    courseForm.sessions = detail.sessions
      .slice()
      .sort((left, right) => left.session_no - right.session_no)
      .map((session) => ({
        sessionNo: session.session_no,
        weekNo: session.week_no,
        weekday: session.weekday,
        section: session.section,
        buildingName: session.building_name,
        roomName: session.room_name,
      }))
  }

  async function loadCourseStudentClassStudents(classIds: number[]) {
    const entries = await Promise.all(
      classIds.map(async (classId) => {
        const students = await api.listClassStudents(classId)
        return [classId, students] as const
      }),
    )

    courseStudentClassStudentMap.value = Object.fromEntries(entries)
  }

  function syncLooseCourseStudents() {
    const classStudentIds = new Set(
      Object.values(courseStudentClassStudentMap.value)
        .flat()
        .map((item) => item.student_id),
    )
    const existingLooseNames = new Map(courseStudentLooseStudents.value.map((item) => [item.student_id, item.real_name]))

    courseStudentLooseStudents.value = courseStudentSelectedStudentIds.value
      .filter((studentId) => !classStudentIds.has(studentId))
      .map((studentId) => {
        const matchedStudent = courseStudentCandidates.value.find((item) => item.student_id === studentId)
        return {
          student_id: studentId,
          real_name: matchedStudent?.real_name ?? existingLooseNames.get(studentId) ?? studentId,
        }
      })
  }

  function sortCourseSessions() {
    courseForm.sessions = courseForm.sessions
      .slice()
      .sort((left, right) => {
        if (left.weekNo !== right.weekNo) {
          return left.weekNo - right.weekNo
        }
        if (left.weekday !== right.weekday) {
          return left.weekday - right.weekday
        }
        if (left.section !== right.section) {
          return left.section - right.section
        }
        return left.roomName.localeCompare(right.roomName, 'zh-Hans-CN')
      })
      .map((item, index) => ({
        ...item,
        sessionNo: index + 1,
      }))
  }

  function setCourseWeekSelected(weekNo: number, selected: boolean) {
    const weekSet = new Set(courseForm.selectedWeeks)
    if (selected) {
      weekSet.add(weekNo)
    } else {
      weekSet.delete(weekNo)
    }
    courseForm.selectedWeeks = Array.from(weekSet).sort((left, right) => left - right)
  }

  function addCourseSessions() {
    const weeks = Array.from(new Set(courseForm.selectedWeeks)).sort((left, right) => left - right)
    if (weeks.length === 0) {
      adminError.value = '请先选择周数'
      return
    }
    if (courseForm.weekday === null || courseForm.section === null || !courseForm.buildingName.trim() || !courseForm.roomName.trim()) {
      adminError.value = '请先填写完整的上课时间'
      return
    }

    const nextSessions = courseForm.sessions.filter(
      (item) => !weeks.some((weekNo) => weekNo === item.weekNo && item.weekday === courseForm.weekday && item.section === courseForm.section),
    )

    for (const weekNo of weeks) {
      nextSessions.push({
        sessionNo: 0,
        weekNo,
        weekday: courseForm.weekday,
        section: courseForm.section,
        buildingName: courseForm.buildingName.trim(),
        roomName: courseForm.roomName.trim(),
      })
    }

    courseForm.sessions = nextSessions
    sortCourseSessions()
    courseForm.selectedWeeks = []
    adminError.value = ''
  }

  function editCourseSession(sessionNo: number) {
    const target = courseForm.sessions.find((item) => item.sessionNo === sessionNo)
    if (!target) {
      return
    }
    courseForm.weekday = target.weekday
    courseForm.section = target.section
    courseForm.buildingName = target.buildingName
    courseForm.roomName = target.roomName
    courseForm.selectedWeeks = [target.weekNo]
    courseForm.sessions = courseForm.sessions.filter((item) => item.sessionNo !== sessionNo)
    sortCourseSessions()
  }

  function removeCourseSession(sessionNo: number) {
    courseForm.sessions = courseForm.sessions.filter((item) => item.sessionNo !== sessionNo)
    sortCourseSessions()
  }

  function openCreateCourseModal() {
    resetCourseForm()
    courseModalOpen.value = true
  }

  async function openEditCourseModal(item: CourseItem) {
    courseLoading.value = true
    adminError.value = ''
    try {
      const detail = await api.getCourse(item.id)
      resetCourseForm()
      applyCourseDetail(detail)
      editingCourseId.value = item.id
      courseModalOpen.value = true
    } catch (error) {
      adminError.value = error instanceof Error ? error.message : '加载课程失败'
    } finally {
      courseLoading.value = false
    }
  }

  async function openCourseStudentModal(item: CourseItem) {
    courseStudentLoading.value = true
    adminError.value = ''
    try {
      const detail = await api.getCourse(item.id)
      courseStudentTargetCourseId.value = item.id
      courseStudentTargetName.value = `${item.course_name} · ${item.teacher_name}`
      courseStudentSelectedClassIds.value = detail.classes
        .map((entry) => Number(entry.class_id))
        .sort((left, right) => left - right)
      courseStudentSelectedStudentIds.value = detail.students
        .map((entry) => entry.student_id)
        .sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'))
      courseStudentLooseStudents.value = detail.students.map((entry) => ({
        student_id: entry.student_id,
        real_name: entry.real_name,
      }))
      await loadCourseStudentClassStudents(courseStudentSelectedClassIds.value)
      syncLooseCourseStudents()
      courseStudentModalOpen.value = true
    } catch (error) {
      adminError.value = error instanceof Error ? error.message : '加载课程学生失败'
      closeCourseStudentModal()
    } finally {
      courseStudentLoading.value = false
    }
  }

  async function addCourseStudentClass(classId: number) {
    if (courseStudentSelectedClassIds.value.includes(classId)) {
      return
    }
    courseStudentLoading.value = true
    adminError.value = ''
    try {
      const students = await api.listClassStudents(classId)
      courseStudentClassStudentMap.value = {
        ...courseStudentClassStudentMap.value,
        [classId]: students,
      }
      courseStudentSelectedClassIds.value = [...courseStudentSelectedClassIds.value, classId].sort((left, right) => left - right)
      const selected = new Set(courseStudentSelectedStudentIds.value)
      for (const student of students) {
        selected.add(student.student_id)
      }
      courseStudentSelectedStudentIds.value = Array.from(selected).sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'))
      syncLooseCourseStudents()
    } catch (error) {
      adminError.value = error instanceof Error ? error.message : '添加班级失败'
    } finally {
      courseStudentLoading.value = false
    }
  }

  function removeCourseStudentClass(classId: number) {
    const remainingClassIds = courseStudentSelectedClassIds.value.filter((item) => item !== classId)
    const remainingClassStudents = new Set(
      remainingClassIds.flatMap((item) => (courseStudentClassStudentMap.value[item] ?? []).map((student) => student.student_id)),
    )
    const looseStudentIds = new Set(courseStudentLooseStudents.value.map((item) => item.student_id))
    const nextMap = { ...courseStudentClassStudentMap.value }

    delete nextMap[classId]
    courseStudentSelectedClassIds.value = remainingClassIds
    courseStudentClassStudentMap.value = nextMap
    courseStudentSelectedStudentIds.value = courseStudentSelectedStudentIds.value.filter(
      (studentId) => remainingClassStudents.has(studentId) || looseStudentIds.has(studentId),
    )
    syncLooseCourseStudents()
  }

  function toggleCourseStudentClassSelection(classId: number) {
    const classStudentIds = (courseStudentClassStudentMap.value[classId] ?? []).map((student) => student.student_id)
    const selected = new Set(courseStudentSelectedStudentIds.value)
    const allSelected = classStudentIds.length > 0 && classStudentIds.every((studentId) => selected.has(studentId))

    if (allSelected) {
      const otherClassStudentIds = new Set(
        courseStudentSelectedClassIds.value
          .filter((item) => item !== classId)
          .flatMap((item) => (courseStudentClassStudentMap.value[item] ?? []).map((student) => student.student_id)),
      )
      courseStudentSelectedStudentIds.value = courseStudentSelectedStudentIds.value.filter(
        (studentId) => !classStudentIds.includes(studentId) || otherClassStudentIds.has(studentId),
      )
      syncLooseCourseStudents()
      return
    }

    for (const studentId of classStudentIds) {
      selected.add(studentId)
    }
    courseStudentSelectedStudentIds.value = Array.from(selected).sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'))
    syncLooseCourseStudents()
  }

  function toggleCourseStudentSelection(studentId: string) {
    const selected = new Set(courseStudentSelectedStudentIds.value)
    if (selected.has(studentId)) {
      selected.delete(studentId)
    } else {
      selected.add(studentId)
    }
    courseStudentSelectedStudentIds.value = Array.from(selected).sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'))
    syncLooseCourseStudents()
  }

  function addCourseStudent(studentId: string) {
    const selected = new Set(courseStudentSelectedStudentIds.value)
    if (selected.has(studentId)) {
      return
    }
    selected.add(studentId)
    courseStudentSelectedStudentIds.value = Array.from(selected).sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'))
    syncLooseCourseStudents()
  }

  function removeCourseStudent(studentId: string) {
    courseStudentSelectedStudentIds.value = courseStudentSelectedStudentIds.value.filter((item) => item !== studentId)
    courseStudentLooseStudents.value = courseStudentLooseStudents.value.filter((item) => item.student_id !== studentId)
  }

  function closeDeleteCourseModal() {
    deleteCourseModalOpen.value = false
    deletingCourseId.value = null
    deletingCourseName.value = ''
  }

  function openBulkDeleteCourseModal() {
    if (selectedCourseIds.value.length === 0) {
      return
    }
    bulkDeleteCourseModalOpen.value = true
  }

  function closeBulkDeleteCourseModal() {
    bulkDeleteCourseModalOpen.value = false
  }

  function openDeleteCourseModal(item: CourseItem) {
    deletingCourseId.value = item.id
    deletingCourseName.value = item.course_name
    deleteCourseModalOpen.value = true
  }

  function closeClassModal() {
    classModalOpen.value = false
    resetClassForm()
  }

  function openCreateClassModal() {
    resetClassForm()
    classModalOpen.value = true
  }

  function openEditClassModal(item: ClassItem) {
    classForm.className = item.class_name
    classForm.grade = item.grade
    classForm.majorName = item.major_name
    editingClassId.value = item.id
    classModalOpen.value = true
  }

  function closeClassStudentModal() {
    classStudentModalOpen.value = false
    classStudentTargetClassId.value = null
    classStudentTargetName.value = ''
    classStudents.value = []
    Object.assign(classStudentFilters, createClassStudentFilters())
    resetClassStudentForm()
    resetEditingClassStudentForm()
  }

  async function loadClassStudents(classId: number) {
    classStudents.value = await api.listClassStudents(classId)
  }

  async function openClassStudentModal(item: ClassItem) {
    classStudentTargetClassId.value = item.id
    classStudentTargetName.value = `${item.grade}级 ${item.major_name} ${item.class_name}`
    resetClassStudentForm()
    resetEditingClassStudentForm()
    Object.assign(classStudentFilters, createClassStudentFilters())
    await loadClassStudents(item.id)
    classStudentModalOpen.value = true
  }

  function startEditClassStudent(studentId: number) {
    const item = classStudents.value.find((student) => student.id === studentId)
    if (!item) {
      return
    }
    editingClassStudentId.value = item.id
    editingClassStudentForm.studentId = item.student_id
    editingClassStudentForm.realName = item.real_name
  }

  function closeDeleteClassModal() {
    deleteClassModalOpen.value = false
    deletingClassId.value = null
    deletingClassName.value = ''
  }

  function openBulkDeleteClassModal() {
    if (selectedClassIds.value.length === 0) {
      return
    }
    bulkDeleteClassModalOpen.value = true
  }

  function closeBulkDeleteClassModal() {
    bulkDeleteClassModalOpen.value = false
  }

  function openDeleteClassModal(item: ClassItem) {
    deletingClassId.value = item.id
    deletingClassName.value = item.class_name
    deleteClassModalOpen.value = true
  }

  function closePasswordModal() {
    passwordModalOpen.value = false
    Object.assign(passwordForm, createPasswordForm())
  }

  function openPasswordModal() {
    closePasswordModal()
    passwordModalOpen.value = true
  }

  function closeProfileModal() {
    profileModalOpen.value = false
    Object.assign(profileForm, createProfileForm())
  }

  function openProfileModal() {
    profileForm.studentId = me.value?.student_id ?? ''
    profileForm.realName = me.value?.real_name ?? ''
    profileModalOpen.value = true
  }

  function closeUserPasswordModal() {
    userPasswordModalOpen.value = false
    resetUserPasswordForm()
  }

  function openUserPasswordModal(user: UserItem) {
    resetUserPasswordForm()
    passwordTargetStudentId.value = user.student_id
    passwordTargetName.value = `${user.real_name}（${user.student_id}）`
    userPasswordModalOpen.value = true
  }

  function updateUserPage(page: number) {
    usersView.setPage(page)
  }

  function updateUserPageSize(size: number) {
    usersView.setPageSize(size)
  }

  function updateCoursePage(page: number) {
    coursesView.setPage(page)
  }

  function updateCoursePageSize(size: number) {
    coursesView.setPageSize(size)
  }

  function updateClassPage(page: number) {
    classesView.setPage(page)
  }

  function updateClassPageSize(size: number) {
    classesView.setPageSize(size)
  }

  function updateLogsPage(page: number) {
    logsView.setPage(page)
  }

  function updateLogsPageSize(size: number) {
    logsView.setPageSize(size)
  }

  function updateAttendanceLogsPage(page: number) {
    attendanceLogsView.setPage(page)
  }

  function updateAttendanceLogsPageSize(size: number) {
    attendanceLogsView.setPageSize(size)
  }

  function toggleCourseSelection(courseId: number) {
    courseSelection.toggleSelection(courseId)
  }

  function toggleCoursePageSelection() {
    courseSelection.togglePageSelection()
  }

  function toggleClassSelection(classId: number) {
    classSelection.toggleSelection(classId)
  }

  function toggleClassPageSelection() {
    classSelection.togglePageSelection()
  }

  function toggleUserSelection(studentId: string) {
    userSelection.toggleSelection(studentId)
  }

  function toggleUserPageSelection() {
    userSelection.togglePageSelection()
  }

  const adminApp = shallowRef<AdminAppInstance | null>(null)
  let adminAppLoader: Promise<AdminAppInstance> | null = null

  const studentApp = useStudentApp({
    me,
    activeTab,
    studentError,
    studentToast,
    systemSettings,
    availableCourses,
    activeCheck,
    selectedStudentId,
    freeTimes,
    freeTimeForm,
    editingFreeTimeId,
    passwordForm,
    freeTimeSaving,
    attendanceCompleting,
    passwordSaving,
    studentCoreLoaded,
    studentFreeTimesLoaded,
    studentActiveCheckLoaded,
    resetFreeTimeForm,
    showScopedToast,
    setActiveTab,
    changePassword,
  })

  async function ensureStudentFreeTimesLoaded(force = false) {
    await studentApp.ensureStudentFreeTimesLoaded(force)
  }

  async function ensureStudentActiveCheckLoaded(force = false) {
    await studentApp.ensureStudentActiveCheckLoaded(force)
  }

  async function ensureAdminApp() {
    if (adminApp.value) {
      return adminApp.value
    }
    if (!adminAppLoader) {
      adminAppLoader = import('./useAdminApp').then(({ useAdminApp }) => {
        adminApp.value = useAdminApp({
          me,
          activeTab,
          adminError,
          adminToast,
          adminStats,
          users,
          classes,
          courseStudentCandidates,
          classStudents,
          courses,
          courseCalendar,
          dashboard,
          attendanceResults,
          freeTimes,
          logs,
          attendanceLogs,
          systemSettings,
          userForm,
          userFilters,
          logFilters,
          attendanceLogFilters,
          classForm,
          classFilters,
          classStudentForm,
          classStudentFilters,
          editingClassStudentForm,
          courseForm,
          courseFilters,
          profileForm,
          userPasswordForm,
          passwordForm,
          userSaving,
          passwordResetting,
          profileSaving,
          courseLoading,
          courseSaving,
          courseImporting,
          courseDeleting,
          classSaving,
          classDeleting,
          userStatusUpdating,
          classStudentSaving,
          classStudentImporting,
          courseStudentLoading,
          courseStudentSaving,
          passwordSaving,
          userFreeTimeLoading,
          userFreeTimeSaving,
          systemSettingSaving,
          editingUserStudentId,
          editingCourseId,
          editingClassId,
          editingClassStudentId,
          classStudentTargetClassId,
          courseStudentTargetCourseId,
          courseStudentTargetName,
          courseStudentSelectedClassIds,
          courseStudentSelectedStudentIds,
          courseStudentSelectedStudents,
          courseStudentClassStudentMap,
          courseStudentLooseStudents,
          passwordTargetStudentId,
          passwordTargetName,
          freeTimeTargetName,
          freeTimeTargetStudentId,
          userFreeTimeTerm,
          userFreeTimeItems,
          userFreeTimeDraft,
          deletingCourseId,
          deletingCourseName,
          deletingClassId,
          deletingClassName,
          classStudentTargetName,
          currentUserId,
          userModalOpen,
          courseModalOpen,
          classModalOpen,
          classStudentModalOpen,
          courseStudentModalOpen,
          deleteCourseModalOpen,
          deleteClassModalOpen,
          bulkDeleteCourseModalOpen,
          bulkDeleteClassModalOpen,
          passwordModalOpen,
          profileModalOpen,
          userPasswordModalOpen,
          userFreeTimeModalOpen,
          paginatedLogs,
          paginatedAttendanceLogs,
          paginatedClasses,
          filteredClassStudents,
          paginatedUsers,
          paginatedCourses,
          userPage,
          userPageSize,
          userTotalPages,
          coursePage,
          coursePageSize,
          courseTotalPages,
          classPage,
          classPageSize,
          classTotalPages,
          logsPage,
          logsPageSize,
          logsTotalPages,
          attendanceLogsPage,
          attendanceLogsPageSize,
          attendanceLogsTotalPages,
          selectedCourseIds,
          selectedClassIds,
          selectedUserStudentIds,
          userFreeTimeTermOptions,
          isEditingUser,
          isEditingClass,
          showScopedToast,
          setActiveTab,
          logout,
          changePassword,
          loadClassStudents,
          loadUserFreeTimeItems,
          resetClassStudentForm,
          resetEditingClassStudentForm,
          closeUserModal,
          closeUserPasswordModal,
          closeProfileModal,
          closeCourseModal,
          closeCourseStudentModal,
          closeDeleteCourseModal,
          closeClassModal,
          closeDeleteClassModal,
          closeBulkDeleteCourseModal,
          closeBulkDeleteClassModal,
          closeClassStudentModal,
          closeUserFreeTimeModal,
          closePasswordModal,
          openCreateCourseModal,
          openEditCourseModal,
          openCourseStudentModal,
          openDeleteCourseModal,
          openBulkDeleteCourseModal,
          addCourseStudentClass,
          removeCourseStudentClass,
          toggleCourseStudentClassSelection,
          toggleCourseStudentSelection,
          addCourseStudent,
          removeCourseStudent,
          setCourseWeekSelected,
          addCourseSessions,
          editCourseSession,
          removeCourseSession,
          updateCoursePage,
          updateCoursePageSize,
          toggleCourseSelection,
          toggleCoursePageSelection,
          openCreateClassModal,
          openEditClassModal,
          openClassStudentModal,
          openDeleteClassModal,
          openBulkDeleteClassModal,
          startEditClassStudent,
          updateClassPage,
          updateClassPageSize,
          toggleClassSelection,
          toggleClassPageSelection,
          openCreateUserModal,
          updateAttendanceLogsPage,
          updateAttendanceLogsPageSize,
          updateLogsPage,
          updateLogsPageSize,
          openEditUserModal,
          openUserPasswordModal,
          openUserFreeTimeModal,
          updateUserFreeTimeTerm,
          toggleUserFreeTimeWeek,
          updateUserPage,
          updateUserPageSize,
          toggleUserSelection,
          toggleUserPageSelection,
          openProfileModal,
          openPasswordModal,
        })
        return adminApp.value
      })
    }
    return adminAppLoader
  }

  async function changePassword() {
    passwordSaving.value = true
    if (me.value?.role === 1) {
      adminError.value = ''
    } else {
      studentError.value = ''
    }
    try {
      if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
        throw new Error('两次输入的新密码不一致')
      }
      await api.changePassword(passwordForm.oldPassword, passwordForm.newPassword)
      closePasswordModal()
      showScopedToast(me.value?.role === 1 ? 'admin' : 'student', '密码已修改')
    } catch (error) {
      const message = error instanceof Error ? error.message : '修改密码失败'
      if (me.value?.role === 1) {
        adminError.value = message
      } else {
        studentError.value = message
      }
    } finally {
      passwordSaving.value = false
    }
  }

  async function loadRoleData() {
    if (!me.value) {
      return
    }

    if (me.value.role === 1) {
      clearAdminNotices()
      const app = await ensureAdminApp()
      try {
        await app.loadAdminData()
      } catch (error) {
        adminError.value = error instanceof Error ? error.message : '加载管理数据失败'
      }
      return
    }

    clearStudentNotices()
    adminApp.value = null
    adminAppLoader = null
    await studentApp.loadRoleData()
  }

  function resetAppData() {
    users.value = []
    classes.value = []
    courseStudentCandidates.value = []
    classStudents.value = []
    courses.value = []
    courseCalendar.value = []
    dashboard.value = null
    attendanceResults.value = []
    freeTimes.value = []
    systemSettings.value = null
    logs.value = []
    attendanceLogs.value = []
    studentApp.resetStudentState()
    adminApp.value = null
    adminAppLoader = null
  }

  function closeAllAdminModals() {
    closeUserModal()
    closeCourseModal()
    closeCourseStudentModal()
    closeClassModal()
    closeClassStudentModal()
    closeDeleteCourseModal()
    closeDeleteClassModal()
    closeBulkDeleteCourseModal()
    closeBulkDeleteClassModal()
    closePasswordModal()
    closeProfileModal()
    closeUserPasswordModal()
    closeUserFreeTimeModal()
  }

  const sessionFlow = useSessionFlow({
    me,
    booting,
    initialized,
    authLoading,
    setupLoading,
    loginError,
    setupError,
    loginForm,
    setupForm,
    loadRoleData,
    resolveTabForRole,
    setActiveTab,
    navigateToLogin: async () => {
      await router.replace({ name: 'login' })
    },
    navigateToSetup: async () => {
      await router.replace({ name: 'setup' })
    },
    clearAllNotices,
    resetAppData,
    closeAllAdminModals,
  })

  async function initializeSystem() {
    await sessionFlow.initializeSystem()
  }

  async function login() {
    await sessionFlow.login()
  }

  async function restoreSession() {
    await sessionFlow.restoreSession()
  }

  function logout() {
    sessionFlow.logout()
  }

  watch(
    () => [booting.value, initialized.value, me.value?.role, route.name] as const,
    async ([isBooting, isInitialized, role, routeName]) => {
      if (isBooting) {
        return
      }

      if (!isInitialized) {
        if (routeName !== 'setup') {
          await router.replace({ name: 'setup' })
        }
        return
      }

      if (!role) {
        if (routeName !== 'login') {
          await router.replace({ name: 'login' })
        }
        return
      }

      const nextTab = resolveTabForRole(role)
      const expectedRouteName = role === 1 ? 'admin' : 'student'
      if (routeName !== expectedRouteName || nextTab !== activeTab.value) {
        await setActiveTab(nextTab, 'replace')
      }
    },
    { immediate: true },
  )

  onMounted(() => {
    void restoreSession()
  })

  const adminWorkspaceProps = computed<(AdminWorkspaceProps & { activeTab: AppTab }) | null>(() => {
    if (!isAdmin.value || !adminApp.value) {
      return null
    }

    const props = adminApp.value.adminWorkspaceProps.value
    if (!props.logFilters || !props.attendanceLogFilters) {
      return null
    }

    return props
  })

  const adminWorkspaceHandlers = computed(() => {
    if (!isAdmin.value || !adminApp.value || !adminWorkspaceProps.value) {
      return null
    }

    return adminApp.value.adminWorkspaceHandlers
  })

  return {
    authLoading,
    booting,
    initializeSystem,
    initialized,
    isAdmin,
    login,
    loginError,
    loginForm,
    me,
    setupError,
    setupForm,
    setupLoading,
    studentWorkspaceHandlers: {
      ...studentApp.studentWorkspaceHandlers,
      logout,
    },
    studentWorkspaceProps: studentApp.studentWorkspaceProps,
    adminWorkspaceHandlers,
    adminWorkspaceProps,
  }
}
