import type { Ref } from 'vue'

import { api, clearToken, getToken, setToken, type SessionUser } from '../../api'
import type { AppTab } from '../../constants'
import { createSetupForm } from './forms'

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

type SessionFlowDeps = {
  me: Ref<SessionUser | null>
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
  setActiveTab: (tab: AppTab, mode?: 'push' | 'replace') => void
  navigateToLogin: () => Promise<void>
  navigateToSetup: () => Promise<void>
  clearAllNotices: () => void
  resetAppData: () => void
  closeAllAdminModals: () => void
}

export function useSessionFlow(deps: SessionFlowDeps) {
  async function loadSetupStatus() {
    const status = await api.setupStatus()
    deps.initialized.value = status.initialized
  }

  async function initializeSystem() {
    const studentId = deps.setupForm.studentId.trim()
    const password = deps.setupForm.password

    if (deps.setupForm.password !== deps.setupForm.confirmPassword) {
      deps.setupError.value = '两次输入的密码不一致'
      return
    }

    deps.setupLoading.value = true
    deps.setupError.value = ''
    try {
      await api.initializeSystem({
        student_id: studentId,
        real_name: deps.setupForm.realName.trim(),
        password,
      })

      const data = await api.login(studentId, password)
      setToken(data.token)
      deps.initialized.value = true
      deps.me.value = data.user
      deps.loginForm.studentId = studentId
      deps.loginForm.password = password
      Object.assign(deps.setupForm, createSetupForm())
      await deps.loadRoleData()
      deps.setActiveTab(deps.resolveTabForRole(data.user.role), 'replace')
    } catch (error) {
      deps.setupError.value = error instanceof Error ? error.message : '初始化失败'
    } finally {
      deps.setupLoading.value = false
    }
  }

  async function login() {
    deps.authLoading.value = true
    deps.loginError.value = ''
    try {
      const data = await api.login(deps.loginForm.studentId.trim(), deps.loginForm.password)
      setToken(data.token)
      deps.me.value = data.user
      await deps.loadRoleData()
      deps.setActiveTab(deps.resolveTabForRole(data.user.role), 'replace')
    } catch (error) {
      deps.loginError.value = error instanceof Error ? error.message : '登录失败'
    } finally {
      deps.authLoading.value = false
    }
  }

  async function restoreSession() {
    try {
      await loadSetupStatus()
      if (!deps.initialized.value) {
        clearToken()
        deps.me.value = null
        deps.loginError.value = ''
        await deps.navigateToSetup()
        return
      }
      if (!getToken()) {
        await deps.navigateToLogin()
        return
      }

      const me = await api.me()
      deps.me.value = me
      deps.setActiveTab(deps.resolveTabForRole(me.role), 'replace')
      deps.booting.value = false
      void deps.loadRoleData()
    } catch {
      clearToken()
      deps.me.value = null
      await deps.navigateToLogin()
    } finally {
      if (deps.me.value === null) {
        deps.booting.value = false
      }
    }
  }

  function logout() {
    clearToken()
    deps.me.value = null
    deps.resetAppData()
    void deps.navigateToLogin()
    deps.closeAllAdminModals()
    deps.clearAllNotices()
  }

  return {
    loadSetupStatus,
    initializeSystem,
    login,
    restoreSession,
    logout,
  }
}
