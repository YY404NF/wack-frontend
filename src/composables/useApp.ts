import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { api, type SessionUser } from '../api'
import { createLoginForm, createPasswordForm, createSetupForm } from './app/forms'
import { useAdminState } from './app/useAdminState'
import { useAppRouting } from './app/useAppRouting'
import { useAppSession } from './app/useAppSession'
import { useStudentState } from './app/useStudentState'

export function useApp() {
  const router = useRouter()
  const route = useRoute()

  const me = ref<SessionUser | null>(null)
  const authLoading = ref(false)
  const setupLoading = ref(false)
  const passwordSaving = ref(false)
  const freeTimeSaving = ref(false)
  const attendanceCompleting = ref(false)
  const booting = ref(true)
  const initialized = ref(true)
  const isAdmin = computed(() => me.value?.role === 1)

  const loginError = ref('')
  const setupError = ref('')

  const loginForm = reactive(createLoginForm())
  const setupForm = reactive(createSetupForm())
  const passwordForm = reactive(createPasswordForm())
  const passwordModalOpen = ref(false)

  let adminState!: ReturnType<typeof useAdminState>
  let studentState!: ReturnType<typeof useStudentState>

  function showScopedToast(target: 'admin' | 'student', message: string) {
    const toastRef = target === 'admin' ? adminState.adminToast : studentState.studentToast
    toastRef.value = message
    window.setTimeout(() => {
      if (toastRef.value === message) {
        toastRef.value = ''
      }
    }, 2200)
  }

  function closePasswordModal() {
    passwordModalOpen.value = false
    Object.assign(passwordForm, createPasswordForm())
  }

  function openPasswordModal() {
    closePasswordModal()
    passwordModalOpen.value = true
  }

  async function changePassword() {
    passwordSaving.value = true
    if (me.value?.role === 1) {
      adminState.adminError.value = ''
    } else {
      studentState.studentError.value = ''
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
        adminState.adminError.value = message
      } else {
        studentState.studentError.value = message
      }
    } finally {
      passwordSaving.value = false
    }
  }

  async function ensureStudentFreeTimesLoaded(force = false) {
    await studentState.ensureStudentFreeTimesLoaded(force)
  }

  async function ensureStudentActiveCheckLoaded(force = false) {
    await studentState.ensureStudentActiveCheckLoaded(force)
  }

  const appRouting = useAppRouting({
    router,
    route,
    me,
    booting,
    initialized,
    ensureStudentFreeTimesLoaded,
    ensureStudentActiveCheckLoaded,
  })

  studentState = useStudentState({
    me,
    activeTab: appRouting.activeTab,
    setActiveTab: appRouting.setActiveTab,
    showScopedToast,
    changePassword,
    openPasswordModal,
    closePasswordModal,
    passwordForm,
    passwordModalOpen,
    freeTimeSaving,
    attendanceCompleting,
    passwordSaving,
  })

  adminState = useAdminState({
    me,
    activeTab: appRouting.activeTab,
    passwordForm,
    passwordModalOpen,
    passwordSaving,
    showScopedToast,
    setActiveTab: appRouting.setActiveTab,
    logout: () => appSession.logout(),
    changePassword,
    closePasswordModal,
    openPasswordModal,
  })

  function clearAllNotices() {
    setupError.value = ''
    loginError.value = ''
    adminState.clearNotices()
    studentState.clearNotices()
  }

  async function loadRoleData() {
    if (!me.value) {
      return
    }
    if (me.value.role === 1) {
      await adminState.loadRoleData()
      return
    }
    adminState.resetState()
    await studentState.loadRoleData()
  }

  function resetAppData() {
    adminState.resetState()
    studentState.resetState()
  }

  function closeAllAdminModals() {
    adminState.closeAllModals()
  }

  const appSession = useAppSession({
    router,
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
    resolveTabForRole: appRouting.resolveTabForRole,
    setActiveTab: appRouting.setActiveTab,
    clearAllNotices,
    resetAppData,
    closeAllAdminModals,
  })

  onMounted(() => {
    void appSession.restoreSession()
  })

  return {
    authLoading,
    booting,
    initializeSystem: appSession.initializeSystem,
    initialized,
    isAdmin,
    login: appSession.login,
    loginError,
    loginForm,
    me,
    setupError,
    setupForm,
    setupLoading,
    studentWorkspaceHandlers: {
      ...studentState.studentWorkspaceHandlers,
      openPasswordModal,
      closePasswordModal,
      logout: appSession.logout,
    },
    studentWorkspaceProps: studentState.studentWorkspaceProps,
    adminWorkspaceHandlers: adminState.adminWorkspaceHandlers,
    adminWorkspaceProps: adminState.adminWorkspaceProps,
  }
}
