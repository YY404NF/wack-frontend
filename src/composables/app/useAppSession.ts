import type { Ref } from 'vue'
import type { Router } from 'vue-router'

import type { SessionUser } from '../../api'
import type { AppTab } from '../../constants'
import { useSessionFlow } from './useSessionFlow'

type LoginForm = {
  studentId: string
  password: string
}

type SetupForm = {
  studentId: string
  realName: string
  password: string
  confirmPassword: string
}

type UseAppSessionDeps = {
  router: Router
  me: Ref<SessionUser | null>
  activeTab: Ref<AppTab>
  booting: Ref<boolean>
  initialized: Ref<boolean>
  authLoading: Ref<boolean>
  setupLoading: Ref<boolean>
  loginError: Ref<string>
  setupError: Ref<string>
  loginForm: LoginForm
  setupForm: SetupForm
  loadRoleData: () => Promise<void>
  resolveTabForRole: (role: number) => AppTab
  setActiveTab: (tab: AppTab, mode?: 'push' | 'replace') => Promise<void>
  clearAllNotices: () => void
  resetAppData: () => void
  closeAllAdminModals: () => void
}

export function useAppSession(deps: UseAppSessionDeps) {
  const sessionFlow = useSessionFlow({
    me: deps.me,
    activeTab: deps.activeTab,
    booting: deps.booting,
    initialized: deps.initialized,
    authLoading: deps.authLoading,
    setupLoading: deps.setupLoading,
    loginError: deps.loginError,
    setupError: deps.setupError,
    loginForm: deps.loginForm,
    setupForm: deps.setupForm,
    loadRoleData: deps.loadRoleData,
    resolveTabForRole: deps.resolveTabForRole,
    setActiveTab: deps.setActiveTab,
    navigateToLogin: async () => {
      await deps.router.replace({ name: 'login' })
    },
    navigateToSetup: async () => {
      await deps.router.replace({ name: 'setup' })
    },
    clearAllNotices: deps.clearAllNotices,
    resetAppData: deps.resetAppData,
    closeAllAdminModals: deps.closeAllAdminModals,
  })

  return {
    initializeSystem: sessionFlow.initializeSystem,
    login: sessionFlow.login,
    restoreSession: sessionFlow.restoreSession,
    logout: sessionFlow.logout,
  }
}
