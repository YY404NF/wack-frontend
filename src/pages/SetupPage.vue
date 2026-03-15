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
      <p class="eyebrow">WACK / 网安查课</p>
      <h1>创建系统管理员</h1>
      <p class="hero-text">请为系统创建第一个管理员</p>

      <p v-if="props.errorMessage" class="error-text">{{ props.errorMessage }}</p>

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
          <span v-if="props.loading" class="button-spinner" aria-hidden="true"></span>
          <span>{{ props.loading ? '初始化中...' : '初始化' }}</span>
        </button>
      </form>
    </article>
  </section>
</template>
