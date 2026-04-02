import { computed, reactive, ref, shallowRef, watch, type Ref } from 'vue'
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'

import {
  api,
  type AdminOverviewData,
  type AttendanceRecordLogListItem,
  type AttendanceResultItem,
  type ClassItem,
  type ClassStudentItem,
  type CourseCalendarItem,
  type CourseItem,
  type DashboardSummary,
  type FreeTimeEditorItem,
  type FreeTimeItem,
  type MetaTermItem,
  type SessionUser,
  type StudentItem,
  type SystemSetting,
  type UserItem,
} from '../../api'
import type { AppTab } from '../../constants'
import type { AdminWorkspaceProps } from '../../components/admin/types'
import type { AdminCourseManagePathTarget, AdminCourseManageRouteView } from '../../components/admin/shared-types'
import {
  createAttendanceLogFilters,
  createClassFilters,
  createClassForm,
  createClassStudentFilters,
  createClassStudentForm,
  createCourseFilters,
  createCourseForm,
  createProfileForm,
  createStudentFilters,
  createStudentForm,
  createUserFilters,
  createUserForm,
  createUserPasswordForm,
} from './forms'
import { getCurrentAcademicTerm } from '../../utils/free-time'
import { useAdminCollections } from './useAdminCollections'
import { useAdminEditors } from './useAdminEditors'
import type { UseAdminAppDeps } from '../useAdminApp'

type PasswordForm = {
  oldPassword: string
  newPassword: string
  confirmNewPassword: string
}

type AdminAppInstance = ReturnType<(typeof import('../useAdminApp'))['useAdminApp']>

