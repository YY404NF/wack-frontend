import { computed, type Ref } from 'vue'

import type { AttendanceCheckDetail, AvailableCourseItem, FreeTimeItem, SessionUser, SystemSetting } from '../api'
import type { AppTab, StatusCode } from '../constants'
import { useStudentFlow } from './app/useStudentFlow'
import { roleName, slotLabel, statusClass, statusName } from './app/view'

type FreeTimeForm = {
  term: string
  weekday: number
  section: number
  freeWeeks: string
}

type PasswordForm = {
  oldPassword: string
  newPassword: string
  confirmNewPassword: string
}

type StudentAppDeps = {
  me: Ref<SessionUser | null>
  activeTab: Ref<AppTab>
  studentError: Ref<string>
  studentToast: Ref<string>
  systemSettings: Ref<SystemSetting | null>
  availableCourses: Ref<AvailableCourseItem[]>
  activeCheck: Ref<AttendanceCheckDetail | null>
  selectedStudentId: Ref<number | null>
  freeTimes: Ref<FreeTimeItem[]>
  freeTimeForm: FreeTimeForm
  editingFreeTimeId: Ref<number | null>
  passwordForm: PasswordForm
  freeTimeSaving: Ref<boolean>
  attendanceCompleting: Ref<boolean>
  passwordSaving: Ref<boolean>
  studentCoreLoaded: Ref<boolean>
  studentFreeTimesLoaded: Ref<boolean>
  studentActiveCheckLoaded: Ref<boolean>
  resetFreeTimeForm: () => void
  showScopedToast: (target: 'admin' | 'student', message: string) => void
  setActiveTab: (tab: AppTab, mode?: 'push' | 'replace') => Promise<void>
  changePassword: () => Promise<void>
}

export function useStudentApp(deps: StudentAppDeps) {
  const selectedStudent = computed(() => deps.activeCheck.value?.students.find((item) => item.id === deps.selectedStudentId.value) ?? null)

  const studentFlow = useStudentFlow({
    availableCourses: deps.availableCourses,
    freeTimes: deps.freeTimes,
    systemSettings: deps.systemSettings,
    activeCheck: deps.activeCheck,
    selectedStudentId: deps.selectedStudentId,
    editingFreeTimeId: deps.editingFreeTimeId,
    freeTimeForm: deps.freeTimeForm,
    freeTimeSaving: deps.freeTimeSaving,
    attendanceCompleting: deps.attendanceCompleting,
    studentError: deps.studentError,
    resetFreeTimeForm: deps.resetFreeTimeForm,
    showStudentToast: (message) => deps.showScopedToast('student', message),
    statusName,
  })

  async function loadStudentCoreData(force = false) {
    if (!force && deps.studentCoreLoaded.value) {
      return
    }
    await studentFlow.loadStudentCoreData()
    deps.studentCoreLoaded.value = true
  }

  async function ensureStudentFreeTimesLoaded(force = false) {
    if (!force && deps.studentFreeTimesLoaded.value) {
      return
    }
    await studentFlow.loadStudentFreeTimes()
    deps.studentFreeTimesLoaded.value = true
  }

  async function ensureStudentActiveCheckLoaded(force = false) {
    await loadStudentCoreData(force)
    if (!force && deps.studentActiveCheckLoaded.value) {
      return
    }
    await studentFlow.ensureActiveCheck()
    deps.studentActiveCheckLoaded.value = true
  }

  async function loadRoleData() {
    deps.studentFreeTimesLoaded.value = false
    deps.studentActiveCheckLoaded.value = false
    await loadStudentCoreData(true)
  }

  async function saveFreeTime() {
    await ensureStudentFreeTimesLoaded()
    await studentFlow.saveFreeTime()
    deps.studentFreeTimesLoaded.value = true
  }

  function editFreeTime(item: FreeTimeItem) {
    studentFlow.editFreeTime(item)
    void deps.setActiveTab('settings', 'push')
  }

  async function removeFreeTime(id: number) {
    await ensureStudentFreeTimesLoaded()
    await studentFlow.removeFreeTime(id)
  }

  async function openCourse(course: AvailableCourseItem) {
    await loadStudentCoreData()
    await studentFlow.openCourse(course)
    deps.studentActiveCheckLoaded.value = true
  }

  async function updateStudentStatus(detailId: number, status: StatusCode) {
    await studentFlow.updateStudentStatus(detailId, status)
  }

  async function completeAttendance() {
    await studentFlow.completeAttendance(async () => {
      await loadStudentCoreData(true)
      deps.studentActiveCheckLoaded.value = false
      if (deps.studentFreeTimesLoaded.value) {
        await ensureStudentFreeTimesLoaded(true)
      }
      if (deps.activeTab.value === 'student') {
        await ensureStudentActiveCheckLoaded(true)
      }
    })
  }

  const studentWorkspaceProps = computed(() => ({
    me: deps.me.value!,
    activeTab: deps.activeTab.value,
    pageError: deps.studentError.value,
    toast: deps.studentToast.value,
    systemSettings: deps.systemSettings.value,
    availableCourses: deps.availableCourses.value,
    activeCheck: deps.activeCheck.value,
    selectedStudent: selectedStudent.value,
    selectedStudentId: deps.selectedStudentId.value,
    freeTimes: deps.freeTimes.value,
    freeTimeForm: deps.freeTimeForm,
    editingFreeTimeId: deps.editingFreeTimeId.value,
    passwordForm: deps.passwordForm,
    savingFreeTime: deps.freeTimeSaving.value,
    completingAttendance: deps.attendanceCompleting.value,
    changingPassword: deps.passwordSaving.value,
    roleName,
    statusName,
    statusClass,
    slotLabel,
  }))

  const studentWorkspaceHandlers = {
    'update:activeTab': (value: AppTab) => {
      void deps.setActiveTab(value, 'push')
    },
    'update:selectedStudentId': (value: number) => {
      deps.selectedStudentId.value = value
    },
    openCourse,
    updateStudentStatus,
    completeAttendance,
    saveFreeTime,
    editFreeTime,
    removeFreeTime,
    resetFreeTimeForm: deps.resetFreeTimeForm,
    changePassword: deps.changePassword,
  }

  function resetStudentState() {
    deps.availableCourses.value = []
    deps.activeCheck.value = null
    deps.selectedStudentId.value = null
    deps.editingFreeTimeId.value = null
    deps.studentCoreLoaded.value = false
    deps.studentFreeTimesLoaded.value = false
    deps.studentActiveCheckLoaded.value = false
  }

  return {
    selectedStudent,
    loadStudentCoreData,
    ensureStudentFreeTimesLoaded,
    ensureStudentActiveCheckLoaded,
    loadRoleData,
    saveFreeTime,
    editFreeTime,
    removeFreeTime,
    openCourse,
    updateStudentStatus,
    completeAttendance,
    studentWorkspaceProps,
    studentWorkspaceHandlers,
    resetStudentState,
  }
}
