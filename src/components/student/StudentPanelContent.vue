<script setup lang="ts">
import { InfoFilled } from '@element-plus/icons-vue'
import { type AppTab } from '../../constants'
import type { StudentGreeting, StudentWorkspaceProps } from './types'
import StudentFreeTimeModal from './StudentFreeTimeModal.vue'

defineProps<StudentWorkspaceProps & {
  greeting: StudentGreeting
  scheduleLabel: string
  scheduleItems: ReadonlyArray<{ section: number; label: string; lines: readonly string[] }>
  activeScheduleSections: ReadonlyArray<number>
  sectionTimeText: (section: number) => string
}>()

const emit = defineEmits<{
  'update:activeTab': [value: AppTab]
  logout: []
  openAbout: []
  openFreeTimeModal: []
  closeFreeTimeModal: []
  toggleFreeTimeWeek: [payload: { weekday: number; section: number; weekNo: number }]
  toggleFreeTimeBlock: [payload: { weekday: number; section: number }]
  saveFreeTimeDraft: []
  saveFreeTime: []
  editFreeTime: [item: StudentWorkspaceProps['freeTimes'][number]]
  removeFreeTime: [id: number]
  resetFreeTimeForm: []
  openPasswordModal: []
  closePasswordModal: []
  changePassword: []
}>()
</script>

<template>
  <Transition name="page-fade" mode="out-in">
    <section v-if="activeTab === 'home'" key="home" class="student-mobile-page student-home-page">
      <article class="student-hero-card">
        <button class="student-hero-about-button" type="button" aria-label="打开关于页面" @click="emit('openAbout')">
          <InfoFilled class="student-hero-about-button-icon" aria-hidden="true" />
        </button>
        <p class="student-hero-brand eyebrow">WACK / 网安查课</p>
        <div class="student-hero-body">
          <div class="student-hero-icon" aria-hidden="true">{{ greeting.emoji }}</div>
          <h2>{{ greeting.label }}，</h2>
          <h2>{{ me.real_name }}同学～</h2>
        </div>
      </article>

      <article class="student-summary-card">
        <div class="section-heading student-mobile-section-heading">
          <h2>概览</h2>
        </div>
        <article class="student-stat-card student-stat-card-strong">
          <strong>{{ scheduleLabel }}</strong>
          <div class="student-schedule-times">
            <p v-for="item in scheduleItems" :key="item.section">
              <span class="student-schedule-label">
                <span>{{ item.label }}</span>
                <span v-if="activeScheduleSections.includes(item.section)" class="pill tag-warn student-schedule-live-badge">正在上课</span>
              </span>
              <strong>{{ item.lines.join(' / ') }}</strong>
            </p>
          </div>
        </article>
        <button class="primary-button student-entry-button student-home-action" type="button" @click="emit('update:activeTab', 'student')">
          进入今日查课
        </button>
      </article>
    </section>

    <section v-else-if="activeTab === 'student'" key="student" class="student-mobile-page student-check-page">
      <div class="student-page-meta">
        <p class="student-brand eyebrow">WACK / 网安查课</p>
        <h2>今日查课</h2>
      </div>

      <div v-if="availableCourses.length > 0" class="student-course-list">
        <article v-for="course in availableCourses" :key="course.course_session_id" class="student-course-card">
          <div class="student-course-info">
            <strong>{{ course.course_name }}</strong>
            <p>{{ course.teacher_name }}</p>
            <p>{{ slotLabel(course.weekday, course.section) }}</p>
            <small>{{ course.building_name }}-{{ course.room_name }} · {{ sectionTimeText(course.section) }}</small>
          </div>
        </article>
      </div>
      <p v-else class="empty-hint student-empty-hint">当前没有处于可查时间窗口内的课程。</p>
    </section>

    <section v-else key="settings" class="student-mobile-page student-settings-page">
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
            <strong>{{ me.student_id }}</strong>
          </div>
          <div class="account-line">
            <span>姓名</span>
            <strong>{{ me.real_name }}</strong>
          </div>
          <div class="student-settings-actions">
            <button class="primary-button" type="button" @click="emit('openPasswordModal')">修改密码</button>
            <button class="ghost-button" type="button" @click="emit('openFreeTimeModal')">修改空闲时间</button>
          </div>
        </div>
      </article>

      <button class="ghost-button danger-button student-logout-button" type="button" @click="emit('logout')">退出登录</button>
    </section>
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
</template>
