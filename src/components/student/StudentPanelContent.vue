<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

import type { AppTab } from '../../constants'
import type { StudentGreeting, StudentWorkspaceProps } from './types'

const StudentHomePanel = defineAsyncComponent(() => import('./StudentHomePanel.vue'))
const StudentCheckPanel = defineAsyncComponent(() => import('./StudentCheckPanel.vue'))
const StudentSettingsPanel = defineAsyncComponent(() => import('./StudentSettingsPanel.vue'))

const props = defineProps<StudentWorkspaceProps & {
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
</script>

<template>
  <Transition name="page-fade" mode="out-in">
    <StudentHomePanel
      v-if="activeTab === 'home'"
      key="home"
      :me="me"
      :greeting="greeting"
      :schedule-label="scheduleLabel"
      :schedule-items="scheduleItems"
      :active-schedule-sections="activeScheduleSections"
      @open-about="emit('openAbout')"
      @enter-student-tab="emit('update:activeTab', 'student')"
    />

    <StudentCheckPanel
      v-else-if="activeTab === 'student'"
      key="student"
      :available-courses="availableCourses"
      :slot-label="slotLabel"
      :section-time-text="sectionTimeText"
    />

    <StudentSettingsPanel
      v-else
      key="settings"
      :me="me"
      :managed-class="managedClass"
      :managed-class-students="managedClassStudents"
      :managed-class-students-modal-open="managedClassStudentsModalOpen"
      :free-times="freeTimes"
      :free-time-modal-open="freeTimeModalOpen"
      :free-time-draft="freeTimeDraft"
      :free-time-term="freeTimeTerm"
      :password-form="passwordForm"
      :password-modal-open="passwordModalOpen"
      :saving-free-time="savingFreeTime"
      :changing-password="changingPassword"
      @logout="emit('logout')"
      @open-free-time-modal="emit('openFreeTimeModal')"
      @open-managed-class-students-modal="emit('openManagedClassStudentsModal')"
      @close-managed-class-students-modal="emit('closeManagedClassStudentsModal')"
      @close-free-time-modal="emit('closeFreeTimeModal')"
      @toggle-free-time-week="emit('toggleFreeTimeWeek', $event)"
      @toggle-free-time-block="emit('toggleFreeTimeBlock', $event)"
      @save-free-time-draft="emit('saveFreeTimeDraft')"
      @open-password-modal="emit('openPasswordModal')"
      @close-password-modal="emit('closePasswordModal')"
      @change-password="emit('changePassword')"
    />
  </Transition>
</template>
