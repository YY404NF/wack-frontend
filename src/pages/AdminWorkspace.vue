<script setup lang="ts">
import type { AttendanceResultItem, CourseCalendarItem, CourseItem, FreeTimeItem, SessionUser, UserItem } from '../api'
import type { AppTab, StatusCode } from '../constants'
import AdminSidebar from '../components/admin/AdminSidebar.vue'
import AdminOverviewPanel from '../components/admin/AdminOverviewPanel.vue'
import AdminAttendancePanel from '../components/admin/AdminAttendancePanel.vue'
import AdminFreeTimeCalendarPanel from '../components/admin/AdminFreeTimeCalendarPanel.vue'
import AdminCourseCalendarPanel from '../components/admin/AdminCourseCalendarPanel.vue'
import AdminCourseManagePanel from '../components/admin/AdminCourseManagePanel.vue'
import AdminUserManagePanel from '../components/admin/AdminUserManagePanel.vue'
import AdminPlaceholderPanel from '../components/admin/AdminPlaceholderPanel.vue'
import AdminSettingsPanel from '../components/admin/AdminSettingsPanel.vue'

defineProps<{
  me: SessionUser
  activeTab: AppTab
  pageError: string
  toast: string
  adminActiveNavLabel: string
  adminStats: Array<{ label: string; value: number; tone: string }>
  courseCalendar: CourseCalendarItem[]
  freeTimes: FreeTimeItem[]
  users: UserItem[]
  currentUserId?: number
  courses: CourseItem[]
  attendanceResults: AttendanceResultItem[]
  userForm: { studentId: string; realName: string; password: string; confirmPassword: string; role: number; status: number }
  userFilters: { studentId: string; realName: string; role: string; status: string }
  userModalOpen: boolean
  isEditingUser: boolean
  creatingUser: boolean
  userPage: number
  userPageSize: number
  userTotalPages: number
  userPageOptions: number[]
  userPasswordModalOpen: boolean
  userPasswordForm: { password: string; confirmPassword: string }
  passwordTargetName: string
  passwordResetting: boolean
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
  creatingCourse: boolean
  profileForm: { studentId: string; realName: string }
  profileModalOpen: boolean
  profileSaving: boolean
  passwordForm: { oldPassword: string; newPassword: string; confirmNewPassword: string }
  passwordModalOpen: boolean
  changingPassword: boolean
  roleName: (role?: number) => string
  statusName: (status: number) => string
  statusClass: (status: number) => Record<string, boolean>
  slotLabel: (weekday: number, section: number) => string
}>()

const emit = defineEmits<{
  'update:activeTab': [value: AppTab]
  logout: []
  openCreateUserModal: []
  openEditUserModal: [user: UserItem]
  closeUserModal: []
  openUserPasswordModal: [user: UserItem]
  closeUserPasswordModal: []
  resetUserPassword: []
  updateUserPage: [page: number]
  updateUserPageSize: [size: number]
  openProfileModal: []
  closeProfileModal: []
  updateProfile: []
  openPasswordModal: []
  closePasswordModal: []
  createUser: []
  setUserStatus: [studentId: string, status: number]
  createCourse: []
  updateAdminStatus: [detailId: number, status: StatusCode]
  changePassword: []
}>()

function forwardUpdateStatus(detailId: number, status: StatusCode) {
  emit('updateAdminStatus', detailId, status)
}

function forwardUserStatus(studentId: string, status: number) {
  emit('setUserStatus', studentId, status)
}
</script>

<template>
  <div class="admin-shell">
    <AdminSidebar :me="me" :active-tab="activeTab" :role-name="roleName" @update:active-tab="emit('update:activeTab', $event)" @logout="emit('logout')" />

    <div class="admin-content">
      <header class="topbar topbar-admin">
        <div>
          <h1>{{ adminActiveNavLabel }}</h1>
        </div>
      </header>

      <p v-if="pageError" class="error-banner">{{ pageError }}</p>
      <p v-if="toast" class="toast-banner">{{ toast }}</p>

      <main class="layout">
        <AdminOverviewPanel
          v-if="activeTab === 'overview'"
          :admin-stats="adminStats"
        />

        <AdminAttendancePanel
          v-if="activeTab === 'attendance'"
          :attendance-results="attendanceResults"
          :status-name="statusName"
          :status-class="statusClass"
          @update-admin-status="forwardUpdateStatus"
        />

        <AdminFreeTimeCalendarPanel
          v-if="activeTab === 'free-time-calendar'"
          :free-times="freeTimes"
          :slot-label="slotLabel"
        />

        <AdminPlaceholderPanel
          v-if="activeTab === 'free-time-manage'"
          title="查课学生空余时间管理"
          description="这一页暂时留空，后续会补空余时间的新增、编辑、筛选和批量维护。"
        />

        <AdminCourseCalendarPanel
          v-if="activeTab === 'course-calendar'"
          :course-calendar="courseCalendar"
          :slot-label="slotLabel"
        />

        <AdminCourseManagePanel
          v-if="activeTab === 'course-manage'"
          :courses="courses"
          :course-form="courseForm"
          :creating-course="creatingCourse"
          @create-course="emit('createCourse')"
        />

        <AdminPlaceholderPanel
          v-if="activeTab === 'class-manage'"
          title="班级管理"
          description="这一页暂时留空，后续会补班级列表、成员关系和班级维护操作。"
        />

        <AdminUserManagePanel
          v-if="activeTab === 'user-manage'"
          :users="users"
          :current-user-id="currentUserId"
          :user-form="userForm"
          :user-filters="userFilters"
          :user-modal-open="userModalOpen"
          :is-editing-user="isEditingUser"
          :creating-user="creatingUser"
          :user-page="userPage"
          :user-page-size="userPageSize"
          :user-total-pages="userTotalPages"
          :user-page-options="userPageOptions"
          :user-password-modal-open="userPasswordModalOpen"
          :user-password-form="userPasswordForm"
          :password-target-name="passwordTargetName"
          :password-resetting="passwordResetting"
          :role-name="roleName"
          @open-create-user-modal="emit('openCreateUserModal')"
          @open-edit-user-modal="emit('openEditUserModal', $event)"
          @close-user-modal="emit('closeUserModal')"
          @open-user-password-modal="emit('openUserPasswordModal', $event)"
          @close-user-password-modal="emit('closeUserPasswordModal')"
          @reset-user-password="emit('resetUserPassword')"
          @update-user-page="emit('updateUserPage', $event)"
          @update-user-page-size="emit('updateUserPageSize', $event)"
          @create-user="emit('createUser')"
          @set-user-status="forwardUserStatus"
        />

        <AdminPlaceholderPanel
          v-if="activeTab === 'logs'"
          title="系统日志"
          description="这一页暂时留空，后续会补管理员操作日志与查课明细日志联查。"
        />

        <AdminSettingsPanel
          v-if="activeTab === 'settings'"
          :me="me"
          :profile-form="profileForm"
          :profile-modal-open="profileModalOpen"
          :profile-saving="profileSaving"
          :password-form="passwordForm"
          :password-modal-open="passwordModalOpen"
          :changing-password="changingPassword"
          @open-profile-modal="emit('openProfileModal')"
          @close-profile-modal="emit('closeProfileModal')"
          @update-profile="emit('updateProfile')"
          @open-password-modal="emit('openPasswordModal')"
          @close-password-modal="emit('closePasswordModal')"
          @change-password="emit('changePassword')"
        />
      </main>
    </div>
  </div>
</template>
