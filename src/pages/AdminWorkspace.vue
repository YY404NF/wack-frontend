<script setup lang="ts">
import type { AttendanceResultItem, CourseCalendarItem, CourseItem, FreeTimeItem, SessionUser, UserItem } from '../api'
import type { AppTab, StatusCode } from '../constants'
import AdminSidebar from '../components/admin/AdminSidebar.vue'
import AdminOverviewPanel from '../components/admin/AdminOverviewPanel.vue'
import AdminManagePanel from '../components/admin/AdminManagePanel.vue'
import AdminAttendancePanel from '../components/admin/AdminAttendancePanel.vue'
import AdminSettingsPanel from '../components/admin/AdminSettingsPanel.vue'

defineProps<{
  me: SessionUser
  activeTab: AppTab
  pageError: string
  toast: string
  adminActiveNav?: { label: string; desc: string }
  adminStats: Array<{ label: string; value: number; tone: string }>
  courseCalendar: CourseCalendarItem[]
  freeTimes: FreeTimeItem[]
  users: UserItem[]
  courses: CourseItem[]
  attendanceResults: AttendanceResultItem[]
  userForm: { studentId: string; realName: string; password: string; role: number; status: number }
  courseForm: {
    courseId: string
    term: string
    courseName: string
    teacherName: string
    studentIds: string
    sessionNo: number
    weekNo: number
    weekday: number
    section: number
    buildingName: string
    roomName: string
  }
  passwordForm: { oldPassword: string; newPassword: string }
  roleName: (role?: number) => string
  statusName: (status: number) => string
  statusClass: (status: number) => Record<string, boolean>
  slotLabel: (weekday: number, section: number) => string
}>()

const emit = defineEmits<{
  'update:activeTab': [value: AppTab]
  logout: []
  createUser: []
  createCourse: []
  updateAdminStatus: [detailId: number, status: StatusCode]
  changePassword: []
}>()

function forwardUpdateStatus(detailId: number, status: StatusCode) {
  emit('updateAdminStatus', detailId, status)
}
</script>

<template>
  <div class="admin-shell">
    <AdminSidebar :me="me" :active-tab="activeTab" :role-name="roleName" @update:active-tab="emit('update:activeTab', $event)" @logout="emit('logout')" />

    <div class="admin-content">
      <header class="topbar topbar-admin">
        <div>
          <p class="eyebrow">WACK / {{ adminActiveNav?.label ?? '工作台' }}</p>
          <h1>{{ adminActiveNav?.label ?? '管理员工作台' }}</h1>
          <p class="hero-text">{{ adminActiveNav?.desc }}</p>
        </div>
      </header>

      <p v-if="pageError" class="error-banner">{{ pageError }}</p>
      <p v-if="toast" class="toast-banner">{{ toast }}</p>

      <main class="layout">
        <AdminOverviewPanel
          v-if="activeTab === 'overview'"
          :admin-stats="adminStats"
          :course-calendar="courseCalendar"
          :free-times="freeTimes"
          :slot-label="slotLabel"
        />

        <AdminManagePanel
          v-if="activeTab === 'manage'"
          :users="users"
          :courses="courses"
          :user-form="userForm"
          :course-form="courseForm"
          :role-name="roleName"
          @create-user="emit('createUser')"
          @create-course="emit('createCourse')"
        />

        <AdminAttendancePanel
          v-if="activeTab === 'attendance'"
          :attendance-results="attendanceResults"
          :status-name="statusName"
          :status-class="statusClass"
          @update-admin-status="forwardUpdateStatus"
        />

        <AdminSettingsPanel
          v-if="activeTab === 'settings'"
          :password-form="passwordForm"
          @change-password="emit('changePassword')"
        />
      </main>
    </div>
  </div>
</template>
