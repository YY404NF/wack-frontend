<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Calendar, HomeFilled, Setting } from '@element-plus/icons-vue'

import type { AppTab } from '../constants'
import StudentBottomNav from '../components/student/StudentBottomNav.vue'
import StudentPanelContent from '../components/student/StudentPanelContent.vue'
import type { StudentWorkspaceProps } from '../components/student/types'
import { getGreetingMeta } from '../utils/greeting'
import { formatSectionTimeRange, getScheduleType, scheduleLabelMap } from '../utils/schedule'

const props = defineProps<StudentWorkspaceProps>()
const emit = defineEmits<{
  'update:activeTab': [value: AppTab]
  'update:selectedStudentId': [value: number]
  logout: []
  openCourse: [course: StudentWorkspaceProps['availableCourses'][number]]
  updateStudentStatus: [detailId: number, status: number]
  completeAttendance: []
  saveFreeTime: []
  editFreeTime: [item: StudentWorkspaceProps['freeTimes'][number]]
  removeFreeTime: [id: number]
  resetFreeTimeForm: []
  changePassword: []
}>()

const now = ref(new Date())
let timerId = 0

const scheduleType = computed(() => getScheduleType(props.systemSettings))
const greeting = computed(() => getGreetingMeta(now.value))
const navItems: Array<{ key: 'home' | 'student' | 'settings'; label: string; icon: typeof HomeFilled }> = [
  { key: 'home', label: '首页', icon: HomeFilled },
  { key: 'student', label: '查课', icon: Calendar },
  { key: 'settings', label: '设置', icon: Setting },
]

function sectionTimeText(section: number) {
  return formatSectionTimeRange(section, scheduleType.value)
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
        :section-time-text="sectionTimeText"
        @update:active-tab="emit('update:activeTab', $event)"
        @update:selected-student-id="emit('update:selectedStudentId', $event)"
        @logout="emit('logout')"
        @open-course="emit('openCourse', $event)"
        @update-student-status="(detailId, status) => emit('updateStudentStatus', detailId, status)"
        @complete-attendance="emit('completeAttendance')"
        @save-free-time="emit('saveFreeTime')"
        @edit-free-time="emit('editFreeTime', $event)"
        @remove-free-time="emit('removeFreeTime', $event)"
        @reset-free-time-form="emit('resetFreeTimeForm')"
        @change-password="emit('changePassword')"
      />
    </main>

    <StudentBottomNav :active-tab="activeTab" :nav-items="navItems" @update:active-tab="emit('update:activeTab', $event)" />
  </div>
</template>
