import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  api,
  type AttendanceCheckDetail,
  type AttendanceResultItem,
  type AvailableCourseItem,
  type ClassItem,
  type CourseCalendarItem,
  type CourseItem,
  type DashboardSummary,
  type FreeTimeItem,
  type SessionUser,
  type UserItem,
} from '../api'
import { adminTabKeys, studentTabKeys, type AppTab, type StatusCode } from '../constants'
import {
  createClassFilters,
  createClassForm,
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

  const classFilters = reactive(createClassFilters())

  const courseForm = reactive(createCourseForm())

  const me = ref<SessionUser | null>(null)
  const authLoading = ref(false)
  const setupLoading = ref(false)
  const userSaving = ref(false)
  const passwordResetting = ref(false)
  const profileSaving = ref(false)
  const courseSaving = ref(false)
  const classSaving = ref(false)
  const classDeleting = ref(false)
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
  const classes = ref<ClassItem[]>([])
  const courses = ref<CourseItem[]>([])
  const courseCalendar = ref<CourseCalendarItem[]>([])
  const dashboard = ref<DashboardSummary | null>(null)
  const attendanceResults = ref<AttendanceResultItem[]>([])
  const freeTimes = ref<FreeTimeItem[]>([])
  const availableCourses = ref<AvailableCourseItem[]>([])
  const activeCheck = ref<AttendanceCheckDetail | null>(null)

  const editingFreeTimeId = ref<number | null>(null)
  const editingUserStudentId = ref('')
  const editingClassId = ref<number | null>(null)
  const passwordTargetStudentId = ref('')
  const passwordTargetName = ref('')
  const deletingClassId = ref<number | null>(null)
  const deletingClassName = ref('')
  const selectedStudentId = ref<number | null>(null)

  const userModalOpen = ref(false)
  const classModalOpen = ref(false)
  const deleteClassModalOpen = ref(false)
  const passwordModalOpen = ref(false)
  const profileModalOpen = ref(false)
  const userPasswordModalOpen = ref(false)
  const activeTab = ref<AppTab>('overview')

  const studentSegmentToTab = {
    check: 'student',
    availability: 'availability',
    settings: 'settings',
  } as const

  const tabToStudentSegment: Record<'student' | 'availability' | 'settings', keyof typeof studentSegmentToTab> = {
    student: 'check',
    availability: 'availability',
    settings: 'settings',
  }

  function defaultTabForRole(role?: number): AppTab {
    return role === 1 ? 'overview' : 'student'
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
  }

  function resolveTabForRole(role?: number): AppTab {
    const tab = readTabFromLocation()
    if (tab && tabAllowedForRole(tab, role)) {
      return tab
    }
    return defaultTabForRole(role)
  }

  const userPage = ref(1)
  const userPageSize = ref(10)
  const classPage = ref(1)
  const classPageSize = ref(10)

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

  const filteredClasses = computed(() =>
    classes.value.filter((item) => {
      const byGrade = !classFilters.grade || String(item.grade).includes(classFilters.grade.trim())
      const byMajor = !classFilters.majorName || item.major_name.includes(classFilters.majorName.trim())
      const byName = !classFilters.className || item.class_name.includes(classFilters.className.trim())
      return byGrade && byMajor && byName
    }),
  )

  const userTotalPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / userPageSize.value)))
  const classTotalPages = computed(() => Math.max(1, Math.ceil(filteredClasses.value.length / classPageSize.value)))
  const paginatedUsers = computed(() => {
    const start = (userPage.value - 1) * userPageSize.value
    return filteredUsers.value.slice(start, start + userPageSize.value)
  })
  const paginatedClasses = computed(() => {
    const start = (classPage.value - 1) * classPageSize.value
    return filteredClasses.value.slice(start, start + classPageSize.value)
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
  const isEditingClass = computed(() => editingClassId.value !== null)
  watch(
    () => [userFilters.studentId, userFilters.realName, userFilters.role, userFilters.status, userPageSize.value],
    () => {
      userPage.value = 1
    },
  )

  watch(
    () => [classFilters.grade, classFilters.majorName, classFilters.className, classPageSize.value],
    () => {
      classPage.value = 1
    },
  )

  watch(userTotalPages, (total) => {
    if (userPage.value > total) {
      userPage.value = total
    }
  })

  watch(classTotalPages, (total) => {
    if (classPage.value > total) {
      classPage.value = total
    }
  })

  watch(activeTab, () => {
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

  function resetClassForm() {
    Object.assign(classForm, createClassForm())
    editingClassId.value = null
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

  function closeDeleteClassModal() {
    deleteClassModalOpen.value = false
    deletingClassId.value = null
    deletingClassName.value = ''
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
    userPage.value = page
  }

  function updateUserPageSize(size: number) {
    userPageSize.value = size
  }

  function updateClassPage(page: number) {
    classPage.value = page
  }

  function updateClassPageSize(size: number) {
    classPageSize.value = size
  }

  const adminFlow = useAdminFlow({
    me,
    users,
    classes,
    courses,
    courseCalendar,
    dashboard,
    attendanceResults,
    freeTimes,
    userForm,
    profileForm,
    userPasswordForm,
    courseForm,
    classForm,
    editingUserStudentId,
    editingClassId,
    passwordTargetStudentId,
    deletingClassId,
    userSaving,
    passwordResetting,
    profileSaving,
    courseSaving,
    classSaving,
    classDeleting,
    adminError,
    showAdminToast: (message) => showScopedToast('admin', message),
    closeUserModal,
    closeUserPasswordModal,
    closeProfileModal,
    closeClassModal,
    closeDeleteClassModal,
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
    classes.value = []
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
    closeClassModal()
    closeDeleteClassModal()
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

  async function saveFreeTime() {
    await studentFlow.saveFreeTime()
  }

  function editFreeTime(item: FreeTimeItem) {
    studentFlow.editFreeTime(item)
    void setActiveTab('availability', 'push')
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

  async function saveClass() {
    await adminFlow.saveClass()
  }

  async function deleteClass() {
    await adminFlow.deleteClass()
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

  const adminWorkspaceProps = computed(() => ({
    me: me.value!,
    activeTab: activeTab.value,
    pageError: adminError.value,
    toast: adminToast.value,
    adminStats: adminStats.value,
    courseCalendar: courseCalendar.value,
    freeTimes: freeTimes.value,
    classes: paginatedClasses.value,
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
    classForm,
    classFilters,
    classModalOpen: classModalOpen.value,
    deleteClassModalOpen: deleteClassModalOpen.value,
    isEditingClass: isEditingClass.value,
    classSaving: classSaving.value,
    classDeleting: classDeleting.value,
    classPage: classPage.value,
    classPageSize: classPageSize.value,
    classTotalPages: classTotalPages.value,
    classPageOptions: USER_PAGE_OPTIONS,
    deletingClassName: deletingClassName.value,
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
      void setActiveTab(value, 'push')
    },
    logout,
    openCreateClassModal,
    openEditClassModal,
    closeClassModal,
    openDeleteClassModal,
    closeDeleteClassModal,
    saveClass,
    deleteClass,
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
      void setActiveTab(value, 'push')
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
    adminError,
    adminStats,
    adminToast,
    attendanceCompleting,
    attendanceResults,
    authLoading,
    availableCourses,
    booting,
    classDeleting,
    classFilters,
    classForm,
    classModalOpen,
    classPage,
    classPageSize,
    classSaving,
    classTotalPages,
    classes,
    changePassword,
    closePasswordModal,
    closeProfileModal,
    closeClassModal,
    closeDeleteClassModal,
    closeUserModal,
    closeUserPasswordModal,
    completeAttendance,
    courseCalendar,
    courseForm,
    courseSaving,
    courses,
    deleteClass,
    deleteClassModalOpen,
    deletingClassName,
    createCourse,
    createUser,
    currentUserId,
    editFreeTime,
    editingFreeTimeId,
    filteredClasses,
    filteredUsers,
    freeTimeForm,
    freeTimeSaving,
    freeTimes,
    initializeSystem,
    initialized,
    isAdmin,
    isEditingClass,
    isEditingUser,
    isStudent,
    login,
    loginError,
    loginForm,
    logout,
    me,
    openCourse,
    openCreateClassModal,
    openCreateUserModal,
    openDeleteClassModal,
    openEditClassModal,
    openEditUserModal,
    openPasswordModal,
    openProfileModal,
    openUserPasswordModal,
    paginatedClasses,
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
    saveClass,
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
    updateClassPage,
    updateClassPageSize,
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
