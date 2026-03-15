<script setup lang="ts">
const props = defineProps<{
  loading: boolean
  errorMessage: string
}>()

const setupForm = defineModel<{ studentId: string; realName: string; password: string }>('setupForm', { required: true })
const emit = defineEmits<{
  initialize: []
}>()
</script>

<template>
  <section class="setup-layout">
    <article class="setup-panel">
      <p class="eyebrow">WACK / 初始化</p>
      <h1>创建第一个系统管理员</h1>
      <p class="hero-text">当前数据库已创建，但系统还没有管理员账号。初始化完成后，后续所有管理动作都从这个账号开始。</p>

      <form class="form-grid" @submit.prevent="emit('initialize')">
        <label class="field">
          <span>管理员学号 / 账号</span>
          <input v-model="setupForm.studentId" autocomplete="username" />
        </label>
        <label class="field">
          <span>管理员姓名</span>
          <input v-model="setupForm.realName" />
        </label>
        <label class="field">
          <span>初始密码</span>
          <input v-model="setupForm.password" type="password" autocomplete="new-password" />
        </label>
        <button class="primary-button" type="submit" :disabled="props.loading">
          {{ props.loading ? '初始化中...' : '初始化系统' }}
        </button>
      </form>

      <p v-if="props.errorMessage" class="error-text">{{ props.errorMessage }}</p>
    </article>
  </section>
</template>
