<script setup lang="ts">
import type { AdminSettingsProps } from './types'

defineProps<AdminSettingsProps>()

const emit = defineEmits<{
  openProfileModal: []
  closeProfileModal: []
  updateProfile: []
  openPasswordModal: []
  closePasswordModal: []
  changePassword: []
}>()
</script>

<template>
  <section class="workspace-card settings-card admin-settings-card">
    <div class="section-heading">
      <h2>当前帐号</h2>
      <div class="inline-actions">
        <button class="ghost-button" type="button" @click="emit('openProfileModal')">更改信息</button>
        <button class="primary-button" type="button" @click="emit('openPasswordModal')">更改密码</button>
      </div>
    </div>

    <div class="account-summary">
      <div class="account-line">
        <span>账号 / 学号</span>
        <strong>{{ me.student_id }}</strong>
      </div>
      <div class="account-line">
        <span>姓名</span>
        <strong>{{ me.real_name }}</strong>
      </div>
      <div class="account-line">
        <span>角色</span>
        <strong>{{ me.role === 1 ? '管理员' : '查课学生' }}</strong>
      </div>
      <div class="account-line">
        <span>状态</span>
        <strong>{{ me.status === 1 ? '正常' : '冻结' }}</strong>
      </div>
    </div>

    <div v-if="profileModalOpen" class="modal-backdrop" @click.self="emit('closeProfileModal')">
      <article class="modal-card modal-card-narrow">
        <div class="modal-header">
          <h3>更改信息</h3>
          <button class="ghost-button compact-button modal-close" type="button" @click="emit('closeProfileModal')">关闭</button>
        </div>
        <form class="form-grid single-column-form" @submit.prevent="emit('updateProfile')">
          <label class="field">
            <span>学号</span>
            <input v-model="profileForm.studentId" autocomplete="username" />
          </label>
          <label class="field">
            <span>姓名</span>
            <input v-model="profileForm.realName" />
          </label>
          <button class="primary-button" type="submit" :disabled="profileSaving">
            <span v-if="profileSaving" class="button-spinner" aria-hidden="true"></span>
            <span>{{ profileSaving ? '提交中...' : '保存' }}</span>
          </button>
        </form>
      </article>
    </div>

    <div v-if="passwordModalOpen" class="modal-backdrop" @click.self="emit('closePasswordModal')">
      <article class="modal-card modal-card-narrow">
        <div class="modal-header">
          <h3>更改密码</h3>
          <button class="ghost-button compact-button modal-close" type="button" @click="emit('closePasswordModal')">关闭</button>
        </div>
        <form class="form-grid single-column-form" @submit.prevent="emit('changePassword')">
          <label class="field">
            <span>旧密码</span>
            <input v-model="passwordForm.oldPassword" type="password" autocomplete="current-password" />
          </label>
          <label class="field">
            <span>新密码</span>
            <input v-model="passwordForm.newPassword" type="password" autocomplete="new-password" />
          </label>
          <label class="field">
            <span>确认新密码</span>
            <input v-model="passwordForm.confirmNewPassword" type="password" autocomplete="new-password" />
          </label>
          <button class="primary-button" type="submit" :disabled="changingPassword">
            <span v-if="changingPassword" class="button-spinner" aria-hidden="true"></span>
            <span>{{ changingPassword ? '提交中...' : '更改密码' }}</span>
          </button>
        </form>
      </article>
    </div>
  </section>
</template>
