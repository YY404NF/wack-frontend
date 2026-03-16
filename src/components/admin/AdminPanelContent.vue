<script setup lang="ts">
import type { AppTab, StatusCode } from '../../constants'
import type { ClassItem, CourseItem, UserItem } from '../../api'
import type { AdminWorkspaceProps } from './types'
import AdminOverviewPanel from './AdminOverviewPanel.vue'
import AdminAttendanceLogsPanel from './AdminAttendanceLogsPanel.vue'
import AdminCourseCalendarPanel from './AdminCourseCalendarPanel.vue'
import AdminCourseManagePanel from './AdminCourseManagePanel.vue'
import AdminClassManagePanel from './AdminClassManagePanel.vue'
import AdminLogsPanel from './AdminLogsPanel.vue'
import AdminUserManagePanel from './AdminUserManagePanel.vue'
import AdminPlaceholderPanel from './AdminPlaceholderPanel.vue'
import AdminSettingsPanel from './AdminSettingsPanel.vue'

defineProps<AdminWorkspaceProps & { activeTab: AppTab }>()

const emit = defineEmits<{
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
  bulkDeleteClasses: []
  createClassStudent: []
  startEditClassStudent: [studentId: number]
  saveEditingClassStudent: []
  deleteClassStudent: [studentId: number]
  importClasses: [files: File[]]
  updateClassPage: [page: number]
  updateClassPageSize: [size: number]
  toggleClassSelection: [classId: number]
  toggleClassPageSelection: []
  updateLogsPage: [page: number]
  updateLogsPageSize: [size: number]
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
  openCourseStudentModal: [item: CourseItem]
  closeCourseModal: []
  closeCourseStudentModal: []
  openDeleteCourseModal: [item: CourseItem]
  closeDeleteCourseModal: []
  openBulkDeleteCourseModal: []
  closeBulkDeleteCourseModal: []
  saveCourse: []
  importCourses: [files: File[]]
  addCourseStudentClass: [classId: number]
  removeCourseStudentClass: [classId: number]
  toggleCourseStudentClassSelection: [classId: number]
  toggleCourseStudentSelection: [studentId: string]
  addCourseStudent: [studentId: string]
  removeCourseStudent: [studentId: string]
  saveCourseStudents: []
  deleteCourse: []
  setCourseWeekSelected: [payload: { weekNo: number; selected: boolean }]
  addCourseSessions: []
  editCourseSession: [sessionNo: number]
  removeCourseSession: [sessionNo: number]
  updateCoursePage: [page: number]
  updateCoursePageSize: [size: number]
  toggleCourseSelection: [courseId: number]
  toggleCoursePageSelection: []
  bulkDeleteCourses: []
  updateSystemSettings: [payload: { current_term_start_date: string; current_schedule: 'summer' | 'winter' }]
  updateAdminStatus: [detailId: number, status: StatusCode]
  changePassword: []
}>()

function forwardUserStatus(studentId: string, status: number) {
  emit('setUserStatus', studentId, status)
}
</script>

