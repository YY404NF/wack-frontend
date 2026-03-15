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
      <p class="hero-text">管理员和查课学生共用同一登录入口，前端会按角色切换工作区。</p>

      <form class="form-grid" @submit.prevent="emit('login')">
        <label class="field">
          <span>学号 / 账号</span>
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

    <article class="feature-panel">
      <div class="feature-card">
        <strong>管理员端</strong>
        <p>查看课程表、录入课程、创建查课学生、修正查课结果。</p>
      </div>
      <div class="feature-card">
        <strong>查课学生端</strong>
        <p>查看当天可查课程，进入查课流程，逐人修改状态并结束本次查课。</p>
      </div>
    </article>
  </section>
</template>
