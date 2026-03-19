import { ref } from 'vue'
import type { Ref } from 'vue'

import type { AvailableCourseItem, FreeTimeItem, MetaSectionItem, SessionUser, SystemSetting } from '../../api'
import type { AppTab } from '../../constants'
import { createFreeTimeForm } from './forms'
import { useStudentApp } from '../useStudentApp'
import { createEmptyFreeTimeDraft, getCurrentAcademicTerm } from '../../utils/free-time'

type PasswordForm = {
  oldPassword: string
  newPassword: string
  confirmNewPassword: string
}

type UseStudentStateDeps = {
  me: Ref<SessionUser | null>
  activeTab: Ref<AppTab>
  setActiveTab: (tab: AppTab, mode?: 'push' | 'replace') => Promise<void>
  showScopedToast: (target: 'admin' | 'student', message: string) => void
  changePassword: () => Promise<void>
  openPasswordModal: () => void
  closePasswordModal: () => void
  passwordForm: PasswordForm
  passwordModalOpen: Ref<boolean>
  freeTimeSaving: Ref<boolean>
  passwordSaving: Ref<boolean>
}

export function useStudentState(deps: UseStudentStateDeps) {
  const studentError = ref('')
  const studentToast = ref('')
  const availableCourses = ref<AvailableCourseItem[]>([])
  const freeTimes = ref<FreeTimeItem[]>([])
  const systemSettings = ref<SystemSetting | null>(null)
  const currentSchedule = ref<'summer' | 'autumn'>('summer')
  const metaSections = ref<MetaSectionItem[]>([])
  const freeTimeModalOpen = ref(false)
  const freeTimeTerm = ref(getCurrentAcademicTerm())
  const freeTimeDraft = ref(createEmptyFreeTimeDraft())
  const freeTimeForm = ref(createFreeTimeForm()).value
  const editingFreeTimeId = ref<number | null>(null)
  const studentCoreLoaded = ref(false)
  const studentFreeTimesLoaded = ref(false)

  function resetFreeTimeForm() {
    Object.assign(freeTimeForm, createFreeTimeForm())
    editingFreeTimeId.value = null
  }

  const studentApp = useStudentApp({
    me: deps.me,
    activeTab: deps.activeTab,
    studentError,
    studentToast,
    systemSettings,
    currentSchedule,
    metaSections,
    availableCourses,
    freeTimes,
    freeTimeForm,
    freeTimeModalOpen,
    freeTimeTerm,
    freeTimeDraft,
    editingFreeTimeId,
    passwordForm: deps.passwordForm,
    passwordModalOpen: deps.passwordModalOpen,
    freeTimeSaving: deps.freeTimeSaving,
    passwordSaving: deps.passwordSaving,
    studentCoreLoaded,
    studentFreeTimesLoaded,
    resetFreeTimeForm,
    showScopedToast: deps.showScopedToast,
    setActiveTab: deps.setActiveTab,
    openPasswordModal: deps.openPasswordModal,
    closePasswordModal: deps.closePasswordModal,
    changePassword: deps.changePassword,
  })

  function clearNotices() {
    studentError.value = ''
    studentToast.value = ''
  }

  return {
    studentError,
    studentToast,
    freeTimes,
    systemSettings,
    currentSchedule,
    metaSections,
    ensureStudentFreeTimesLoaded: studentApp.ensureStudentFreeTimesLoaded,
    loadRoleData: studentApp.loadRoleData,
    clearNotices,
    resetState: studentApp.resetStudentState,
    studentWorkspaceProps: studentApp.studentWorkspaceProps,
    studentWorkspaceHandlers: studentApp.studentWorkspaceHandlers,
  }
}
