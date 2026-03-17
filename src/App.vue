<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, watch } from 'vue'

import LoginPage from './pages/LoginPage.vue'
import SetupPage from './pages/SetupPage.vue'
import StudentWorkspace from './pages/StudentWorkspace.vue'
import { useApp } from './composables/useApp'

const AdminWorkspace = defineAsyncComponent(() => import('./pages/AdminWorkspace.vue'))

const {
  adminWorkspaceHandlers,
  adminWorkspaceProps,
  authLoading,
  booting,
  initializeSystem,
  initialized,
  isAdmin,
  login,
  loginError,
  loginForm,
  me,
  setupForm,
  setupError,
  setupLoading,
  studentWorkspaceHandlers,
  studentWorkspaceProps,
} = useApp()

const shouldLockAdminScroll = computed(() => !!me.value && isAdmin.value)

let modalObserver: MutationObserver | null = null

function updateGlobalScrollLock() {
  const hasModal = document.querySelector('.modal-backdrop') !== null
  document.documentElement.classList.toggle('global-scroll-lock', hasModal || shouldLockAdminScroll.value)
  document.body.classList.toggle('global-scroll-lock', hasModal || shouldLockAdminScroll.value)
}

onMounted(() => {
  modalObserver = new MutationObserver(() => {
    updateGlobalScrollLock()
  })
  modalObserver.observe(document.body, { childList: true, subtree: true })
  updateGlobalScrollLock()
})

watch(shouldLockAdminScroll, () => {
  updateGlobalScrollLock()
})

onBeforeUnmount(() => {
  modalObserver?.disconnect()
  modalObserver = null
  document.documentElement.classList.remove('global-scroll-lock')
  document.body.classList.remove('global-scroll-lock')
})
</script>

<template>
  <div
    class="page-shell"
    :class="{ 'admin-mode': !!me && isAdmin }"
  >
    <div v-if="booting" class="boot-screen" aria-hidden="true"></div>

    <SetupPage
      v-else-if="!initialized"
      v-model:setup-form="setupForm"
      :loading="setupLoading"
      :error-message="setupError"
      @initialize="initializeSystem"
    />

    <LoginPage
      v-else-if="!me"
      v-model:login-form="loginForm"
      :auth-loading="authLoading"
      :error-message="loginError"
      @login="login"
    />

    <AdminWorkspace
      v-else-if="isAdmin && adminWorkspaceProps"
      v-bind="adminWorkspaceProps"
      v-on="adminWorkspaceHandlers"
    />

    <div v-else-if="isAdmin" class="boot-screen" aria-hidden="true"></div>

    <StudentWorkspace
      v-else
      v-bind="studentWorkspaceProps"
      v-on="studentWorkspaceHandlers"
    />
  </div>
</template>
