import { ref, watch, type Ref } from 'vue'
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'

import { studentTabKeys, type AdminTab, type StudentTab } from '../../constants'
import type { SessionUser } from '../../api'
import { buildAdminTabLocation, readAdminTab } from '../../router/admin-routes'

type UseAppRoutingDeps = {
  router: Router
  route: RouteLocationNormalizedLoaded
  me: Ref<SessionUser | null>
  booting: Ref<boolean>
  initialized: Ref<boolean>
  ensureStudentFreeTimesLoaded: (force?: boolean) => Promise<void>
}

const studentSegmentToTab = {
  home: 'home',
  check: 'student',
  settings: 'settings',
} as const satisfies Record<string, StudentTab>

const tabToStudentSegment: Record<StudentTab, keyof typeof studentSegmentToTab> = {
  home: 'home',
  student: 'check',
  settings: 'settings',
}

export function useAppRouting(deps: UseAppRoutingDeps) {
  const activeAdminTab = ref<AdminTab>('overview')
  const activeStudentTab = ref<StudentTab>('home')

  function defaultAdminTab() {
    return 'overview' as const
  }

  function defaultStudentTab() {
    return 'home' as const
  }

  function readStudentTabFromLocation(): StudentTab | null {
    if (deps.route.name !== 'student') {
      return null
    }
    const segment = typeof deps.route.params.tab === 'string' ? deps.route.params.tab : ''
    const tab = studentSegmentToTab[segment as keyof typeof studentSegmentToTab]
    if (!tab || !(studentTabKeys as readonly string[]).includes(tab)) {
      return null
    }
    return tab
  }

  function resolveAdminTab() {
    return readAdminTab(deps.route) ?? defaultAdminTab()
  }

  function resolveStudentTab() {
    return readStudentTabFromLocation() ?? defaultStudentTab()
  }

  async function writeAdminTabToLocation(tab: AdminTab, mode: 'push' | 'replace' = 'replace') {
    await deps.router[mode](buildAdminTabLocation(tab))
  }

  async function writeStudentTabToLocation(tab: StudentTab, mode: 'push' | 'replace' = 'replace') {
    await deps.router[mode]({
      name: 'student',
      params: { tab: tabToStudentSegment[tab] },
      query: deps.route.query,
    })
  }

  async function setActiveAdminTab(tab: AdminTab, mode: 'push' | 'replace' = 'replace') {
    activeAdminTab.value = tab
    await writeAdminTabToLocation(tab, mode)
  }

  async function setActiveStudentTab(tab: StudentTab, mode: 'push' | 'replace' = 'replace') {
    activeStudentTab.value = tab
    await writeStudentTabToLocation(tab, mode)
    if (deps.me.value?.role === 2 && tab === 'settings') {
      void deps.ensureStudentFreeTimesLoaded(true)
    }
  }

  watch(
    () => [deps.route.name, deps.route.params.tab, deps.me.value?.role] as const,
    ([, , role]) => {
      if (role === 1) {
        const nextTab = resolveAdminTab()
        if (nextTab !== activeAdminTab.value) {
          activeAdminTab.value = nextTab
        }
        return
      }
      if (role === 2 || role === 3) {
        const nextTab = resolveStudentTab()
        if (nextTab !== activeStudentTab.value) {
          activeStudentTab.value = nextTab
        }
      }
    },
    { immediate: true },
  )

  watch(
    () => [deps.booting.value, deps.initialized.value, deps.me.value?.role, deps.route.name] as const,
    async ([isBooting, isInitialized, role, routeName]) => {
      if (isBooting) {
        return
      }

      if (!isInitialized) {
        if (routeName !== 'setup') {
          await deps.router.replace({ name: 'setup' })
        }
        return
      }

      if (!role) {
        if (routeName !== 'login') {
          await deps.router.replace({ name: 'login' })
        }
        return
      }

      if (role === 1) {
        const nextTab = resolveAdminTab()
        const isOnExpectedRoute = readAdminTab(deps.route) !== null
        if (!isOnExpectedRoute || nextTab !== activeAdminTab.value) {
          await setActiveAdminTab(nextTab, 'replace')
        }
        return
      }

      const nextTab = resolveStudentTab()
      const isOnExpectedRoute = routeName === 'student'
      if (!isOnExpectedRoute || nextTab !== activeStudentTab.value) {
        await setActiveStudentTab(nextTab, 'replace')
      }
    },
    { immediate: true },
  )

  return {
    activeAdminTab,
    activeStudentTab,
    setActiveAdminTab,
    setActiveStudentTab,
    resolveAdminTab,
    resolveStudentTab,
  }
}