type UseAdminStateDeps = {
  router: Router
  route: RouteLocationNormalizedLoaded
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
  const studentForm = reactive(createStudentForm())
  const classStudentForm = reactive(createClassStudentForm())
  const editingClassStudentForm = reactive(createClassStudentForm())
  const classFilters = reactive(createClassFilters())
  const studentFilters = reactive(createStudentFilters())
  const classStudentFilters = reactive(createClassStudentFilters())
  const attendanceLogFilters = reactive(createAttendanceLogFilters())
  const courseFilters = reactive(createCourseFilters())
  const courseForm = reactive(createCourseForm())
  const profileForm = reactive(createProfileForm())
  const userPasswordForm = reactive(createUserPasswordForm())

  const users = ref<UserItem[]>([])
  const classes = ref<ClassItem[]>([])
  const students = ref<StudentItem[]>([])
  const userRows = ref<UserItem[]>([])
  const classRows = ref<ClassItem[]>([])
  const studentRows = ref<StudentItem[]>([])
  const classStudents = ref<ClassStudentItem[]>([])
  const courses = ref<CourseItem[]>([])
  const courseRows = ref<CourseItem[]>([])
  const courseTerms = ref<MetaTermItem[]>([])
  const courseCalendar = ref<CourseCalendarItem[]>([])
  const courseCalendarTerm = ref('')
  const dashboard = ref<DashboardSummary | null>(null)
  const overviewData = ref<AdminOverviewData | null>(null)
  const attendanceResults = ref<AttendanceResultItem[]>([])
  const freeTimes = ref<FreeTimeItem[]>([])
  const attendanceLogs = ref<AttendanceRecordLogListItem[]>([])
  const attendanceLogRows = ref<AttendanceRecordLogListItem[]>([])
  const systemSettings = ref<SystemSetting | null>(null)
  const userPage = ref(1)
  const userPageSize = ref(100)
  const userTotalPages = ref(1)
  const userTotalItems = ref(0)
  const userAllItems = ref(0)
  const coursePage = ref(1)
  const coursePageSize = ref(100)
  const courseTotalPages = ref(1)
  const courseTotalItems = ref(0)
  const courseAllItems = ref(0)
  const classPage = ref(1)
  const classPageSize = ref(100)
  const classTotalPages = ref(1)
  const classTotalItems = ref(0)
  const classAllItems = ref(0)
  const studentPage = ref(1)
  const studentPageSize = ref(100)
  const studentTotalPages = ref(1)
  const studentTotalItems = ref(0)
  const studentAllItems = ref(0)
  const attendanceLogsPage = ref(1)
  const attendanceLogsPageSize = ref(100)
  const attendanceLogsTotalPages = ref(1)
  const attendanceLogsTotalItems = ref(0)
  const attendanceLogsAllItems = ref(0)

  const userSaving = ref(false)
  const passwordResetting = ref(false)
  const profileSaving = ref(false)
  const courseLoading = ref(false)
  const courseSaving = ref(false)
  const courseDeleting = ref(false)
  const classSaving = ref(false)
  const classDeleting = ref(false)
  const studentSaving = ref(false)
  const studentDeleting = ref(false)
  const userStatusUpdating = ref(false)
  const classStudentSaving = ref(false)
  const classStudentImporting = ref(false)
  const userFreeTimeLoading = ref(false)
  const userFreeTimeSaving = ref(false)
  const systemSettingSaving = ref(false)

  const editingUserStudentId = ref('')
  const editingCourseId = ref<number | null>(null)
  const editingClassId = ref<number | null>(null)
  const editingStudentId = ref<number | null>(null)
  const editingClassStudentId = ref<number | null>(null)
  const classStudentTargetClassId = ref<number | null>(null)
  const classStudentTargetClass = ref<ClassItem | null>(null)
  const passwordTargetStudentId = ref('')
  const passwordTargetName = ref('')
  const freeTimeTargetName = ref('')
  const freeTimeTargetLoginId = ref('')
  const userFreeTimeTerm = ref(getCurrentAcademicTerm())
  const userFreeTimeItems = ref<FreeTimeEditorItem[]>([])
  const userFreeTimeDraft = ref<Record<string, number[]>>({})
  const userFocusRowKey = ref<string | null>(null)
  const userFocusToken = ref(0)
  const deletingCourseId = ref<number | null>(null)
  const deletingCourseName = ref('')
  const courseFocusRowKey = ref<number | null>(null)
  const courseFocusToken = ref(0)
  const courseManageRouteView = ref<AdminCourseManageRouteView>('courses')
  const courseManageRouteCourseId = ref<number | null>(null)
  const courseManageRouteGroupId = ref<number | null>(null)
  const courseManageRouteLessonId = ref<number | null>(null)
  const courseManagePathCommand = ref<{ token: number; target: AdminCourseManagePathTarget; courseId?: number | null } | null>(null)
  const deletingClassId = ref<number | null>(null)
  const deletingClassName = ref('')
  const classFocusRowKey = ref<number | null>(null)
  const classFocusToken = ref(0)
  const deletingStudentId = ref<number | null>(null)
  const deletingStudentName = ref('')
  const studentFocusRowKey = ref<number | null>(null)
  const studentFocusToken = ref(0)
  const classStudentTargetName = ref('')

  const userModalOpen = ref(false)
  const courseModalOpen = ref(false)
  const classModalOpen = ref(false)
  const studentModalOpen = ref(false)
  const classStudentModalOpen = ref(false)
  const deleteCourseModalOpen = ref(false)
  const deleteClassModalOpen = ref(false)
  const deleteStudentModalOpen = ref(false)
  const bulkDeleteCourseModalOpen = ref(false)
  const bulkDeleteClassModalOpen = ref(false)
  const bulkDeleteStudentModalOpen = ref(false)
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
    ]
  })

  const isAdmin = computed(() => deps.me.value?.role === 1)
  const currentUserId = computed(() => deps.me.value?.id)
  const isEditingUser = computed(() => editingUserStudentId.value.length > 0)
  const isEditingClass = computed(() => editingClassId.value !== null)

  const adminCollections = useAdminCollections({
    users: userRows,
    classes: classRows,
    students: studentRows,
    courses: courseRows,
    courseTerms,
    attendanceLogs: attendanceLogRows,
    classStudents,
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
    paginatedStudents,
    paginatedAttendanceLogs,
    selectedCourseIds,
    selectedClassIds,
    selectedStudentIds,
    selectedUserStudentIds,
    clearAdminSelections: clearAdminCollectionSelections,
    toggleCourseSelection,
    toggleCoursePageSelection,
    toggleClassSelection,
    toggleClassPageSelection,
    toggleStudentSelection,
    toggleStudentPageSelection,
    toggleUserSelection,
    toggleUserPageSelection,
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
    freeTimeTargetLoginId.value = ''
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

  function resetStudentForm() {
    Object.assign(studentForm, createStudentForm())
    editingStudentId.value = null
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

  function closeStudentModal() {
    studentModalOpen.value = false
    resetStudentForm()
  }

  function openCreateUserModal() {
    resetUserForm()
    userModalOpen.value = true
  }

  function openCreateStudentModal() {
    resetStudentForm()
    studentModalOpen.value = true
  }

  function openEditUserModal(user: UserItem) {
    userForm.studentId = user.login_id
    userForm.realName = user.real_name
    userForm.password = ''
    userForm.confirmPassword = ''
    userForm.role = user.role
    userForm.status = user.status
    userForm.managedClassId = typeof user.managed_class_id === 'number' ? user.managed_class_id : ''
    editingUserStudentId.value = user.login_id
    userModalOpen.value = true
  }
  const {
    loadUserFreeTimeItems,
    openUserFreeTimeModal,
    updateUserFreeTimeTerm,
    toggleUserFreeTimeWeek,
    toggleUserFreeTimeCell,
    openCreateCourseModal,
    openEditCourseModal,
  } = useAdminEditors({
    adminError,
    courseLoading,
    userFreeTimeLoading,
    courseTerms,
    freeTimeTargetName,
    freeTimeTargetLoginId,
    userFreeTimeTerm,
    userFreeTimeItems,
    userFreeTimeDraft,
    userFreeTimeModalOpen,
    courseModalOpen,
    editingCourseId,
    courseForm,
    resetCourseForm,
  })

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

  function openEditStudentModal(item: StudentItem) {
    studentForm.classId = typeof item.class_id === 'number' ? item.class_id : ''
    studentForm.studentId = item.student_id
    studentForm.realName = item.real_name
    editingStudentId.value = item.id
    studentModalOpen.value = true
  }

  function closeClassStudentModal() {
    classStudentModalOpen.value = false
    classStudentTargetClassId.value = null
    classStudentTargetClass.value = null
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
    classStudentTargetClass.value = item
    classStudentTargetName.value = item.class_name
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

  function closeDeleteStudentModal() {
    deleteStudentModalOpen.value = false
    deletingStudentId.value = null
    deletingStudentName.value = ''
  }

  function openBulkDeleteStudentModal() {
    if (selectedStudentIds.value.length > 0) {
      bulkDeleteStudentModalOpen.value = true
    }
  }

  function closeBulkDeleteStudentModal() {
    bulkDeleteStudentModalOpen.value = false
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

  function openDeleteStudentModal(item: StudentItem) {
    deletingStudentId.value = item.id
    deletingStudentName.value = `${item.real_name}（${item.student_id}）`
    deleteStudentModalOpen.value = true
  }

  function closeProfileModal() {
    profileModalOpen.value = false
    Object.assign(profileForm, createProfileForm())
  }

  function openProfileModal() {
    profileForm.studentId = deps.me.value?.login_id ?? ''
    profileForm.realName = deps.me.value?.real_name ?? ''
    profileModalOpen.value = true
  }

  function closeUserPasswordModal() {
    userPasswordModalOpen.value = false
    resetUserPasswordForm()
  }

  function openUserPasswordModal(user: UserItem) {
    resetUserPasswordForm()
    passwordTargetStudentId.value = user.login_id
    passwordTargetName.value = `${user.real_name}（${user.login_id}）`
    userPasswordModalOpen.value = true
  }

  function updateUserPage(page: number) {
    userPage.value = page
  }
  function updateUserPageSize(size: number) {
    userPageSize.value = size
    userPage.value = 1
  }
  function updateCoursePage(page: number) {
    coursePage.value = page
  }
  function updateCoursePageSize(size: number) {
    coursePageSize.value = size
    coursePage.value = 1
  }
  function updateCourseCalendarTerm(term: string) {
    courseCalendarTerm.value = term
  }
  function updateClassPage(page: number) {
    classPage.value = page
  }
  function updateClassPageSize(size: number) {
    classPageSize.value = size
    classPage.value = 1
  }
  function updateStudentPage(page: number) {
    studentPage.value = page
  }
  function updateStudentPageSize(size: number) {
    studentPageSize.value = size
    studentPage.value = 1
  }
  function updateAttendanceLogsPage(page: number) {
    attendanceLogsPage.value = page
  }
  function updateAttendanceLogsPageSize(size: number) {
    attendanceLogsPageSize.value = size
    attendanceLogsPage.value = 1
  }

  async function openAttendanceLogs(payload: { term: string; courseGroupLessonId: number; studentId?: string }) {
    Object.assign(attendanceLogFilters, createAttendanceLogFilters(), {
      term: payload.term,
      courseGroupLessonId: String(payload.courseGroupLessonId),
      studentId: payload.studentId ?? '',
    })
    attendanceLogsPage.value = 1
    await deps.setActiveTab('attendance-logs', 'push')
  }

  function clearAdminSelections() {
    clearAdminCollectionSelections()
    bulkDeleteCourseModalOpen.value = false
    bulkDeleteClassModalOpen.value = false
    bulkDeleteStudentModalOpen.value = false
  }

  function clearAdminListFocusState() {
    userFocusRowKey.value = null
    userFocusToken.value = 0
    courseFocusRowKey.value = null
    courseFocusToken.value = 0
    classFocusRowKey.value = null
    classFocusToken.value = 0
    studentFocusRowKey.value = null
    studentFocusToken.value = 0
  }

  function closeAllModals() {
    closeUserModal()
    closeCourseModal()
    closeClassModal()
    closeStudentModal()
    closeClassStudentModal()
    closeDeleteCourseModal()
    closeDeleteClassModal()
    closeDeleteStudentModal()
    closeBulkDeleteCourseModal()
    closeBulkDeleteClassModal()
    closeBulkDeleteStudentModal()
    deps.closePasswordModal()
    closeProfileModal()
    closeUserPasswordModal()
    closeUserFreeTimeModal()
  }

  function resetAdminFiltersForTab(tab: AppTab) {
    switch (tab) {
      case 'user-manage':
        Object.assign(userFilters, createUserFilters())
        userPage.value = 1
        return
      case 'course-manage':
        Object.assign(courseFilters, createCourseFilters())
        coursePage.value = 1
        return
      case 'class-manage':
        Object.assign(classFilters, createClassFilters())
        Object.assign(classStudentFilters, createClassStudentFilters())
        classPage.value = 1
        return
      case 'student':
        Object.assign(studentFilters, createStudentFilters())
        studentPage.value = 1
        return
      case 'attendance-logs':
        Object.assign(attendanceLogFilters, createAttendanceLogFilters())
        attendanceLogsPage.value = 1
        return
      default:
        return
    }
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
          router: deps.router,
          route: deps.route,
          activeTab: deps.activeTab,
          adminError,
          adminToast,
          adminStats,
          users,
          classes,
          students,
          userRows,
          classRows,
          studentRows,
          courses,
          courseRows,
          courseTerms,
          courseCalendar,
          courseCalendarTerm,
          dashboard,
          overviewData,
          attendanceResults,
          freeTimes,
          attendanceLogs,
          attendanceLogRows,
          systemSettings,
          userForm,
          userFilters,
          attendanceLogFilters,
          classForm,
          classFilters,
          studentForm,
          studentFilters,
          classStudentForm,
          classStudents,
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
          courseDeleting,
          classSaving,
          classDeleting,
          studentSaving,
          studentDeleting,
          userStatusUpdating,
          classStudentSaving,
          classStudentImporting,
          passwordSaving: deps.passwordSaving,
          userFreeTimeLoading,
          userFreeTimeSaving,
          systemSettingSaving,
          editingUserStudentId,
          editingCourseId,
          editingClassId,
          editingStudentId,
          editingClassStudentId,
          classStudentTargetClassId,
          classStudentTargetClass,
          passwordTargetStudentId,
          passwordTargetName,
          freeTimeTargetName,
          freeTimeTargetLoginId,
          userFreeTimeTerm,
          userFreeTimeItems,
          userFreeTimeDraft,
          userFocusRowKey,
          userFocusToken,
          deletingCourseId,
          deletingCourseName,
          courseFocusRowKey,
          courseFocusToken,
          courseManageRouteView,
          courseManageRouteCourseId,
          courseManageRouteGroupId,
          courseManageRouteLessonId,
          courseManagePathCommand,
          deletingClassId,
          deletingClassName,
          classFocusRowKey,
          classFocusToken,
          deletingStudentId,
          deletingStudentName,
          studentFocusRowKey,
          studentFocusToken,
          classStudentTargetName,
          currentUserId,
          userModalOpen,
          courseModalOpen,
          classModalOpen,
          studentModalOpen,
          classStudentModalOpen,
          deleteCourseModalOpen,
          deleteClassModalOpen,
          deleteStudentModalOpen,
          bulkDeleteCourseModalOpen,
          bulkDeleteClassModalOpen,
          bulkDeleteStudentModalOpen,
          passwordModalOpen: deps.passwordModalOpen,
          profileModalOpen,
          userPasswordModalOpen,
          userFreeTimeModalOpen,
          paginatedAttendanceLogs,
          paginatedClasses,
          paginatedStudents,
          filteredClassStudents,
          paginatedUsers,
          paginatedCourses,
          userPage,
          userPageSize,
          userTotalPages,
          userTotalItems,
          userAllItems,
          coursePage,
          coursePageSize,
          courseTotalPages,
          courseTotalItems,
          courseAllItems,
          classPage,
          classPageSize,
          classTotalPages,
          classTotalItems,
          classAllItems,
          studentPage,
          studentPageSize,
          studentTotalPages,
          studentTotalItems,
          studentAllItems,
          attendanceLogsPage,
          attendanceLogsPageSize,
          attendanceLogsTotalPages,
          attendanceLogsTotalItems,
          attendanceLogsAllItems,
          selectedCourseIds,
          selectedClassIds,
          selectedStudentIds,
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
          closeDeleteCourseModal,
          closeClassModal,
          closeStudentModal,
          closeDeleteClassModal,
          closeDeleteStudentModal,
          closeBulkDeleteCourseModal,
          closeBulkDeleteClassModal,
          closeBulkDeleteStudentModal,
          closeClassStudentModal,
          closeUserFreeTimeModal,
          closePasswordModal: deps.closePasswordModal,
          openCreateCourseModal,
          openEditCourseModal,
          openDeleteCourseModal,
          openBulkDeleteCourseModal,
          updateCoursePage,
          updateCoursePageSize,
          updateCourseCalendarTerm,
          toggleCourseSelection,
          toggleCoursePageSelection,
          openCreateClassModal,
          openCreateStudentModal,
          openEditClassModal,
          openEditStudentModal,
          openClassStudentModal,
          openDeleteClassModal,
          openDeleteStudentModal,
          openBulkDeleteClassModal,
          openBulkDeleteStudentModal,
          startEditClassStudent,
          updateClassPage,
          updateClassPageSize,
          updateStudentPage,
          updateStudentPageSize,
          toggleClassSelection,
          toggleClassPageSelection,
          toggleStudentSelection,
          toggleStudentPageSelection,
          openCreateUserModal,
          updateAttendanceLogsPage,
          updateAttendanceLogsPageSize,
          openAttendanceLogs,
          openEditUserModal,
          openUserPasswordModal,
          openUserFreeTimeModal,
          updateUserFreeTimeTerm,
          toggleUserFreeTimeWeek,
          toggleUserFreeTimeCell,
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

  async function loadRoleData(tab: AppTab = deps.activeTab.value) {
    clearNotices()
    const app = await ensureAdminApp()
    try {
      await app.loadAdminData(tab)
    } catch (error) {
      adminError.value = error instanceof Error ? error.message : '加载管理数据失败'
    }
  }

  function resetState() {
    users.value = []
    classes.value = []
    students.value = []
    courseManageRouteView.value = 'courses'
    courseManageRouteCourseId.value = null
    courseManageRouteGroupId.value = null
    courseManageRouteLessonId.value = null
    courseManagePathCommand.value = null
    clearAdminListFocusState()
    userTotalItems.value = 0
    userAllItems.value = 0
    courseTotalItems.value = 0
    courseAllItems.value = 0
    studentTotalItems.value = 0
    studentAllItems.value = 0
    attendanceLogsTotalItems.value = 0
    attendanceLogsAllItems.value = 0
    classTotalItems.value = 0
    classAllItems.value = 0
    userRows.value = []
    classRows.value = []
    studentRows.value = []
    classStudents.value = []
    courses.value = []
    courseRows.value = []
    courseTerms.value = []
    courseCalendar.value = []
    courseCalendarTerm.value = ''
    dashboard.value = null
    overviewData.value = null
    attendanceResults.value = []
    freeTimes.value = []
    systemSettings.value = null
    attendanceLogs.value = []
    attendanceLogRows.value = []
    adminApp.value = null
    adminAppLoader = null
  }

  watch(deps.activeTab, (nextTab, previousTab) => {
    if (nextTab !== previousTab && isAdmin.value) {
      clearAdminListFocusState()
      closeAllModals()
      clearAdminSelections()
      resetAdminFiltersForTab(previousTab)
      void loadRoleData(nextTab)
    }
    if (isAdmin.value) {
      clearNotices()
    }
  })

  watch(
    () => [userFilters.studentId, userFilters.realName, userFilters.managedClassName, userFilters.role, userFilters.status] as const,
    () => {
      userPage.value = 1
    },
  )

  watch(
    () => [courseFilters.term, courseFilters.grade, courseFilters.courseName, courseFilters.teacherName, courseFilters.className] as const,
    () => {
      coursePage.value = 1
    },
  )

  watch(
    () => [classFilters.grade, classFilters.majorName, classFilters.className] as const,
    () => {
      classPage.value = 1
    },
  )

  watch(
    () => [studentFilters.studentId, studentFilters.realName, studentFilters.className] as const,
    () => {
      studentPage.value = 1
    },
  )

  watch(
    () => [
      attendanceLogFilters.term,
      attendanceLogFilters.courseGroupLessonId,
      attendanceLogFilters.lessonDate,
      attendanceLogFilters.section,
      attendanceLogFilters.courseName,
      attendanceLogFilters.teacherName,
      attendanceLogFilters.studentId,
      attendanceLogFilters.realName,
      attendanceLogFilters.className,
      attendanceLogFilters.oldStatus,
      attendanceLogFilters.newStatus,
      attendanceLogFilters.operatorName,
      attendanceLogFilters.operatedDate,
    ] as const,
    () => {
      attendanceLogsPage.value = 1
    },
  )

  watch(
    () => [userPage.value, userPageSize.value, userFilters.studentId, userFilters.realName, userFilters.managedClassName, userFilters.role, userFilters.status] as const,
    () => {
      if (isAdmin.value && deps.activeTab.value === 'user-manage') {
        void loadRoleData('user-manage')
      }
    },
  )

  watch(
    () => [coursePage.value, coursePageSize.value, courseFilters.term, courseFilters.grade, courseFilters.courseName, courseFilters.teacherName, courseFilters.className] as const,
    () => {
      if (isAdmin.value && deps.activeTab.value === 'course-manage') {
        void loadRoleData('course-manage')
      }
    },
  )

  watch(
    () => [classPage.value, classPageSize.value, classFilters.grade, classFilters.majorName, classFilters.className] as const,
    () => {
      if (isAdmin.value && deps.activeTab.value === 'class-manage') {
        void loadRoleData('class-manage')
      }
    },
  )

  watch(
    () => [studentPage.value, studentPageSize.value, studentFilters.studentId, studentFilters.realName, studentFilters.className] as const,
    () => {
      if (isAdmin.value && deps.activeTab.value === 'student') {
        void loadRoleData('student')
      }
    },
  )

  watch(
    () => [
      attendanceLogsPage.value,
      attendanceLogsPageSize.value,
      attendanceLogFilters.term,
      attendanceLogFilters.courseGroupLessonId,
      attendanceLogFilters.lessonDate,
      attendanceLogFilters.section,
      attendanceLogFilters.courseName,
      attendanceLogFilters.teacherName,
      attendanceLogFilters.studentId,
      attendanceLogFilters.realName,
      attendanceLogFilters.className,
      attendanceLogFilters.oldStatus,
      attendanceLogFilters.newStatus,
      attendanceLogFilters.operatorName,
      attendanceLogFilters.operatedDate,
    ] as const,
    () => {
      if (isAdmin.value && deps.activeTab.value === 'attendance-logs') {
        void loadRoleData('attendance-logs')
      }
    },
  )

  watch(courseCalendarTerm, (nextTerm, previousTerm) => {
    if (!previousTerm || nextTerm === previousTerm) {
      return
    }
    if (isAdmin.value && deps.activeTab.value === 'course-calendar' && nextTerm) {
      void loadRoleData('course-calendar')
    }
  })

  const adminWorkspaceProps = computed<(AdminWorkspaceProps & { activeTab: AppTab }) | null>(() => {
    if (!isAdmin.value || !adminApp.value) {
      return null
    }
    const props = adminApp.value.adminWorkspaceProps.value
    if (!props.attendanceLogFilters) {
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
