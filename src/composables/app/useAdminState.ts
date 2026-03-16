import { computed, reactive, ref, shallowRef, watch, type Ref } from 'vue'

import {
  api,
  type AdminOperationLogItem,
  type AttendanceDetailLogItem,
  type AttendanceResultItem,
  type ClassItem,
  type ClassStudentCandidateItem,
  type ClassStudentItem,
  type CourseCalendarItem,
  type CourseDetail,
  type CourseItem,
  type DashboardSummary,
  type FreeTimeItem,
  type SessionUser,
  type SystemSetting,
  type UserItem,
} from '../../api'
import type { AppTab } from '../../constants'
import type { AdminWorkspaceProps } from '../../components/admin/types'
import {
  createAttendanceLogFilters,
  createClassFilters,
  createClassForm,
  createClassStudentFilters,
  createClassStudentForm,
  createCourseFilters,
  createCourseForm,
  createProfileForm,
  createSystemLogFilters,
  createUserFilters,
  createUserForm,
  createUserPasswordForm,
} from './forms'
import { FREE_TIME_VISIBLE_SECTIONS, FREE_TIME_VISIBLE_WEEKDAYS, buildFreeTimeCellKey, getCurrentAcademicTerm, parseFreeWeeks } from '../../utils/free-time'
import { useAdminCollections } from './useAdminCollections'
import type { UseAdminAppDeps } from '../useAdminApp'

type PasswordForm = {
  oldPassword: string
  newPassword: string
  confirmNewPassword: string
}

type AdminAppInstance = ReturnType<(typeof import('../useAdminApp'))['useAdminApp']>

type UseAdminStateDeps = {
  me: Ref<SessionUser | null>
  activeTab: Ref<AppTab>
  passwordForm: PasswordForm
  passwordModalOpen: Ref<boolean>
  passwordSaving: Ref<boolean>
  showScopedToast: (target: 'admin' | 'student', message: string) => void
  setActiveTab: (tab: AppTab, mode?: 'push' | 'replace') => Promise<void>
  logout: () => void
  changePassword: () => Promise<void>
  closePasswordModal: () => void
  openPasswordModal: () => void
}

