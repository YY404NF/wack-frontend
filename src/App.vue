<script setup lang="ts">
import LoginPage from './pages/LoginPage.vue'
import SetupPage from './pages/SetupPage.vue'
import AdminWorkspace from './pages/AdminWorkspace.vue'
import StudentWorkspace from './pages/StudentWorkspace.vue'
import { useApp } from './composables/useApp'
import type { AppTab } from './constants'

const {
  activeCheck,
  activeTab,
  adminActiveNavLabel,
  adminStats,
  attendanceResults,
  authLoading,
  attendanceCompleting,
  availableCourses,
  booting,
  changePassword,
  closeProfileModal,
  closeUserModal,
  closeUserPasswordModal,
  completeAttendance,
  courseCalendar,
  courseForm,
  courses,
  courseSaving,
  currentUserId,
  createCourse,
  createUser,
  adminError,
  adminToast,
  editFreeTime,
  editingFreeTimeId,
  freeTimeForm,
  freeTimeSaving,
  freeTimes,
  initializeSystem,
  initialized,
  isAdmin,
  isEditingUser,
  login,
  loginError,
  loginForm,
  logout,
  me,
  openProfileModal,
  openPasswordModal,
  openCreateUserModal,
  openEditUserModal,
  openUserPasswordModal,
  openCourse,
  passwordForm,
  passwordResetting,
  passwordTargetName,
  passwordModalOpen,
  passwordSaving,
  closePasswordModal,
  paginatedUsers,
  profileForm,
  profileModalOpen,
  profileSaving,
  removeFreeTime,
  resetUserPassword,
  resetFreeTimeForm,
  roleName,
  saveFreeTime,
  selectedStudent,
  selectedStudentId,
  setUserStatus,
  setupForm,
  setupError,
  setupLoading,
  slotLabel,
  statusClass,
  statusName,
  studentError,
  studentToast,
  updateProfile,
  updateUserPage,
  updateUserPageSize,
  updateAdminStatus,
  updateStudentStatus,
  userFilters,
  userModalOpen,
  userPage,
  userPageOptions,
  userPageSize,
  userPasswordForm,
  userPasswordModalOpen,
  userTotalPages,
  userSaving,
  userForm,
} = useApp()

function setActiveTab(value: AppTab) {
  activeTab.value = value
}

function setSelectedStudentId(value: number) {
  selectedStudentId.value = value
}
</script>

<template>
  <div class="page-shell">
    <div v-if="booting" class="splash-card">
      <p class="eyebrow">WACK</p>
      <h1>正在恢复登录状态</h1>
    </div>

    <SetupPage
      v-else-if="!initialized"
      v-model:setup-form="setupForm"
      :loading="setupLoading"
      :error-message="setupError"
      @initialize="initializeSystem"
    />

    <LoginPage
      v-else-if="!me"
      v-model:login-form="loginForm"
      :auth-loading="authLoading"
      :error-message="loginError"
      @login="login"
    />

    <AdminWorkspace
      v-else-if="isAdmin"
      :me="me!"
      :active-tab="activeTab"
      :page-error="adminError"
      :toast="adminToast"
      :admin-active-nav-label="adminActiveNavLabel"
      :admin-stats="adminStats"
      :course-calendar="courseCalendar"
      :free-times="freeTimes"
      :users="paginatedUsers"
      :current-user-id="currentUserId"
      :courses="courses"
      :attendance-results="attendanceResults"
      :user-form="userForm"
      :user-filters="userFilters"
      :user-modal-open="userModalOpen"
      :is-editing-user="isEditingUser"
      :creating-user="userSaving"
      :user-page="userPage"
      :user-page-size="userPageSize"
      :user-total-pages="userTotalPages"
      :user-page-options="userPageOptions"
      :user-password-modal-open="userPasswordModalOpen"
      :user-password-form="userPasswordForm"
      :password-target-name="passwordTargetName"
      :password-resetting="passwordResetting"
      :course-form="courseForm"
      :creating-course="courseSaving"
      :profile-form="profileForm"
      :profile-modal-open="profileModalOpen"
      :profile-saving="profileSaving"
      :password-form="passwordForm"
      :password-modal-open="passwordModalOpen"
      :changing-password="passwordSaving"
      :role-name="roleName"
      :status-name="statusName"
      :status-class="statusClass"
      :slot-label="slotLabel"
      @update:active-tab="setActiveTab"
      @logout="logout"
      @open-create-user-modal="openCreateUserModal"
      @open-edit-user-modal="openEditUserModal"
      @close-user-modal="closeUserModal"
      @open-user-password-modal="openUserPasswordModal"
      @close-user-password-modal="closeUserPasswordModal"
      @reset-user-password="resetUserPassword"
      @update-user-page="updateUserPage"
      @update-user-page-size="updateUserPageSize"
      @open-profile-modal="openProfileModal"
      @close-profile-modal="closeProfileModal"
      @update-profile="updateProfile"
      @open-password-modal="openPasswordModal"
      @close-password-modal="closePasswordModal"
      @create-user="createUser"
      @set-user-status="setUserStatus"
      @create-course="createCourse"
      @update-admin-status="updateAdminStatus"
      @change-password="changePassword"
    />

    <StudentWorkspace
      v-else
      :me="me!"
      :active-tab="activeTab"
      :page-error="studentError"
      :toast="studentToast"
      :available-courses="availableCourses"
      :active-check="activeCheck"
      :selected-student="selectedStudent"
      :selected-student-id="selectedStudentId"
      :free-times="freeTimes"
      :free-time-form="freeTimeForm"
      :editing-free-time-id="editingFreeTimeId"
      :password-form="passwordForm"
      :saving-free-time="freeTimeSaving"
      :completing-attendance="attendanceCompleting"
      :changing-password="passwordSaving"
      :role-name="roleName"
      :status-name="statusName"
      :status-class="statusClass"
      :slot-label="slotLabel"
      @update:active-tab="setActiveTab"
      @update:selected-student-id="setSelectedStudentId"
      @logout="logout"
      @open-course="openCourse"
      @update-student-status="updateStudentStatus"
      @complete-attendance="completeAttendance"
      @save-free-time="saveFreeTime"
      @edit-free-time="editFreeTime"
      @remove-free-time="removeFreeTime"
      @reset-free-time-form="resetFreeTimeForm"
      @change-password="changePassword"
    />
  </div>
</template>
