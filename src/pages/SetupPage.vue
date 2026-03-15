<script setup lang="ts">
const props = defineProps<{
  loading: boolean
  errorMessage: string
}>()

const setupForm = defineModel<{ studentId: string; realName: string; password: string; confirmPassword: string }>('setupForm', { required: true })
const emit = defineEmits<{
  initialize: []
}>()
</script>

<template>
  <section class="setup-layout">
    <article class="setup-panel">
      <p class="eyebrow">WACK / 初始化</p>
      <h1>创建系统管理员</h1>
      <p class="hero-text">请为系统创建第一个管理员</p>

      <form class="form-grid" @submit.prevent="emit('initialize')">
        <label class="field">
          <span>账号</span>
          <input v-model="setupForm.studentId" autocomplete="username" />
        </label>
        <label class="field">
          <span>姓名</span>
          <input v-model="setupForm.realName" />
        </label>
        <label class="field">
          <span>密码</span>
          <input v-model="setupForm.password" type="password" autocomplete="new-password" />
        </label>
        <label class="field">
          <span>确认密码</span>
          <input v-model="setupForm.confirmPassword" type="password" autocomplete="new-password" />
        </label>
        <button class="primary-button" type="submit" :disabled="props.loading">
          <span v-if="props.loading" class="button-loading" aria-hidden="true"></span>
          <span>{{ props.loading ? '初始化中...' : '初始化系统' }}</span>
        </button>
      </form>

      <p v-if="props.errorMessage" class="error-text">{{ props.errorMessage }}</p>
    </article>
  </section>
</template>

<style scoped>
.button-loading {
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 999px;
  animation: spin 0.7s linear infinite;
  flex: 0 0 auto;
}

.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
