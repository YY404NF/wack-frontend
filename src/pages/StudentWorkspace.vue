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
import { formatSectionTimeRange, getSectionTimeRange, scheduleLabelMap, scheduleMap } from '../utils/schedule'

const props = defineProps<StudentWorkspaceProps>()
const emit = defineEmits<{
  'update:activeTab': [value: AppTab]
  logout: []
  openFreeTimeModal: []
  openManagedClassStudentsModal: []
  closeManagedClassStudentsModal: []
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

const scheduleType = computed(() => props.currentSchedule ?? 'summer')
const greeting = computed(() => getGreetingMeta(now.value))
const scheduleItems = computed(() => {
  if (props.metaSections.length > 0) {
    return props.metaSections.map((item) => ({
      section: item.section,
      label: item.label,
      lines:
        scheduleMap[scheduleType.value].find((scheduleItem) => scheduleItem.section === item.section)?.lines ??
        [`${item.start_time}-${item.end_time}`],
    }))
  }
  return scheduleMap[scheduleType.value]
})
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
        @logout="emit('logout')"
        @open-about="openAboutEntry"
        @open-free-time-modal="emit('openFreeTimeModal')"
        @open-managed-class-students-modal="emit('openManagedClassStudentsModal')"
        @close-managed-class-students-modal="emit('closeManagedClassStudentsModal')"
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
        <div class="about-placeholder-body">
          <h4 class="about-project-title">网络空间安全学院查课系统</h4>
          <p class="about-project-name">wack</p>
          <p class="about-project-description">
            面向管理员、查课学生和学委的无纸化查课系统，统一支撑课程巡查、考勤记录与流程协同。
          </p>
          <a
            class="about-github-button"
            href="https://github.com/YY404NF/wack"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="打开 GitHub 仓库"
          >
            <svg class="about-github-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 2C6.477 2 2 6.589 2 12.248c0 4.526 2.865 8.366 6.839 9.72.5.096.682-.221.682-.494 0-.244-.009-.89-.014-1.747-2.782.615-3.369-1.374-3.369-1.374-.455-1.177-1.11-1.49-1.11-1.49-.908-.637.069-.624.069-.624 1.004.072 1.532 1.055 1.532 1.055.892 1.566 2.341 1.114 2.91.852.091-.662.35-1.114.636-1.37-2.221-.259-4.555-1.137-4.555-5.062 0-1.118.389-2.032 1.029-2.748-.103-.26-.446-1.303.098-2.716 0 0 .839-.275 2.75 1.05A9.32 9.32 0 0 1 12 6.836a9.3 9.3 0 0 1 2.504.348c1.909-1.325 2.746-1.05 2.746-1.05.546 1.413.203 2.456.1 2.716.64.716 1.027 1.63 1.027 2.748 0 3.935-2.338 4.8-4.566 5.054.359.318.679.946.679 1.907 0 1.377-.012 2.488-.012 2.826 0 .275.18.595.688.493C19.138 20.61 22 16.772 22 12.248 22 6.589 17.523 2 12 2Z"
              />
            </svg>
            <span class="about-github-label">GitHub</span>
          </a>
        </div>
      </article>
    </div>
  </Transition>
</template>
