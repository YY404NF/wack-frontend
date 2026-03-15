<script setup lang="ts">
import LoginPage from './pages/LoginPage.vue'
import SetupPage from './pages/SetupPage.vue'
import AdminWorkspace from './pages/AdminWorkspace.vue'
import StudentWorkspace from './pages/StudentWorkspace.vue'
import { useApp } from './composables/useApp'

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
  <div class="page-shell">
    <div v-if="booting" class="splash-card">
      <p class="eyebrow">WACK</p>
      <h1>正在恢复登录状态</h1>
    </div>

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
      v-else-if="isAdmin"
      v-bind="adminWorkspaceProps"
      v-on="adminWorkspaceHandlers"
    />

    <StudentWorkspace
      v-else
      v-bind="studentWorkspaceProps"
      v-on="studentWorkspaceHandlers"
    />
  </div>
</template>
