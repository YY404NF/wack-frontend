import type { Ref } from 'vue'

import { api, clearToken, getToken, setToken, type SessionUser } from '../../api'
import { useSessionStore } from '../../stores/session'
import type { AdminTab, StudentTab } from '../../constants'
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
  activeAdminTab: Ref<AdminTab>
  activeStudentTab: Ref<StudentTab>
  booting: Ref<boolean>
  initialized: Ref<boolean>
  authLoading: Ref<boolean>
  setupLoading: Ref<boolean>
  loginError: Ref<string>
  setupError: Ref<string>
  loginForm: LoginForm
  setupForm: SetupForm
  loadRoleData: () => Promise<void>
  resolveAdminTab: () => AdminTab
  resolveStudentTab: () => StudentTab
  setActiveAdminTab: (tab: AdminTab, mode?: 'push' | 'replace') => Promise<void>
  setActiveStudentTab: (tab: StudentTab, mode?: 'push' | 'replace') => Promise<void>
  navigateToLogin: () => Promise<void>
  navigateToSetup: () => Promise<void>
  clearAllNotices: () => void
  resetAppData: () => void
  closeAllAdminModals: () => void
}

export function useSessionFlow(deps: SessionFlowDeps) {
  const sessionStore = useSessionStore()

  async function activateRoleTab(role: number, mode: 'push' | 'replace' = 'replace') {
    if (role === 1) {
      const targetTab = deps.resolveAdminTab()
      const tabChanged = targetTab !== deps.activeAdminTab.value
      await deps.setActiveAdminTab(targetTab, mode)
      if (!tabChanged) {
        await deps.loadRoleData()
      }
      return
    }

    const targetTab = deps.resolveStudentTab()
    const tabChanged = targetTab !== deps.activeStudentTab.value
    await deps.setActiveStudentTab(targetTab, mode)
    if (!tabChanged) {
      await deps.loadRoleData()
    }
  }

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
        login_id: studentId,
        real_name: deps.setupForm.realName.trim(),
        password,
      })

      const data = await api.login(studentId, password)
      setToken(data.token)
      sessionStore.setSession(data)
      deps.initialized.value = true
      deps.me.value = data.user
      deps.loginForm.studentId = studentId
      deps.loginForm.password = password
      Object.assign(deps.setupForm, createSetupForm())
      await activateRoleTab(data.user.role, 'replace')
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
      sessionStore.setSession(data)
      deps.me.value = data.user
      await activateRoleTab(data.user.role, 'replace')
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
        sessionStore.clearSession()
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
      sessionStore.setUser(me)
      deps.me.value = me
      await activateRoleTab(me.role, 'replace')
      deps.booting.value = false
    } catch {
      clearToken()
      sessionStore.clearSession()
      deps.me.value = null
      await deps.navigateToLogin()
    } finally {
      if (deps.me.value === null) {
        deps.booting.value = false
      }
    }
  }

  function logout() {
    void api.logout().catch(() => undefined)
    clearToken()
    sessionStore.clearSession()
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
