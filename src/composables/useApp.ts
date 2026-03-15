import { computed, onMounted, reactive, ref, watch } from 'vue'

import {
  api,
  type AttendanceCheckDetail,
  type AttendanceResultItem,
  type AvailableCourseItem,
  type CourseCalendarItem,
  type CourseItem,
  type DashboardSummary,
  type FreeTimeItem,
  type SessionUser,
  type UserItem,
} from '../api'
import { adminNavItems, type AppTab, type StatusCode } from '../constants'
import {
  createCourseForm,
  createFreeTimeForm,
  createLoginForm,
  createPasswordForm,
  createProfileForm,
  createSetupForm,
  createUserFilters,
  createUserForm,
  createUserPasswordForm,
} from './app/forms'
import { useAdminFlow } from './app/useAdminFlow'
import { useSessionFlow } from './app/useSessionFlow'
import { useStudentFlow } from './app/useStudentFlow'
import { roleName, slotLabel, statusClass, statusName, USER_PAGE_OPTIONS } from './app/view'

export function useApp() {
  const loginForm = reactive(createLoginForm())

  const setupForm = reactive(createSetupForm())

  const passwordForm = reactive(createPasswordForm())

  const profileForm = reactive(createProfileForm())

  const userPasswordForm = reactive(createUserPasswordForm())

  const freeTimeForm = reactive(createFreeTimeForm())

  const userForm = reactive(createUserForm())

  const userFilters = reactive(createUserFilters())

  const courseForm = reactive(createCourseForm())

  const me = ref<SessionUser | null>(null)
  const authLoading = ref(false)
  const setupLoading = ref(false)
  const userSaving = ref(false)
  const passwordResetting = ref(false)
  const profileSaving = ref(false)
  const courseSaving = ref(false)
  const passwordSaving = ref(false)
  const freeTimeSaving = ref(false)
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
  const courses = ref<CourseItem[]>([])
  const courseCalendar = ref<CourseCalendarItem[]>([])
  const dashboard = ref<DashboardSummary | null>(null)
  const attendanceResults = ref<AttendanceResultItem[]>([])
  const freeTimes = ref<FreeTimeItem[]>([])
  const availableCourses = ref<AvailableCourseItem[]>([])
  const activeCheck = ref<AttendanceCheckDetail | null>(null)

  const editingFreeTimeId = ref<number | null>(null)
  const editingUserStudentId = ref('')
  const passwordTargetStudentId = ref('')
  const passwordTargetName = ref('')
  const selectedStudentId = ref<number | null>(null)

  const userModalOpen = ref(false)
  const passwordModalOpen = ref(false)
  const profileModalOpen = ref(false)
  const userPasswordModalOpen = ref(false)
  const activeTab = ref<AppTab>('overview')

  const userPage = ref(1)
  const userPageSize = ref(10)

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

  const filteredUsers = computed(() =>
    users.value.filter((user) => {
      const byStudentId = !userFilters.studentId || user.student_id.includes(userFilters.studentId.trim())
      const byRealName = !userFilters.realName || user.real_name.includes(userFilters.realName.trim())
      const byRole = !userFilters.role || String(user.role) === userFilters.role
      const byStatus = !userFilters.status || String(user.status) === userFilters.status
      return byStudentId && byRealName && byRole && byStatus
    }),
  )

  const userTotalPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / userPageSize.value)))
  const paginatedUsers = computed(() => {
    const start = (userPage.value - 1) * userPageSize.value
    return filteredUsers.value.slice(start, start + userPageSize.value)
  })

  const selectedStudent = computed(() => {
    if (!activeCheck.value || selectedStudentId.value === null) {
      return null
    }
    return activeCheck.value.students.find((student) => student.id === selectedStudentId.value) ?? null
  })

  const isAdmin = computed(() => me.value?.role === 1)
  const isStudent = computed(() => me.value?.role === 2)
  const currentUserId = computed(() => me.value?.id)
  const isEditingUser = computed(() => editingUserStudentId.value.length > 0)
  const adminActiveNavLabel = computed(() => adminNavItems.find((item) => item.key === activeTab.value)?.label ?? '管理员工作台')

  watch(
    () => [userFilters.studentId, userFilters.realName, userFilters.role, userFilters.status, userPageSize.value],
    () => {
      userPage.value = 1
    },
  )

  watch(userTotalPages, (total) => {
    if (userPage.value > total) {
      userPage.value = total
    }
  })

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

  function resetFreeTimeForm() {
    Object.assign(freeTimeForm, createFreeTimeForm())
    editingFreeTimeId.value = null
  }

  function closeUserModal() {
    userModalOpen.value = false
    resetUserForm()
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
    userPage.value = page
  }

  function updateUserPageSize(size: number) {
    userPageSize.value = size
  }

  const adminFlow = useAdminFlow({
    me,
    users,
    courses,
    courseCalendar,
    dashboard,
    attendanceResults,
    freeTimes,
    userForm,
    profileForm,
    userPasswordForm,
    courseForm,
    editingUserStudentId,
    passwordTargetStudentId,
    userSaving,
    passwordResetting,
    profileSaving,
    courseSaving,
    adminError,
    showAdminToast: (message) => showScopedToast('admin', message),
    closeUserModal,
    closeUserPasswordModal,
    closeProfileModal,
  })

  const studentFlow = useStudentFlow({
    availableCourses,
    freeTimes,
    activeCheck,
    selectedStudentId,
    editingFreeTimeId,
    freeTimeForm,
    freeTimeSaving,
    attendanceCompleting,
    studentError,
    resetFreeTimeForm,
    showStudentToast: (message) => showScopedToast('student', message),
    statusName,
  })

  async function loadRoleData() {
    if (!me.value) {
      return
    }

    if (me.value.role === 1) {
      clearAdminNotices()
      await adminFlow.loadAdminData()
      return
    }

    clearStudentNotices()
    await studentFlow.loadStudentData()
  }

  function resetAppData() {
    users.value = []
    courses.value = []
    courseCalendar.value = []
    dashboard.value = null
    attendanceResults.value = []
    freeTimes.value = []
    availableCourses.value = []
    activeCheck.value = null
    selectedStudentId.value = null
    editingFreeTimeId.value = null
  }

  function closeAllAdminModals() {
    closeUserModal()
    closePasswordModal()
    closeProfileModal()
    closeUserPasswordModal()
  }

  const sessionFlow = useSessionFlow({
    me,
    booting,
    initialized,
    authLoading,
    setupLoading,
    loginError,
    setupError,
    activeTab: activeTab as Ref<string>,
    loginForm,
    setupForm,
    loadRoleData,
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

  async function saveFreeTime() {
    await studentFlow.saveFreeTime()
  }

  function editFreeTime(item: FreeTimeItem) {
    studentFlow.editFreeTime(item)
    activeTab.value = 'availability'
  }

  async function removeFreeTime(id: number) {
    await studentFlow.removeFreeTime(id)
  }

  async function createUser() {
    await adminFlow.createUser()
  }

  async function resetUserPassword() {
    await adminFlow.resetUserPassword()
  }

  async function updateProfile() {
    await adminFlow.updateProfile()
  }

  async function setUserStatus(studentId: string, status: number) {
    await adminFlow.setUserStatus(studentId, status)
  }

  async function createCourse() {
    await adminFlow.createCourse()
  }

  async function openCourse(course: AvailableCourseItem) {
    await studentFlow.openCourse(course)
  }

  async function updateStudentStatus(detailId: number, status: StatusCode) {
    await studentFlow.updateStudentStatus(detailId, status)
  }

  async function updateAdminStatus(detailId: number, status: StatusCode) {
    await adminFlow.updateAdminStatus(detailId, status)
  }

  async function completeAttendance() {
    await studentFlow.completeAttendance(studentFlow.loadStudentData)
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

  onMounted(() => {
    void restoreSession()
  })

  const adminWorkspaceProps = computed(() => ({
    me: me.value!,
    activeTab: activeTab.value,
    pageError: adminError.value,
    toast: adminToast.value,
    adminActiveNavLabel: adminActiveNavLabel.value,
    adminStats: adminStats.value,
    courseCalendar: courseCalendar.value,
    freeTimes: freeTimes.value,
    users: paginatedUsers.value,
    currentUserId: currentUserId.value,
    courses: courses.value,
    attendanceResults: attendanceResults.value,
    userForm,
    userFilters,
    userModalOpen: userModalOpen.value,
    isEditingUser: isEditingUser.value,
    creatingUser: userSaving.value,
    userPage: userPage.value,
    userPageSize: userPageSize.value,
    userTotalPages: userTotalPages.value,
    userPageOptions: USER_PAGE_OPTIONS,
    userPasswordModalOpen: userPasswordModalOpen.value,
    userPasswordForm,
    passwordTargetName: passwordTargetName.value,
    passwordResetting: passwordResetting.value,
    courseForm,
    creatingCourse: courseSaving.value,
    profileForm,
    profileModalOpen: profileModalOpen.value,
    profileSaving: profileSaving.value,
    passwordForm,
    passwordModalOpen: passwordModalOpen.value,
    changingPassword: passwordSaving.value,
    roleName,
    statusName,
    statusClass,
    slotLabel,
  }))

  const adminWorkspaceHandlers = {
    'update:activeTab': (value: AppTab) => {
      activeTab.value = value
    },
    logout,
    openCreateUserModal,
    openEditUserModal,
    closeUserModal,
    openUserPasswordModal,
    closeUserPasswordModal,
    resetUserPassword,
    updateUserPage,
    updateUserPageSize,
    openProfileModal,
    closeProfileModal,
    updateProfile,
    openPasswordModal,
    closePasswordModal,
    createUser,
    setUserStatus,
    createCourse,
    updateAdminStatus,
    changePassword,
  }

  const studentWorkspaceProps = computed(() => ({
    me: me.value!,
    activeTab: activeTab.value,
    pageError: studentError.value,
    toast: studentToast.value,
    availableCourses: availableCourses.value,
    activeCheck: activeCheck.value,
    selectedStudent: selectedStudent.value,
    selectedStudentId: selectedStudentId.value,
    freeTimes: freeTimes.value,
    freeTimeForm,
    editingFreeTimeId: editingFreeTimeId.value,
    passwordForm,
    savingFreeTime: freeTimeSaving.value,
    completingAttendance: attendanceCompleting.value,
    changingPassword: passwordSaving.value,
    roleName,
    statusName,
    statusClass,
    slotLabel,
  }))

  const studentWorkspaceHandlers = {
    'update:activeTab': (value: AppTab) => {
      activeTab.value = value
    },
    'update:selectedStudentId': (value: number) => {
      selectedStudentId.value = value
    },
    logout,
    openCourse,
    updateStudentStatus,
    completeAttendance,
    saveFreeTime,
    editFreeTime,
    removeFreeTime,
    resetFreeTimeForm,
    changePassword,
  }

  return {
    activeCheck,
    activeTab,
    adminActiveNavLabel,
    adminError,
    adminStats,
    adminToast,
    attendanceCompleting,
    attendanceResults,
    authLoading,
    availableCourses,
    booting,
    changePassword,
    closePasswordModal,
    closeProfileModal,
    closeUserModal,
    closeUserPasswordModal,
    completeAttendance,
    courseCalendar,
    courseForm,
    courseSaving,
    courses,
    createCourse,
    createUser,
    currentUserId,
    editFreeTime,
    editingFreeTimeId,
    filteredUsers,
    freeTimeForm,
    freeTimeSaving,
    freeTimes,
    initializeSystem,
    initialized,
    isAdmin,
    isEditingUser,
    isStudent,
    login,
    loginError,
    loginForm,
    logout,
    me,
    openCourse,
    openCreateUserModal,
    openEditUserModal,
    openPasswordModal,
    openProfileModal,
    openUserPasswordModal,
    paginatedUsers,
    passwordForm,
    passwordModalOpen,
    passwordResetting,
    passwordSaving,
    passwordTargetName,
    profileForm,
    profileModalOpen,
    profileSaving,
    removeFreeTime,
    resetFreeTimeForm,
    resetUserPassword,
    roleName,
    saveFreeTime,
    selectedStudent,
    selectedStudentId,
    setUserStatus,
    setupError,
    setupForm,
    setupLoading,
    slotLabel,
    statusClass,
    statusName,
    studentError,
    studentWorkspaceHandlers,
    studentWorkspaceProps,
    studentToast,
    updateAdminStatus,
    updateProfile,
    updateStudentStatus,
    updateUserPage,
    updateUserPageSize,
    userFilters,
    userForm,
    userModalOpen,
    userPage,
    userPageOptions: USER_PAGE_OPTIONS,
    userPageSize,
    userPasswordForm,
    userPasswordModalOpen,
    userSaving,
    userTotalPages,
    users,
    adminWorkspaceHandlers,
    adminWorkspaceProps,
  }
}
