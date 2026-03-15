import type { Ref } from 'vue'

import { api, clearToken, getToken, setToken, type SessionUser } from '../../api'
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
  activeTab: Ref<string>
  loginForm: LoginForm
  setupForm: SetupForm
  loadRoleData: () => Promise<void>
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
    if (deps.setupForm.password !== deps.setupForm.confirmPassword) {
      deps.setupError.value = '两次输入的密码不一致'
      return
    }

    deps.setupLoading.value = true
    deps.setupError.value = ''
    try {
      await api.initializeSystem({
        student_id: deps.setupForm.studentId.trim(),
        real_name: deps.setupForm.realName.trim(),
        password: deps.setupForm.password,
      })
      deps.initialized.value = true
      deps.loginForm.studentId = deps.setupForm.studentId
      deps.loginForm.password = deps.setupForm.password
      Object.assign(deps.setupForm, createSetupForm())
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
      deps.activeTab.value = data.user.role === 1 ? 'overview' : 'student'
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
        return
      }
      if (!getToken()) {
        return
      }

      deps.me.value = await api.me()
      await deps.loadRoleData()
      deps.activeTab.value = deps.me.value.role === 1 ? 'overview' : 'student'
    } catch {
      clearToken()
      deps.me.value = null
    } finally {
      deps.booting.value = false
    }
  }

  function logout() {
    clearToken()
    deps.me.value = null
    deps.resetAppData()
    deps.activeTab.value = 'overview'
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
