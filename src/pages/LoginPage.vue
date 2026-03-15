<script setup lang="ts">
const props = defineProps<{
  authLoading: boolean
  errorMessage: string
}>()

const loginForm = defineModel<{ studentId: string; password: string }>('loginForm', { required: true })
const emit = defineEmits<{
  login: []
}>()
</script>

<template>
  <section class="login-layout">
    <article class="login-panel">
      <p class="eyebrow">WACK / 登录</p>
      <h1>查课系统工作台</h1>
      <p class="hero-text">请</p>

      <form class="form-grid" @submit.prevent="emit('login')">
        <label class="field">
          <span>学号</span>
          <input v-model="loginForm.studentId" autocomplete="username" />
        </label>
        <label class="field">
          <span>密码</span>
          <input v-model="loginForm.password" type="password" autocomplete="current-password" />
        </label>
        <button class="primary-button" type="submit" :disabled="props.authLoading">
          {{ props.authLoading ? '登录中...' : '登录系统' }}
        </button>
      </form>

      <p v-if="props.errorMessage" class="error-text">{{ props.errorMessage }}</p>
    </article>
  </section>
</template>
