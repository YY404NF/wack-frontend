<script setup lang="ts">
import { computed, ref } from 'vue'
import { HomeFilled } from '@element-plus/icons-vue'

import type { AppTab, StatusCode } from '../constants'
import { adminNavItems } from '../constants'
import AdminSidebar from '../components/admin/AdminSidebar.vue'
import AdminPanelContent from '../components/admin/AdminPanelContent.vue'
import AboutCaptchaGate from '../components/about/AboutCaptchaGate.vue'
import type { ClassItem, CourseItem, UserItem } from '../api'
import type { AdminWorkspaceProps } from '../components/admin/types'
import { aboutCaptchaChallenges } from '../data/aboutCaptchaChallenges'

const props = defineProps<AdminWorkspaceProps & { activeTab: AppTab }>()

const emit = defineEmits<{
  'update:activeTab': [value: AppTab]
  logout: []
  openCreateClassModal: []
  openEditClassModal: [item: ClassItem]
  openClassStudentModal: [item: ClassItem]
  closeClassModal: []
  closeClassStudentModal: []
  openDeleteClassModal: [item: ClassItem]
  closeDeleteClassModal: []
  openBulkDeleteClassModal: []
  closeBulkDeleteClassModal: []
  saveClass: []
  deleteClass: []
  openCreateStudentModal: []
  openEditStudentModal: [item: any]
  closeStudentModal: []
  openDeleteStudentModal: [item: any]
  closeDeleteStudentModal: []
  openBulkDeleteStudentModal: []
  closeBulkDeleteStudentModal: []
  saveStudent: []
  deleteStudent: []
  bulkDeleteStudents: []
  bulkDeleteClasses: []
  createClassStudent: []
  importClassStudents: [file: File]
  startEditClassStudent: [studentId: number]
  saveEditingClassStudent: []
  deleteClassStudent: [studentId: number]
  updateClassPage: [page: number]
  updateClassPageSize: [size: number]
  updateStudentPage: [page: number]
  updateStudentPageSize: [size: number]
  toggleStudentSelection: [studentId: number]
  toggleStudentPageSelection: []
  toggleClassSelection: [classId: number]
  toggleClassPageSelection: []
  updateAttendanceLogsPage: [page: number]
  updateAttendanceLogsPageSize: [size: number]
  openCreateUserModal: []
  openEditUserModal: [user: UserItem]
  closeUserModal: []
  openUserPasswordModal: [user: UserItem]
  closeUserPasswordModal: []
  openUserFreeTimeModal: [user: UserItem]
  closeUserFreeTimeModal: []
  updateUserFreeTimeTerm: [term: string]
  toggleUserFreeTimeWeek: [payload: { weekday: number; section: number; weekNo: number }]
  toggleUserFreeTimeCell: [payload: { weekday: number; section: number }]
  saveUserFreeTime: []
  resetUserPassword: []
  updateUserPage: [page: number]
  updateUserPageSize: [size: number]
  toggleUserSelection: [studentId: string]
  toggleUserPageSelection: []
  bulkFreezeUsers: []
  bulkUnfreezeUsers: []
  openProfileModal: []
  closeProfileModal: []
  updateProfile: []
  openPasswordModal: []
  closePasswordModal: []
  createUser: []
  setUserStatus: [studentId: string, status: number]
  openCreateCourseModal: []
  openEditCourseModal: [item: CourseItem]
  closeCourseModal: []
  openDeleteCourseModal: [item: CourseItem]
  closeDeleteCourseModal: []
  openBulkDeleteCourseModal: []
  closeBulkDeleteCourseModal: []
  saveCourse: []
  deleteCourse: []
  updateCoursePage: [page: number]
  updateCoursePageSize: [size: number]
  toggleCourseSelection: [courseId: number]
  toggleCoursePageSelection: []
  bulkDeleteCourses: []
  updateCourseCalendarTerm: [term: string]
  updateSystemSettings: [payload: { current_term_start_date: string }]
  updateAdminStatus: [sessionId: number, studentRefId: number, status: StatusCode]
  changePassword: []
}>()

function forwardUserStatus(studentId: string, status: number) {
  emit('setUserStatus', studentId, status)
}

const aboutCaptchaOpen = ref(false)
const aboutModalOpen = ref(false)

const activeTabLabel = computed(() => {
  return adminNavItems.find((item) => item.key === props.activeTab)?.label ?? '当前页面'
})

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
</script>

