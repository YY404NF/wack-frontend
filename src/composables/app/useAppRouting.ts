import { ref, watch, type Ref } from 'vue'
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'

import { adminTabKeys, studentTabKeys, type AppTab } from '../../constants'
import type { SessionUser } from '../../api'

type UseAppRoutingDeps = {
  router: Router
  route: RouteLocationNormalizedLoaded
  me: Ref<SessionUser | null>
  booting: Ref<boolean>
  initialized: Ref<boolean>
  ensureStudentFreeTimesLoaded: (force?: boolean) => Promise<void>
}

export function useAppRouting(deps: UseAppRoutingDeps) {
  const activeTab = ref<AppTab>('overview')

  const studentSegmentToTab = {
    home: 'home',
    check: 'student',
    settings: 'settings',
  } as const

  const tabToStudentSegment: Record<'home' | 'student' | 'settings', keyof typeof studentSegmentToTab> = {
    home: 'home',
    student: 'check',
    settings: 'settings',
  }

  function defaultTabForRole(role?: number): AppTab {
    return role === 1 ? 'overview' : 'home'
  }

  function tabAllowedForRole(tab: string, role?: number): tab is AppTab {
    if (!role) {
      return false
    }
    return role === 1
      ? (adminTabKeys as readonly string[]).includes(tab)
      : (studentTabKeys as readonly string[]).includes(tab)
  }

  function readTabFromLocation() {
    if (deps.route.name === 'admin') {
      const segment = typeof deps.route.params.tab === 'string' ? deps.route.params.tab : ''
      if ((adminTabKeys as readonly string[]).includes(segment)) {
        return segment
      }
      return null
    }

    if (deps.route.name === 'student') {
      const segment = typeof deps.route.params.tab === 'string' ? deps.route.params.tab : ''
      return studentSegmentToTab[segment as keyof typeof studentSegmentToTab] ?? null
    }

    return null
  }

  async function writeTabToLocation(tab: AppTab, mode: 'push' | 'replace' = 'replace') {
    if (deps.me.value?.role === 1 && (adminTabKeys as readonly string[]).includes(tab)) {
      await deps.router[mode]({ name: 'admin', params: { tab } })
      return
    }

    if (deps.me.value?.role === 2 && (studentTabKeys as readonly string[]).includes(tab)) {
      await deps.router[mode]({ name: 'student', params: { tab: tabToStudentSegment[tab as keyof typeof tabToStudentSegment] } })
    }
  }

  async function setActiveTab(tab: AppTab, mode: 'push' | 'replace' = 'replace') {
    activeTab.value = tab
    await writeTabToLocation(tab, mode)
    if (deps.me.value?.role !== 2) {
      return
    }
    if (tab === 'settings') {
      void deps.ensureStudentFreeTimesLoaded(true)
    }
  }

  function resolveTabForRole(role?: number): AppTab {
    const tab = readTabFromLocation()
    if (tab && tabAllowedForRole(tab, role)) {
      return tab
    }
    return defaultTabForRole(role)
  }

  watch(
    () => [deps.route.name, deps.route.params.tab, deps.me.value?.role] as const,
    ([, , role]) => {
      if (!role) {
        return
      }
      const nextTab = resolveTabForRole(role)
      if (nextTab !== activeTab.value) {
        activeTab.value = nextTab
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

      const nextTab = resolveTabForRole(role)
      const expectedRouteName = role === 1 ? 'admin' : 'student'
      if (routeName !== expectedRouteName || nextTab !== activeTab.value) {
        await setActiveTab(nextTab, 'replace')
      }
    },
    { immediate: true },
  )

  return {
    activeTab,
    setActiveTab,
    resolveTabForRole,
  }
}
