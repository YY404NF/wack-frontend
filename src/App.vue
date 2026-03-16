<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

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