<template>
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

    <AdminCourseCalendarPanel
      v-if="activeTab === 'course-calendar'"
      :course-calendar="courseCalendar"
      :free-times="freeTimes"
      :classes="allClasses"
      :system-settings="systemSettings"
    />

    <AdminCourseManagePanel
      v-if="activeTab === 'course-manage'"
      :courses="courses"
      :all-classes="allClasses"
      :course-student-candidates="courseStudentCandidates"
      :course-filters="courseFilters"
      :course-form="courseForm"
      :course-modal-open="courseModalOpen"
      :delete-course-modal-open="deleteCourseModalOpen"
      :bulk-delete-course-modal-open="bulkDeleteCourseModalOpen"
      :course-student-modal-open="courseStudentModalOpen"
      :course-student-loading="courseStudentLoading"
      :course-student-saving="courseStudentSaving"
      :course-importing="courseImporting"
      :course-student-target-name="courseStudentTargetName"
      :course-student-selected-class-ids="courseStudentSelectedClassIds"
      :course-student-selected-student-ids="courseStudentSelectedStudentIds"
      :course-student-class-student-map="courseStudentClassStudentMap"
      :course-student-loose-students="courseStudentLooseStudents"
      :course-saving="courseSaving"
      :course-loading="courseLoading"
      :course-deleting="courseDeleting"
      :is-editing-course="isEditingCourse"
      :course-page="coursePage"
      :course-page-size="coursePageSize"
      :course-total-pages="courseTotalPages"
      :course-page-options="coursePageOptions"
      :selected-course-ids="selectedCourseIds"
      :selected-course-count="selectedCourseCount"
      :deleting-course-name="deletingCourseName"
      @open-create-course-modal="emit('openCreateCourseModal')"
      @open-edit-course-modal="emit('openEditCourseModal', $event)"
      @open-course-student-modal="emit('openCourseStudentModal', $event)"
      @close-course-modal="emit('closeCourseModal')"
      @close-course-student-modal="emit('closeCourseStudentModal')"
      @open-delete-course-modal="emit('openDeleteCourseModal', $event)"
      @close-delete-course-modal="emit('closeDeleteCourseModal')"
      @open-bulk-delete-course-modal="emit('openBulkDeleteCourseModal')"
      @close-bulk-delete-course-modal="emit('closeBulkDeleteCourseModal')"
      @save-course="emit('saveCourse')"
      @import-courses="emit('importCourses', $event)"
      @add-course-student-class="emit('addCourseStudentClass', $event)"
      @remove-course-student-class="emit('removeCourseStudentClass', $event)"
      @toggle-course-student-class-selection="emit('toggleCourseStudentClassSelection', $event)"
      @toggle-course-student-selection="emit('toggleCourseStudentSelection', $event)"
      @add-course-student="emit('addCourseStudent', $event)"
      @remove-course-student="emit('removeCourseStudent', $event)"
      @save-course-students="emit('saveCourseStudents')"
      @delete-course="emit('deleteCourse')"
      @set-course-week-selected="emit('setCourseWeekSelected', $event)"
      @add-course-sessions="emit('addCourseSessions')"
      @edit-course-session="emit('editCourseSession', $event)"
      @remove-course-session="emit('removeCourseSession', $event)"
      @update-course-page="emit('updateCoursePage', $event)"
      @update-course-page-size="emit('updateCoursePageSize', $event)"
      @toggle-course-selection="emit('toggleCourseSelection', $event)"
      @toggle-course-page-selection="emit('toggleCoursePageSelection')"
      @bulk-delete-courses="emit('bulkDeleteCourses')"
    />

    <AdminClassManagePanel
      v-if="activeTab === 'class-manage'"
      :classes="classes"
      :class-form="classForm"
      :class-filters="classFilters"
      :class-student-form="classStudentForm"
      :editing-class-student-form="editingClassStudentForm"
      :class-student-filters="classStudentFilters"
      :class-students="classStudents"
      :class-student-modal-open="classStudentModalOpen"
      :class-student-saving="classStudentSaving"
      :class-student-importing="classStudentImporting"
      :editing-class-student-id="editingClassStudentId"
      :class-student-target-name="classStudentTargetName"
      :class-modal-open="classModalOpen"
      :delete-class-modal-open="deleteClassModalOpen"
      :bulk-delete-class-modal-open="bulkDeleteClassModalOpen"
      :is-editing-class="isEditingClass"
      :class-saving="classSaving"
      :class-deleting="classDeleting"
      :class-page="classPage"
      :class-page-size="classPageSize"
      :class-total-pages="classTotalPages"
      :class-page-options="classPageOptions"
      :selected-class-ids="selectedClassIds"
      :selected-class-count="selectedClassCount"
      :deleting-class-name="deletingClassName"
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
      @create-class-student="emit('createClassStudent')"
      @start-edit-class-student="emit('startEditClassStudent', $event)"
      @save-editing-class-student="emit('saveEditingClassStudent')"
      @delete-class-student="emit('deleteClassStudent', $event)"
      @import-classes="emit('importClasses', $event)"
      @update-class-page="emit('updateClassPage', $event)"
      @update-class-page-size="emit('updateClassPageSize', $event)"
      @toggle-class-selection="emit('toggleClassSelection', $event)"
      @toggle-class-page-selection="emit('toggleClassPageSelection')"
      @bulk-delete-classes="emit('bulkDeleteClasses')"
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
      :user-status-updating="userStatusUpdating"
      :user-page="userPage"
      :user-page-size="userPageSize"
      :user-total-pages="userTotalPages"
      :user-page-options="userPageOptions"
      :selected-user-student-ids="selectedUserStudentIds"
      :user-password-modal-open="userPasswordModalOpen"
      :user-password-form="userPasswordForm"
      :password-target-name="passwordTargetName"
      :password-resetting="passwordResetting"
      :user-free-time-modal-open="userFreeTimeModalOpen"
      :free-time-target-name="freeTimeTargetName"
      :user-free-time-term="userFreeTimeTerm"
      :user-free-time-term-options="userFreeTimeTermOptions"
      :user-free-time-loading="userFreeTimeLoading"
      :user-free-time-saving="userFreeTimeSaving"
      :user-free-time-draft="userFreeTimeDraft"
      :role-name="roleName"
      @open-create-user-modal="emit('openCreateUserModal')"
      @open-edit-user-modal="emit('openEditUserModal', $event)"
      @close-user-modal="emit('closeUserModal')"
      @open-user-password-modal="emit('openUserPasswordModal', $event)"
      @close-user-password-modal="emit('closeUserPasswordModal')"
      @open-user-free-time-modal="emit('openUserFreeTimeModal', $event)"
      @close-user-free-time-modal="emit('closeUserFreeTimeModal')"
      @update-user-free-time-term="emit('updateUserFreeTimeTerm', $event)"
      @toggle-user-free-time-week="emit('toggleUserFreeTimeWeek', $event)"
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
      :system-settings="systemSettings"
      :system-setting-saving="systemSettingSaving"
      :schedule-options="scheduleOptions"
      :profile-form="profileForm"
      :profile-modal-open="profileModalOpen"
      :profile-saving="profileSaving"
      :password-form="passwordForm"
      :password-modal-open="passwordModalOpen"
      :changing-password="changingPassword"
      @update-system-settings="emit('updateSystemSettings', $event)"
      @open-profile-modal="emit('openProfileModal')"
      @close-profile-modal="emit('closeProfileModal')"
      @update-profile="emit('updateProfile')"
      @open-password-modal="emit('openPasswordModal')"
      @close-password-modal="emit('closePasswordModal')"
      @change-password="emit('changePassword')"
    />
  </div>
</template>
