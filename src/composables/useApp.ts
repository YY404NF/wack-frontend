import { computed, onMounted, reactive, ref } from 'vue'

import {
  api,
  clearToken,
  getToken,
  setToken,
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
import { adminNavItems, roleLabels, sectionLabels, statusLabels, type AppTab, type StatusCode, weekdayLabels } from '../constants'

export function useApp() {
  const loginForm = reactive({
    studentId: '',
    password: '',
  })

  const setupForm = reactive({
    studentId: '',
    realName: '',
    password: '',
    confirmPassword: '',
  })

  const passwordForm = reactive({
    oldPassword: '',
    newPassword: '',
  })

  const freeTimeForm = reactive({
    term: '2025-2026-2',
    weekday: 1,
    section: 1,
    freeWeeks: '',
  })

  const userForm = reactive({
    studentId: '',
    realName: '',
    password: '123456',
    role: 2,
    status: 1,
  })

  const courseForm = reactive({
    courseId: '',
    term: '2025-2026-2',
    courseName: '',
    teacherName: '',
    studentIds: '',
    sessionNo: 1,
    weekNo: 1,
    weekday: 1,
    section: 1,
    buildingName: '教4',
    roomName: '509',
  })

  const me = ref<SessionUser | null>(null)
  const authLoading = ref(false)
  const setupLoading = ref(false)
  const userSaving = ref(false)
  const courseSaving = ref(false)
  const passwordSaving = ref(false)
  const freeTimeSaving = ref(false)
  const attendanceCompleting = ref(false)
  const booting = ref(true)
  const initialized = ref(true)
  const pageError = ref('')
  const toast = ref('')

  const users = ref<UserItem[]>([])
  const courses = ref<CourseItem[]>([])
  const courseCalendar = ref<CourseCalendarItem[]>([])
  const dashboard = ref<DashboardSummary | null>(null)
  const attendanceResults = ref<AttendanceResultItem[]>([])
  const freeTimes = ref<FreeTimeItem[]>([])
  const editingFreeTimeId = ref<number | null>(null)

  const availableCourses = ref<AvailableCourseItem[]>([])
  const activeCheck = ref<AttendanceCheckDetail | null>(null)
  const selectedStudentId = ref<number | null>(null)
  const activeTab = ref<AppTab>('overview')

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

  const selectedStudent = computed(() => {
    if (!activeCheck.value || selectedStudentId.value === null) {
      return null
    }
    return activeCheck.value.students.find((student) => student.id === selectedStudentId.value) ?? null
  })

  const isAdmin = computed(() => me.value?.role === 1)
  const isStudent = computed(() => me.value?.role === 2)
  const adminActiveNav = computed(() => adminNavItems.find((item) => item.key === activeTab.value))

  function showToast(message: string) {
    toast.value = message
    window.setTimeout(() => {
      if (toast.value === message) {
        toast.value = ''
      }
    }, 2200)
  }

  function roleName(role?: number) {
    return role ? roleLabels[role] ?? `角色 ${role}` : '-'
  }

  function statusName(status: number) {
    return statusLabels[status as StatusCode] ?? `状态 ${status}`
  }

  function slotLabel(weekday: number, section: number) {
    return `${weekdayLabels[weekday] ?? `周${weekday}`} · ${sectionLabels[section] ?? `第 ${section} 段`}`
  }

  function statusClass(status: number) {
    return {
      'tag-good': status === 1,
      'tag-warn': status === 2,
      'tag-bad': status === 3,
      'tag-calm': status === 4,
      'tag-muted': status === 0,
    }
  }

  async function loadSetupStatus() {
    const status = await api.setupStatus()
    initialized.value = status.initialized
  }

  async function initializeSystem() {
    if (setupForm.password !== setupForm.confirmPassword) {
      pageError.value = '两次输入的密码不一致'
      return
    }

    setupLoading.value = true
    pageError.value = ''
    try {
      await api.initializeSystem({
        student_id: setupForm.studentId.trim(),
        real_name: setupForm.realName.trim(),
        password: setupForm.password,
      })
      initialized.value = true
      loginForm.studentId = setupForm.studentId
      loginForm.password = setupForm.password
      setupForm.studentId = ''
      setupForm.realName = ''
      setupForm.password = ''
      setupForm.confirmPassword = ''
      showToast('系统初始化完成，请使用新管理员账号登录')
    } catch (error) {
      pageError.value = error instanceof Error ? error.message : '初始化失败'
    } finally {
      setupLoading.value = false
    }
  }

  async function login() {
    authLoading.value = true
    pageError.value = ''
    try {
      const data = await api.login(loginForm.studentId.trim(), loginForm.password)
      setToken(data.token)
      me.value = data.user
      await loadRoleData()
      activeTab.value = data.user.role === 1 ? 'overview' : 'student'
      showToast('登录成功')
    } catch (error) {
      pageError.value = error instanceof Error ? error.message : '登录失败'
    } finally {
      authLoading.value = false
    }
  }

  async function restoreSession() {
    try {
      await loadSetupStatus()
      if (!initialized.value) {
        clearToken()
        me.value = null
        return
      }

      if (!getToken()) {
        return
      }

      me.value = await api.me()
      await loadRoleData()
      activeTab.value = me.value.role === 1 ? 'overview' : 'student'
    } catch {
      clearToken()
      me.value = null
    } finally {
      booting.value = false
    }
  }

  async function loadRoleData() {
    if (!me.value) {
      return
    }

    pageError.value = ''
    if (me.value.role === 1) {
      const [userPage, coursePage, calendar, summary, resultPage, freeTimeList] = await Promise.all([
        api.listUsers(),
        api.listCourses(),
        api.adminCourseCalendar(),
        api.adminAttendanceDashboard(),
        api.adminAttendanceResults(),
        api.adminFreeTimeCalendar(),
      ])
      users.value = userPage.items ?? []
      courses.value = coursePage.items ?? []
      courseCalendar.value = calendar ?? []
      dashboard.value = summary
      attendanceResults.value = resultPage.items ?? []
      freeTimes.value = freeTimeList ?? []
    } else {
      availableCourses.value = (await api.studentAvailableCourses()) ?? []
      const freeTimePage = await api.listFreeTimes()
      freeTimes.value = freeTimePage.items ?? []
      if (availableCourses.value.length > 0 && availableCourses.value[0].attendance_check_id) {
        await openCourse(availableCourses.value[0])
      }
    }
  }

  function logout() {
    clearToken()
    me.value = null
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

  function resetFreeTimeForm() {
    freeTimeForm.term = '2025-2026-2'
    freeTimeForm.weekday = 1
    freeTimeForm.section = 1
    freeTimeForm.freeWeeks = ''
    editingFreeTimeId.value = null
  }

  async function saveFreeTime() {
    freeTimeSaving.value = true
    pageError.value = ''
    try {
      const payload = {
        term: freeTimeForm.term.trim(),
        weekday: freeTimeForm.weekday,
        section: freeTimeForm.section,
        free_weeks: freeTimeForm.freeWeeks.trim(),
      }
      if (editingFreeTimeId.value) {
        await api.updateFreeTime(editingFreeTimeId.value, payload)
        showToast('空闲时间已更新')
      } else {
        await api.createFreeTime(payload)
        showToast('空闲时间已新增')
      }
      const freeTimePage = await api.listFreeTimes()
      freeTimes.value = freeTimePage.items ?? []
      resetFreeTimeForm()
    } catch (error) {
      pageError.value = error instanceof Error ? error.message : '保存空闲时间失败'
    } finally {
      freeTimeSaving.value = false
    }
  }

  function editFreeTime(item: FreeTimeItem) {
    freeTimeForm.term = item.term
    freeTimeForm.weekday = item.weekday
    freeTimeForm.section = item.section
    freeTimeForm.freeWeeks = item.free_weeks
    editingFreeTimeId.value = item.id
    activeTab.value = 'availability'
  }

  async function removeFreeTime(id: number) {
    pageError.value = ''
    try {
      await api.deleteFreeTime(id)
      freeTimes.value = freeTimes.value.filter((item) => item.id !== id)
      if (editingFreeTimeId.value === id) {
        resetFreeTimeForm()
      }
      showToast('空闲时间已删除')
    } catch (error) {
      pageError.value = error instanceof Error ? error.message : '删除空闲时间失败'
    }
  }

  async function createUser() {
    userSaving.value = true
    pageError.value = ''
    try {
      await api.createUser({
        student_id: userForm.studentId.trim(),
        real_name: userForm.realName.trim(),
        password: userForm.password,
        role: userForm.role,
        status: userForm.status,
      })
      userForm.studentId = ''
      userForm.realName = ''
      await loadRoleData()
      showToast('用户已创建')
    } catch (error) {
      pageError.value = error instanceof Error ? error.message : '创建用户失败'
    } finally {
      userSaving.value = false
    }
  }

  async function createCourse() {
    courseSaving.value = true
    pageError.value = ''
    try {
      const courseId = Number(courseForm.courseId)
      const studentIds = courseForm.studentIds
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)

      await api.createCourse({
        id: courseId,
        term: courseForm.term.trim(),
        course_name: courseForm.courseName.trim(),
        teacher_name: courseForm.teacherName.trim(),
        attendance_student_count: 0,
      })
      await api.replaceCourseStudents(courseId, studentIds)
      await api.replaceCourseSessions(courseId, [
        {
          session_no: courseForm.sessionNo,
          week_no: courseForm.weekNo,
          weekday: courseForm.weekday,
          section: courseForm.section,
          building_name: courseForm.buildingName.trim(),
          room_name: courseForm.roomName.trim(),
        },
      ])
      courseForm.courseId = ''
      courseForm.courseName = ''
      courseForm.teacherName = ''
      courseForm.studentIds = ''
      await loadRoleData()
      showToast('课程已创建')
    } catch (error) {
      pageError.value = error instanceof Error ? error.message : '创建课程失败'
    } finally {
      courseSaving.value = false
    }
  }

  async function openCourse(course: AvailableCourseItem) {
    pageError.value = ''
    try {
      activeCheck.value = await api.enterAttendanceCheck(course.course_session_id)
      selectedStudentId.value = activeCheck.value.students[0]?.id ?? null
      availableCourses.value = (await api.studentAvailableCourses()) ?? []
      showToast(`已进入 ${course.course_name}`)
    } catch (error) {
      pageError.value = error instanceof Error ? error.message : '进入查课失败'
    }
  }

  async function updateStudentStatus(detailId: number, status: StatusCode) {
    pageError.value = ''
    try {
      await api.updateAttendanceStatus(detailId, status)
      if (activeCheck.value) {
        const target = activeCheck.value.students.find((student) => student.id === detailId)
        if (target) {
          target.status = status
        }
      }
      const currentIndex = activeCheck.value?.students.findIndex((student) => student.id === detailId) ?? -1
      const nextStudent = currentIndex >= 0 ? activeCheck.value?.students[currentIndex + 1] : null
      selectedStudentId.value = nextStudent?.id ?? detailId
      showToast(`状态已更新为${statusName(status)}`)
    } catch (error) {
      pageError.value = error instanceof Error ? error.message : '更新状态失败'
    }
  }

  async function updateAdminStatus(detailId: number, status: StatusCode) {
    pageError.value = ''
    try {
      await api.adminUpdateAttendanceStatus(detailId, status)
      await loadRoleData()
      showToast('管理员修改已提交')
    } catch (error) {
      pageError.value = error instanceof Error ? error.message : '修改查课结果失败'
    }
  }

  async function completeAttendance() {
    if (!activeCheck.value) {
      return
    }
    attendanceCompleting.value = true
    pageError.value = ''
    try {
      await api.completeAttendanceCheck(activeCheck.value.attendance_check.id)
      await loadRoleData()
      activeCheck.value = null
      selectedStudentId.value = null
      showToast('本次查课已结束')
    } catch (error) {
      pageError.value = error instanceof Error ? error.message : '完成查课失败'
    } finally {
      attendanceCompleting.value = false
    }
  }

  async function changePassword() {
    passwordSaving.value = true
    pageError.value = ''
    try {
      await api.changePassword(passwordForm.oldPassword, passwordForm.newPassword)
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      showToast('密码已修改')
    } catch (error) {
      pageError.value = error instanceof Error ? error.message : '修改密码失败'
    } finally {
      passwordSaving.value = false
    }
  }

  onMounted(() => {
    void restoreSession()
  })

  return {
    activeCheck,
    activeTab,
    adminActiveNav,
    adminStats,
    authLoading,
    attendanceCompleting,
    availableCourses,
    booting,
    changePassword,
    completeAttendance,
    courseCalendar,
    courseForm,
    courses,
    courseSaving,
    createCourse,
    createUser,
    freeTimes,
    freeTimeForm,
    freeTimeSaving,
    initialized,
    initializeSystem,
    isAdmin,
    isStudent,
    login,
    loginForm,
    logout,
    me,
    openCourse,
    pageError,
    passwordForm,
    passwordSaving,
    editFreeTime,
    editingFreeTimeId,
    removeFreeTime,
    roleName,
    resetFreeTimeForm,
    saveFreeTime,
    selectedStudent,
    selectedStudentId,
    setupForm,
    setupLoading,
    showToast,
    slotLabel,
    statusClass,
    statusName,
    toast,
    updateAdminStatus,
    updateStudentStatus,
    userSaving,
    userForm,
    users,
    attendanceResults,
  }
}
