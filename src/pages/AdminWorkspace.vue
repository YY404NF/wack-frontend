<script setup lang="ts">
import type { AppTab, StatusCode } from '../constants'
import AdminSidebar from '../components/admin/AdminSidebar.vue'
import AdminOverviewPanel from '../components/admin/AdminOverviewPanel.vue'
import AdminAttendanceLogsPanel from '../components/admin/AdminAttendanceLogsPanel.vue'
import AdminFreeTimeCalendarPanel from '../components/admin/AdminFreeTimeCalendarPanel.vue'
import AdminCourseCalendarPanel from '../components/admin/AdminCourseCalendarPanel.vue'
import AdminCourseManagePanel from '../components/admin/AdminCourseManagePanel.vue'
import AdminClassManagePanel from '../components/admin/AdminClassManagePanel.vue'
import AdminLogsPanel from '../components/admin/AdminLogsPanel.vue'
import AdminUserManagePanel from '../components/admin/AdminUserManagePanel.vue'
import AdminPlaceholderPanel from '../components/admin/AdminPlaceholderPanel.vue'
import AdminSettingsPanel from '../components/admin/AdminSettingsPanel.vue'
import type { ClassItem, UserItem } from '../api'
import type { AdminWorkspaceProps } from '../components/admin/types'

defineProps<AdminWorkspaceProps & { activeTab: AppTab }>()

const emit = defineEmits<{
  'update:activeTab': [value: AppTab]
  logout: []
  openCreateClassModal: []
  openEditClassModal: [item: ClassItem]
  closeClassModal: []
  openDeleteClassModal: [item: ClassItem]
  closeDeleteClassModal: []
  saveClass: []
  deleteClass: []
  updateClassPage: [page: number]
  updateClassPageSize: [size: number]
  updateLogsPage: [page: number]
  updateLogsPageSize: [size: number]
  updateAttendanceLogsPage: [page: number]
  updateAttendanceLogsPageSize: [size: number]
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

function forwardUserStatus(studentId: string, status: number) {
  emit('setUserStatus', studentId, status)
}
</script>

<template>
  <div class="admin-shell">
    <AdminSidebar :me="me" :active-tab="activeTab" :role-name="roleName" @update:active-tab="emit('update:activeTab', $event)" @logout="emit('logout')" />

    <div class="admin-content">
      <main class="layout">
        <div v-if="pageError || toast" class="notice-stack">
          <p v-if="pageError" class="error-banner">{{ pageError }}</p>
          <p v-if="toast" class="toast-banner">{{ toast }}</p>
        </div>

        <div class="admin-panel-slot">
          <AdminOverviewPanel
            v-if="activeTab === 'overview'"
            :admin-stats="adminStats"
          />

          <AdminPlaceholderPanel
            v-if="activeTab === 'attendance'"
            title="查课记录"
            description="这一页先留空，后续再补查课记录列表、详情联查和状态维护。"
          />

          <AdminAttendanceLogsPanel
            v-if="activeTab === 'attendance-logs'"
            :attendance-logs="attendanceLogs"
            :attendance-log-filters="attendanceLogFilters"
            :attendance-logs-page="attendanceLogsPage"
            :attendance-logs-page-size="attendanceLogsPageSize"
            :attendance-logs-total-pages="attendanceLogsTotalPages"
            :attendance-logs-page-options="attendanceLogsPageOptions"
            :status-name="statusName"
            @update-attendance-logs-page="emit('updateAttendanceLogsPage', $event)"
            @update-attendance-logs-page-size="emit('updateAttendanceLogsPageSize', $event)"
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

          <AdminClassManagePanel
            v-if="activeTab === 'class-manage'"
            :classes="classes"
            :class-form="classForm"
            :class-filters="classFilters"
            :class-modal-open="classModalOpen"
            :delete-class-modal-open="deleteClassModalOpen"
            :is-editing-class="isEditingClass"
            :class-saving="classSaving"
            :class-deleting="classDeleting"
            :class-page="classPage"
            :class-page-size="classPageSize"
            :class-total-pages="classTotalPages"
            :class-page-options="classPageOptions"
            :deleting-class-name="deletingClassName"
            @open-create-class-modal="emit('openCreateClassModal')"
            @open-edit-class-modal="emit('openEditClassModal', $event)"
            @close-class-modal="emit('closeClassModal')"
            @open-delete-class-modal="emit('openDeleteClassModal', $event)"
            @close-delete-class-modal="emit('closeDeleteClassModal')"
            @save-class="emit('saveClass')"
            @delete-class="emit('deleteClass')"
            @update-class-page="emit('updateClassPage', $event)"
            @update-class-page-size="emit('updateClassPageSize', $event)"
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

          <AdminLogsPanel
            v-if="activeTab === 'logs'"
            :logs="logs"
            :log-filters="logFilters"
            :logs-page="logsPage"
            :logs-page-size="logsPageSize"
            :logs-total-pages="logsTotalPages"
            :logs-page-options="logsPageOptions"
            @update-logs-page="emit('updateLogsPage', $event)"
            @update-logs-page-size="emit('updateLogsPageSize', $event)"
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
        </div>
      </main>
    </div>
  </div>
</template>
