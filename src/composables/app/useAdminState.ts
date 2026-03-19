import { computed, reactive, ref, shallowRef, watch, type Ref } from 'vue'

import {
  api,
  type AttendanceRecordLogItem,
  type AttendanceResultItem,
  type ClassItem,
  type ClassStudentItem,
  type CourseCalendarItem,
  type CourseItem,
  type DashboardSummary,
  type FreeTimeItem,
  type MetaTermItem,
  type SessionUser,
  type StudentItem,
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
  const classStudents = ref<ClassStudentItem[]>([])
  const courses = ref<CourseItem[]>([])
  const courseTerms = ref<MetaTermItem[]>([])
  const courseCalendar = ref<CourseCalendarItem[]>([])
  const dashboard = ref<DashboardSummary | null>(null)
  const attendanceResults = ref<AttendanceResultItem[]>([])
  const freeTimes = ref<FreeTimeItem[]>([])
  const attendanceLogs = ref<AttendanceRecordLogItem[]>([])
  const systemSettings = ref<SystemSetting | null>(null)

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
  const passwordTargetStudentId = ref('')
  const passwordTargetName = ref('')
  const freeTimeTargetName = ref('')
  const freeTimeTargetLoginId = ref('')
  const userFreeTimeTerm = ref(getCurrentAcademicTerm())
  const userFreeTimeItems = ref<FreeTimeItem[]>([])
  const userFreeTimeDraft = ref<Record<string, number[]>>({})
  const deletingCourseId = ref<number | null>(null)
  const deletingCourseName = ref('')
  const deletingClassId = ref<number | null>(null)
  const deletingClassName = ref('')
  const deletingStudentId = ref<number | null>(null)
  const deletingStudentName = ref('')
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
    users,
    classes,
    students,
    courses,
    courseTerms,
    attendanceLogs,
    classStudents,
    userFilters,
    classFilters,
    courseFilters,
    attendanceLogFilters,
    classStudentFilters,
    studentFilters,
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
    userPage,
    userPageSize,
    userTotalPages,
    coursePage,
    coursePageSize,
    courseTotalPages,
    classPage,
    classPageSize,
    classTotalPages,
    studentPage,
    studentPageSize,
    studentTotalPages,
    attendanceLogsPage,
    attendanceLogsPageSize,
    attendanceLogsTotalPages,
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
    usersView,
    coursesView,
    classesView,
    studentsView,
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
  function updateStudentPage(page: number) {
    studentsView.setPage(page)
  }
  function updateStudentPageSize(size: number) {
    studentsView.setPageSize(size)
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
    bulkDeleteStudentModalOpen.value = false
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
          students,
          courses,
          courseTerms,
          courseCalendar,
          dashboard,
          attendanceResults,
          freeTimes,
          attendanceLogs,
          systemSettings,
          userForm,
          userFilters,
          attendanceLogFilters,
          classForm,
          classFilters,
          studentForm,
          studentFilters,
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
          passwordTargetStudentId,
          passwordTargetName,
          freeTimeTargetName,
          freeTimeTargetLoginId,
          userFreeTimeTerm,
          userFreeTimeItems,
          userFreeTimeDraft,
          deletingCourseId,
          deletingCourseName,
          deletingClassId,
          deletingClassName,
          deletingStudentId,
          deletingStudentName,
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
          coursePage,
          coursePageSize,
          courseTotalPages,
          classPage,
          classPageSize,
          classTotalPages,
          studentPage,
          studentPageSize,
          studentTotalPages,
          attendanceLogsPage,
          attendanceLogsPageSize,
          attendanceLogsTotalPages,
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
    classStudents.value = []
    courses.value = []
    courseTerms.value = []
    courseCalendar.value = []
    dashboard.value = null
    attendanceResults.value = []
    freeTimes.value = []
    systemSettings.value = null
    attendanceLogs.value = []
    adminApp.value = null
    adminAppLoader = null
  }

  watch(deps.activeTab, (nextTab, previousTab) => {
    if (nextTab !== previousTab && isAdmin.value) {
      closeAllModals()
      clearAdminSelections()
      void loadRoleData(nextTab)
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