export function useAdminState(deps: UseAdminStateDeps) {
  const adminError = ref('')
  const adminToast = ref('')

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
  const profileForm = reactive(createProfileForm())
  const userPasswordForm = reactive(createUserPasswordForm())

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
  const systemSettings = ref<SystemSetting | null>(null)

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
  const userFreeTimeLoading = ref(false)
  const userFreeTimeSaving = ref(false)
  const systemSettingSaving = ref(false)

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

  const userModalOpen = ref(false)
  const courseModalOpen = ref(false)
  const classModalOpen = ref(false)
  const classStudentModalOpen = ref(false)
  const courseStudentModalOpen = ref(false)
  const deleteCourseModalOpen = ref(false)
  const deleteClassModalOpen = ref(false)
  const bulkDeleteCourseModalOpen = ref(false)
  const bulkDeleteClassModalOpen = ref(false)
  const profileModalOpen = ref(false)
  const userPasswordModalOpen = ref(false)
  const userFreeTimeModalOpen = ref(false)

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

  const isAdmin = computed(() => deps.me.value?.role === 1)
  const currentUserId = computed(() => deps.me.value?.id)
  const isEditingUser = computed(() => editingUserStudentId.value.length > 0)
  const isEditingClass = computed(() => editingClassId.value !== null)

  const adminCollections = useAdminCollections({
    users,
    classes,
    courses,
    logs,
    attendanceLogs,
    classStudents,
    courseStudentCandidates,
    courseStudentClassStudentMap,
    courseStudentLooseStudents,
    courseStudentSelectedStudentIds,
    userFilters,
    classFilters,
    courseFilters,
    logFilters,
    attendanceLogFilters,
    classStudentFilters,
    userFreeTimeItems,
    userFreeTimeTerm,
    currentUserId,
  })

  const {
    userFreeTimeTermOptions,
    filteredClassStudents,
    paginatedUsers,
    paginatedCourses,
    paginatedClasses,
    paginatedLogs,
    paginatedAttendanceLogs,
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
    courseStudentSelectedStudents,
    clearAdminSelections: clearAdminCollectionSelections,
    toggleCourseSelection,
    toggleCoursePageSelection,
    toggleClassSelection,
    toggleClassPageSelection,
    toggleUserSelection,
    toggleUserPageSelection,
    usersView,
    coursesView,
    classesView,
    logsView,
    attendanceLogsView,
  } = adminCollections

  function clearNotices() {
    adminError.value = ''
    adminToast.value = ''
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
      courseStudentSelectedClassIds.value = detail.classes.map((entry) => Number(entry.class_id)).sort((left, right) => left - right)
      courseStudentSelectedStudentIds.value = detail.students.map((entry) => entry.student_id).sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'))
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
    if (selectedCourseIds.value.length > 0) {
      bulkDeleteCourseModalOpen.value = true
    }
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
    if (item) {
      editingClassStudentId.value = item.id
      editingClassStudentForm.studentId = item.student_id
      editingClassStudentForm.realName = item.real_name
    }
  }

  function closeDeleteClassModal() {
    deleteClassModalOpen.value = false
    deletingClassId.value = null
    deletingClassName.value = ''
  }

  function openBulkDeleteClassModal() {
    if (selectedClassIds.value.length > 0) {
      bulkDeleteClassModalOpen.value = true
    }
  }

  function closeBulkDeleteClassModal() {
    bulkDeleteClassModalOpen.value = false
  }

  function openDeleteClassModal(item: ClassItem) {
    deletingClassId.value = item.id
    deletingClassName.value = item.class_name
    deleteClassModalOpen.value = true
  }

  function closeProfileModal() {
    profileModalOpen.value = false
    Object.assign(profileForm, createProfileForm())
  }

  function openProfileModal() {
    profileForm.studentId = deps.me.value?.student_id ?? ''
    profileForm.realName = deps.me.value?.real_name ?? ''
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

  function clearAdminSelections() {
    clearAdminCollectionSelections()
    bulkDeleteCourseModalOpen.value = false
    bulkDeleteClassModalOpen.value = false
  }

  function closeAllModals() {
    closeUserModal()
    closeCourseModal()
    closeCourseStudentModal()
    closeClassModal()
    closeClassStudentModal()
    closeDeleteCourseModal()
    closeDeleteClassModal()
    closeBulkDeleteCourseModal()
    closeBulkDeleteClassModal()
    deps.closePasswordModal()
    closeProfileModal()
    closeUserPasswordModal()
    closeUserFreeTimeModal()
  }

  const adminApp = shallowRef<AdminAppInstance | null>(null)
  let adminAppLoader: Promise<AdminAppInstance> | null = null

  async function ensureAdminApp() {
    if (adminApp.value) {
      return adminApp.value
    }
    if (!adminAppLoader) {
      adminAppLoader = import('../useAdminApp').then(({ useAdminApp }) => {
        const adminDeps: UseAdminAppDeps = {
          me: deps.me,
          activeTab: deps.activeTab,
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
          passwordForm: deps.passwordForm,
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
          passwordSaving: deps.passwordSaving,
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
          passwordModalOpen: deps.passwordModalOpen,
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
          showScopedToast: deps.showScopedToast,
          setActiveTab: deps.setActiveTab,
          logout: deps.logout,
          changePassword: deps.changePassword,
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
          closePasswordModal: deps.closePasswordModal,
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
          openPasswordModal: deps.openPasswordModal,
        }
        adminApp.value = useAdminApp(adminDeps)
        return adminApp.value
      })
    }
    return adminAppLoader
  }

  async function loadRoleData() {
    clearNotices()
    const app = await ensureAdminApp()
    try {
      await app.loadAdminData()
    } catch (error) {
      adminError.value = error instanceof Error ? error.message : '加载管理数据失败'
    }
  }

  function resetState() {
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
    adminApp.value = null
    adminAppLoader = null
  }

  watch(deps.activeTab, (nextTab, previousTab) => {
    if (nextTab !== previousTab && isAdmin.value) {
      closeAllModals()
      clearAdminSelections()
    }
    if (isAdmin.value) {
      clearNotices()
    }
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
    adminError,
    adminToast,
    loadRoleData,
    resetState,
    clearNotices,
    closeAllModals,
    adminWorkspaceProps,
    adminWorkspaceHandlers,
  }
}
