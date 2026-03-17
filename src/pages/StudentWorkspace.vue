<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Calendar, HomeFilled, Setting } from '@element-plus/icons-vue'

import type { AppTab } from '../constants'
import AboutCaptchaGate from '../components/about/AboutCaptchaGate.vue'
import StudentBottomNav from '../components/student/StudentBottomNav.vue'
import StudentPanelContent from '../components/student/StudentPanelContent.vue'
import type { StudentWorkspaceProps } from '../components/student/types'
import { aboutCaptchaChallenges } from '../data/aboutCaptchaChallenges'
import { getGreetingMeta } from '../utils/greeting'
import { formatSectionTimeRange, getScheduleType, getSectionTimeRange, scheduleLabelMap, scheduleMap } from '../utils/schedule'

const props = defineProps<StudentWorkspaceProps>()
const emit = defineEmits<{
  'update:activeTab': [value: AppTab]
  'update:selectedStudentId': [value: number]
  logout: []
  openCourse: [course: StudentWorkspaceProps['availableCourses'][number]]
  updateStudentStatus: [detailId: number, status: number]
  completeAttendance: []
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

const now = ref(new Date())
let timerId = 0

const scheduleType = computed(() => getScheduleType(props.systemSettings))
const greeting = computed(() => getGreetingMeta(now.value))
const scheduleItems = computed(() => scheduleMap[scheduleType.value])
const activeScheduleSections = computed(() => {
  const currentMinutes = now.value.getHours() * 60 + now.value.getMinutes()
  return scheduleItems.value
    .filter((item) => {
      const range = getSectionTimeRange(item.section, scheduleType.value)
      if (!range) {
        return false
      }
      return currentMinutes >= range.start - 5 && currentMinutes <= range.end + 5
    })
    .map((item) => item.section)
})
const navItems: Array<{ key: 'home' | 'student' | 'settings'; label: string; icon: typeof HomeFilled }> = [
  { key: 'home', label: '首页', icon: HomeFilled },
  { key: 'student', label: '查课', icon: Calendar },
  { key: 'settings', label: '设置', icon: Setting },
]

const aboutCaptchaOpen = ref(false)
const aboutModalOpen = ref(false)

function sectionTimeText(section: number) {
  return formatSectionTimeRange(section, scheduleType.value)
}

function openAboutEntry() {
  aboutCaptchaOpen.value = true
}

function closeAboutCaptcha() {
  aboutCaptchaOpen.value = false
}

function handleAboutVerified() {
  aboutCaptchaOpen.value = false
  aboutModalOpen.value = true
}

function closeAboutModal() {
  aboutModalOpen.value = false
}

onMounted(() => {
  timerId = window.setInterval(() => {
    now.value = new Date()
  }, 30000)
})

onBeforeUnmount(() => {
  window.clearInterval(timerId)
})
</script>

<template>
  <div class="student-mobile-shell">
    <div v-if="pageError || toast" class="notice-stack student-notice-stack">
      <p v-if="pageError" class="error-banner">{{ pageError }}</p>
      <p v-if="toast" class="toast-banner">{{ toast }}</p>
    </div>

    <main class="student-mobile-main">
      <StudentPanelContent
        v-bind="props"
        :greeting="greeting"
        :schedule-label="scheduleLabelMap[scheduleType]"
        :schedule-items="scheduleItems"
        :active-schedule-sections="activeScheduleSections"
        :section-time-text="sectionTimeText"
        @update:active-tab="emit('update:activeTab', $event)"
        @update:selected-student-id="emit('update:selectedStudentId', $event)"
        @logout="emit('logout')"
        @open-about="openAboutEntry"
        @open-course="emit('openCourse', $event)"
        @update-student-status="(detailId, status) => emit('updateStudentStatus', detailId, status)"
        @complete-attendance="emit('completeAttendance')"
        @open-free-time-modal="emit('openFreeTimeModal')"
        @close-free-time-modal="emit('closeFreeTimeModal')"
        @toggle-free-time-week="emit('toggleFreeTimeWeek', $event)"
        @toggle-free-time-block="emit('toggleFreeTimeBlock', $event)"
        @save-free-time-draft="emit('saveFreeTimeDraft')"
        @save-free-time="emit('saveFreeTime')"
        @edit-free-time="emit('editFreeTime', $event)"
        @remove-free-time="emit('removeFreeTime', $event)"
        @reset-free-time-form="emit('resetFreeTimeForm')"
        @open-password-modal="emit('openPasswordModal')"
        @close-password-modal="emit('closePasswordModal')"
        @change-password="emit('changePassword')"
      />
    </main>

    <StudentBottomNav :active-tab="activeTab" :nav-items="navItems" @update:active-tab="emit('update:activeTab', $event)" />
  </div>

  <AboutCaptchaGate
    :open="aboutCaptchaOpen"
    :challenges="aboutCaptchaChallenges"
    @close="closeAboutCaptcha"
    @verified="handleAboutVerified"
  />

  <Transition name="modal-float" appear>
    <div v-if="aboutModalOpen" class="modal-backdrop" @click.self="closeAboutModal">
      <article class="modal-card modal-card-narrow about-placeholder-modal">
        <div class="wide-modal-header about-placeholder-header">
          <h3 class="wide-modal-header-title">关于</h3>
          <p class="hint wide-modal-header-meta">空白浮窗，后续内容可以继续往里加。</p>
        </div>
        <div class="about-placeholder-body"></div>
      </article>
    </div>
  </Transition>
</template>
