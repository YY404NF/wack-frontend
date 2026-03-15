<script setup lang="ts">
defineProps<{
  passwordForm: { oldPassword: string; newPassword: string }
}>()

const emit = defineEmits<{
  changePassword: []
}>()
</script>

<template>
  <section class="workspace-card settings-card admin-settings-card">
    <div class="section-heading">
      <div>
        <p class="section-kicker">通用设置</p>
        <h2>修改密码</h2>
      </div>
    </div>
    <form class="form-grid compact" @submit.prevent="emit('changePassword')">
      <label class="field">
        <span>旧密码</span>
        <input v-model="passwordForm.oldPassword" type="password" />
      </label>
      <label class="field">
        <span>新密码</span>
        <input v-model="passwordForm.newPassword" type="password" />
      </label>
      <button class="primary-button" type="submit">提交修改</button>
    </form>
  </section>
</template>
