<script setup lang="ts">
import type { ClassItem, ClassStudentItem, FreeTimeEditorItem, SessionUser } from '../../api'
import StudentFreeTimeModal from './StudentFreeTimeModal.vue'

defineProps<{
  me: SessionUser
  managedClass: ClassItem | null
  managedClassStudents: ClassStudentItem[]
  managedClassStudentsModalOpen: boolean
  freeTimes: FreeTimeEditorItem[]
  freeTimeModalOpen: boolean
  freeTimeDraft: Record<string, number[]>
  freeTimeTerm: string
  passwordForm: { oldPassword: string; newPassword: string; confirmNewPassword: string }
  passwordModalOpen: boolean
  savingFreeTime: boolean
  changingPassword: boolean
}>()

const emit = defineEmits<{
  logout: []
  openFreeTimeModal: []
  openManagedClassStudentsModal: []
  closeManagedClassStudentsModal: []
  closeFreeTimeModal: []
  toggleFreeTimeWeek: [payload: { weekday: number; section: number; weekNo: number }]
  toggleFreeTimeBlock: [payload: { weekday: number; section: number }]
  saveFreeTimeDraft: []
  openPasswordModal: []
  closePasswordModal: []
  changePassword: []
}>()
</script>

<template>
  <section class="student-mobile-page student-settings-page">
    <div class="student-page-meta">
      <p class="student-brand eyebrow">WACK / 网安查课</p>
      <h2>设置</h2>
    </div>

    <article class="student-section-card">
      <div class="section-heading student-mobile-section-heading">
        <h3>账号信息</h3>
      </div>
      <div class="student-settings-summary">
        <div class="account-line">
          <span>学号</span>
          <strong>{{ me.login_id }}</strong>
        </div>
        <div class="account-line">
          <span>姓名</span>
          <strong>{{ me.real_name }}</strong>
        </div>
        <template v-if="me.role === 3">
          <div v-if="managedClass" class="account-line">
            <span>负责班级</span>
            <strong>{{ managedClass.class_name }}</strong>
          </div>
        </template>
        <div class="student-settings-actions">
          <button class="primary-button" type="button" @click="emit('openPasswordModal')">修改密码</button>
          <button v-if="me.role === 2" class="ghost-button" type="button" @click="emit('openFreeTimeModal')">修改空闲时间</button>
          <button v-if="me.role === 3 && managedClass" class="ghost-button" type="button" @click="emit('openManagedClassStudentsModal')">查看班级学生</button>
        </div>
      </div>
    </article>

    <button class="ghost-button danger-button student-logout-button" type="button" @click="emit('logout')">退出登录</button>

    <Transition name="modal-float" appear>
      <div v-if="managedClassStudentsModalOpen" class="modal-backdrop">
        <article class="modal-card modal-card-narrow student-managed-class-modal">
          <div class="modal-header">
            <h3>班级学生</h3>
            <button class="ghost-button compact-button modal-close" type="button" @click="emit('closeManagedClassStudentsModal')">关闭</button>
          </div>
          <p class="hint student-managed-class-meta" v-if="managedClass">
            {{ managedClass.class_name }} · {{ managedClass.student_count }}人
          </p>
          <div class="student-managed-class-student-list">
            <article v-for="student in managedClassStudents" :key="student.id" class="student-managed-class-student-item">
              <strong>{{ student.real_name }}</strong>
              <span>{{ student.student_id }}</span>
            </article>
            <p v-if="managedClassStudents.length === 0" class="empty-hint">暂无班级学生数据。</p>
          </div>
        </article>
      </div>
    </Transition>

    <Transition name="modal-float" appear>
      <div v-if="passwordModalOpen" class="modal-backdrop">
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
    </Transition>

    <StudentFreeTimeModal
      :open="freeTimeModalOpen"
      :term="freeTimeTerm"
      :saving="savingFreeTime"
      :draft="freeTimeDraft"
      @close="emit('closeFreeTimeModal')"
      @toggle-week="emit('toggleFreeTimeWeek', $event)"
      @toggle-block="emit('toggleFreeTimeBlock', $event)"
      @save="emit('saveFreeTimeDraft')"
    />
  </section>
</template>
