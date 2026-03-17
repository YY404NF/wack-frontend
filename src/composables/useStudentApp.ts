import { computed, type Ref } from 'vue'

import type { AvailableCourseItem, FreeTimeItem, SessionUser, SystemSetting } from '../api'
import type { AppTab } from '../constants'
import { useStudentFlow } from './app/useStudentFlow'
import { roleName, slotLabel } from './app/view'
import { createEmptyFreeTimeDraft, getCurrentAcademicTerm, type FreeTimeDraft } from '../utils/free-time'

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
  freeTimes: Ref<FreeTimeItem[]>
  freeTimeModalOpen: Ref<boolean>
  freeTimeTerm: Ref<string>
  freeTimeDraft: Ref<FreeTimeDraft>
  freeTimeForm: FreeTimeForm
  editingFreeTimeId: Ref<number | null>
  passwordForm: PasswordForm
  passwordModalOpen: Ref<boolean>
  freeTimeSaving: Ref<boolean>
  passwordSaving: Ref<boolean>
  studentCoreLoaded: Ref<boolean>
  studentFreeTimesLoaded: Ref<boolean>
  resetFreeTimeForm: () => void
  showScopedToast: (target: 'admin' | 'student', message: string) => void
  setActiveTab: (tab: AppTab, mode?: 'push' | 'replace') => Promise<void>
  openPasswordModal: () => void
  closePasswordModal: () => void
  changePassword: () => Promise<void>
}

export function useStudentApp(deps: StudentAppDeps) {
  const studentFlow = useStudentFlow({
    availableCourses: deps.availableCourses,
    freeTimes: deps.freeTimes,
    systemSettings: deps.systemSettings,
    editingFreeTimeId: deps.editingFreeTimeId,
    freeTimeModalOpen: deps.freeTimeModalOpen,
    freeTimeTerm: deps.freeTimeTerm,
    freeTimeDraft: deps.freeTimeDraft,
    freeTimeForm: deps.freeTimeForm,
    freeTimeSaving: deps.freeTimeSaving,
    studentError: deps.studentError,
    resetFreeTimeForm: deps.resetFreeTimeForm,
    showStudentToast: (message) => deps.showScopedToast('student', message),
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

  async function loadRoleData() {
    deps.studentFreeTimesLoaded.value = false
    await loadStudentCoreData(true)
  }

  async function saveFreeTime() {
    await ensureStudentFreeTimesLoaded()
    await studentFlow.saveFreeTime()
    deps.studentFreeTimesLoaded.value = true
  }

  async function openFreeTimeModal() {
    deps.freeTimeTerm.value = getCurrentAcademicTerm()
    await ensureStudentFreeTimesLoaded()
    studentFlow.syncFreeTimeDraft()
    deps.freeTimeModalOpen.value = true
  }

  function closeFreeTimeModal() {
    deps.freeTimeModalOpen.value = false
  }

  function toggleFreeTimeWeek(payload: { weekday: number; section: number; weekNo: number }) {
    studentFlow.toggleFreeTimeWeek(payload)
  }

  function toggleFreeTimeBlock(payload: { weekday: number; section: number }) {
    studentFlow.toggleFreeTimeBlock(payload)
  }

  async function saveFreeTimeDraft() {
    await ensureStudentFreeTimesLoaded()
    await studentFlow.saveFreeTimeDraft()
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

  const openPasswordModal = deps.openPasswordModal
  const closePasswordModal = deps.closePasswordModal
  const changePassword = deps.changePassword

  const studentWorkspaceProps = computed(() => ({
    me: deps.me.value!,
    activeTab: deps.activeTab.value,
    pageError: deps.studentError.value,
    toast: deps.studentToast.value,
    systemSettings: deps.systemSettings.value,
    availableCourses: deps.availableCourses.value,
    freeTimes: deps.freeTimes.value,
    freeTimeModalOpen: deps.freeTimeModalOpen.value,
    freeTimeDraft: deps.freeTimeDraft.value,
    freeTimeTerm: deps.freeTimeTerm.value,
    freeTimeForm: deps.freeTimeForm,
    editingFreeTimeId: deps.editingFreeTimeId.value,
    passwordForm: deps.passwordForm,
    passwordModalOpen: deps.passwordModalOpen.value,
    savingFreeTime: deps.freeTimeSaving.value,
    changingPassword: deps.passwordSaving.value,
    roleName,
    slotLabel,
  }))

  const studentWorkspaceHandlers = {
    'update:activeTab': (value: AppTab) => {
      void deps.setActiveTab(value, 'push')
    },
    openFreeTimeModal,
    closeFreeTimeModal,
    toggleFreeTimeWeek,
    toggleFreeTimeBlock,
    saveFreeTimeDraft,
    saveFreeTime,
    editFreeTime,
    removeFreeTime,
    resetFreeTimeForm: deps.resetFreeTimeForm,
    openPasswordModal,
    closePasswordModal,
    changePassword,
  }

  function resetStudentState() {
    deps.availableCourses.value = []
    deps.editingFreeTimeId.value = null
    deps.freeTimeModalOpen.value = false
    deps.freeTimeTerm.value = getCurrentAcademicTerm()
    deps.freeTimeDraft.value = createEmptyFreeTimeDraft()
    deps.studentCoreLoaded.value = false
    deps.studentFreeTimesLoaded.value = false
  }

  return {
    loadStudentCoreData,
    ensureStudentFreeTimesLoaded,
    loadRoleData,
    saveFreeTime,
    editFreeTime,
    removeFreeTime,
    studentWorkspaceProps,
    studentWorkspaceHandlers,
    resetStudentState,
  }
}
