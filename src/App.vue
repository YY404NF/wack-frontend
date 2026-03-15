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
  adminActiveNav,
  adminStats,
  attendanceResults,
  authLoading,
  availableCourses,
  booting,
  changePassword,
  completeAttendance,
  courseCalendar,
  courseForm,
  courses,
  createCourse,
  createUser,
  editFreeTime,
  editingFreeTimeId,
  freeTimeForm,
  freeTimes,
  initializeSystem,
  initialized,
  isAdmin,
  login,
  loginForm,
  logout,
  me,
  openCourse,
  pageError,
  passwordForm,
  removeFreeTime,
  resetFreeTimeForm,
  roleName,
  saveFreeTime,
  selectedStudent,
  selectedStudentId,
  setupForm,
  setupLoading,
  slotLabel,
  statusClass,
  statusName,
  toast,
  updateAdminStatus,
  updateStudentStatus,
  userForm,
  users,
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
      :error-message="pageError"
      @initialize="initializeSystem"
    />

    <LoginPage
      v-else-if="!me"
      v-model:login-form="loginForm"
      :auth-loading="authLoading"
      :error-message="pageError"
      @login="login"
    />

    <AdminWorkspace
      v-else-if="isAdmin"
      :me="me!"
      :active-tab="activeTab"
      :page-error="pageError"
      :toast="toast"
      :admin-active-nav="adminActiveNav"
      :admin-stats="adminStats"
      :course-calendar="courseCalendar"
      :free-times="freeTimes"
      :users="users"
      :courses="courses"
      :attendance-results="attendanceResults"
      :user-form="userForm"
      :course-form="courseForm"
      :password-form="passwordForm"
      :role-name="roleName"
      :status-name="statusName"
      :status-class="statusClass"
      :slot-label="slotLabel"
      @update:active-tab="setActiveTab"
      @logout="logout"
      @create-user="createUser"
      @create-course="createCourse"
      @update-admin-status="updateAdminStatus"
      @change-password="changePassword"
    />

    <StudentWorkspace
      v-else
      :me="me!"
      :active-tab="activeTab"
      :page-error="pageError"
      :toast="toast"
      :available-courses="availableCourses"
      :active-check="activeCheck"
      :selected-student="selectedStudent"
      :selected-student-id="selectedStudentId"
      :free-times="freeTimes"
      :free-time-form="freeTimeForm"
      :editing-free-time-id="editingFreeTimeId"
      :password-form="passwordForm"
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