<template>
  <div class="admin-mobile-guard">
    <section class="workspace-card admin-mobile-card">
      <div>
        <p class="section-kicker">管理员端</p>
        <h2>请在 PC 上打开</h2>
        <p class="hint">当前界面仅支持桌面端操作。你可以在电脑浏览器中打开后继续管理课程、班级和系统设置。</p>
      </div>
      <button class="ghost-button" type="button" @click="emit('logout')">退出登录</button>
    </section>
  </div>

  <div class="admin-shell">
    <AdminSidebar
      :me="me"
      :active-tab="activeTab"
      :role-name="roleName"
      @update:active-tab="emit('update:activeTab', $event)"
      @logout="emit('logout')"
      @open-about="openAboutEntry"
    />

    <div class="admin-content">
      <main class="layout">
        <header class="admin-path-bar">
          <span class="admin-path-home" aria-hidden="true">
            <HomeFilled class="admin-path-home-icon" />
          </span>
          <span class="admin-path-separator" aria-hidden="true">/</span>
          <span class="admin-path-current">{{ activeTabLabel }}</span>
        </header>

        <div v-if="pageError || toast" class="notice-stack">
          <p v-if="pageError" class="error-banner">{{ pageError }}</p>
          <p v-if="toast" class="toast-banner">{{ toast }}</p>
        </div>

        <AdminPanelContent
          v-bind="$props"
          @open-create-course-modal="emit('openCreateCourseModal')"
          @open-edit-course-modal="emit('openEditCourseModal', $event)"
          @close-course-modal="emit('closeCourseModal')"
          @open-delete-course-modal="emit('openDeleteCourseModal', $event)"
          @close-delete-course-modal="emit('closeDeleteCourseModal')"
          @open-bulk-delete-course-modal="emit('openBulkDeleteCourseModal')"
          @close-bulk-delete-course-modal="emit('closeBulkDeleteCourseModal')"
          @save-course="emit('saveCourse')"
          @delete-course="emit('deleteCourse')"
          @update-course-page="emit('updateCoursePage', $event)"
          @update-course-page-size="emit('updateCoursePageSize', $event)"
          @toggle-course-selection="emit('toggleCourseSelection', $event)"
          @toggle-course-page-selection="emit('toggleCoursePageSelection')"
          @bulk-delete-courses="emit('bulkDeleteCourses')"
          @update-course-calendar-term="emit('updateCourseCalendarTerm', $event)"
          @open-create-class-modal="emit('openCreateClassModal')"
          @open-edit-class-modal="emit('openEditClassModal', $event)"
          @open-class-student-modal="emit('openClassStudentModal', $event)"
          @close-class-modal="emit('closeClassModal')"
          @close-class-student-modal="emit('closeClassStudentModal')"
          @open-delete-class-modal="emit('openDeleteClassModal', $event)"
          @close-delete-class-modal="emit('closeDeleteClassModal')"
          @open-bulk-delete-class-modal="emit('openBulkDeleteClassModal')"
          @close-bulk-delete-class-modal="emit('closeBulkDeleteClassModal')"
          @save-class="emit('saveClass')"
          @delete-class="emit('deleteClass')"
          @open-create-student-modal="emit('openCreateStudentModal')"
          @open-edit-student-modal="emit('openEditStudentModal', $event)"
          @close-student-modal="emit('closeStudentModal')"
          @open-delete-student-modal="emit('openDeleteStudentModal', $event)"
          @close-delete-student-modal="emit('closeDeleteStudentModal')"
          @open-bulk-delete-student-modal="emit('openBulkDeleteStudentModal')"
          @close-bulk-delete-student-modal="emit('closeBulkDeleteStudentModal')"
          @save-student="emit('saveStudent')"
          @delete-student="emit('deleteStudent')"
          @bulk-delete-students="emit('bulkDeleteStudents')"
          @create-class-student="emit('createClassStudent')"
          @import-class-students="emit('importClassStudents', $event)"
          @start-edit-class-student="emit('startEditClassStudent', $event)"
          @save-editing-class-student="emit('saveEditingClassStudent')"
          @delete-class-student="emit('deleteClassStudent', $event)"
          @update-class-page="emit('updateClassPage', $event)"
          @update-class-page-size="emit('updateClassPageSize', $event)"
          @update-student-page="emit('updateStudentPage', $event)"
          @update-student-page-size="emit('updateStudentPageSize', $event)"
          @toggle-student-selection="emit('toggleStudentSelection', $event)"
          @toggle-student-page-selection="emit('toggleStudentPageSelection')"
          @toggle-class-selection="emit('toggleClassSelection', $event)"
          @toggle-class-page-selection="emit('toggleClassPageSelection')"
          @bulk-delete-classes="emit('bulkDeleteClasses')"
          @update-attendance-logs-page="emit('updateAttendanceLogsPage', $event)"
          @update-attendance-logs-page-size="emit('updateAttendanceLogsPageSize', $event)"
          @open-create-user-modal="emit('openCreateUserModal')"
          @open-edit-user-modal="emit('openEditUserModal', $event)"
          @close-user-modal="emit('closeUserModal')"
          @open-user-password-modal="emit('openUserPasswordModal', $event)"
          @close-user-password-modal="emit('closeUserPasswordModal')"
          @open-user-free-time-modal="emit('openUserFreeTimeModal', $event)"
          @close-user-free-time-modal="emit('closeUserFreeTimeModal')"
          @update-user-free-time-term="emit('updateUserFreeTimeTerm', $event)"
          @toggle-user-free-time-week="emit('toggleUserFreeTimeWeek', $event)"
          @toggle-user-free-time-cell="emit('toggleUserFreeTimeCell', $event)"
          @save-user-free-time="emit('saveUserFreeTime')"
          @reset-user-password="emit('resetUserPassword')"
          @update-user-page="emit('updateUserPage', $event)"
          @update-user-page-size="emit('updateUserPageSize', $event)"
          @toggle-user-selection="emit('toggleUserSelection', $event)"
          @toggle-user-page-selection="emit('toggleUserPageSelection')"
          @bulk-freeze-users="emit('bulkFreezeUsers')"
          @bulk-unfreeze-users="emit('bulkUnfreezeUsers')"
          @create-user="emit('createUser')"
          @set-user-status="forwardUserStatus"
          @update-system-settings="emit('updateSystemSettings', $event)"
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
