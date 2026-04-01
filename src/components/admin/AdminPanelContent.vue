<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import type { AppTab, StatusCode } from '../../constants'
import type { ClassItem, CourseItem, UserItem } from '../../api'
import type { AdminWorkspaceProps } from './types'
import type { AdminCourseManagePathTarget, AdminCourseManageRouteView } from './shared-types'

const AdminOverviewPanel = defineAsyncComponent(() => import('./AdminOverviewPanel.vue'))
const AdminAttendancePanel = defineAsyncComponent(() => import('./AdminAttendancePanel.vue'))
const AdminAttendanceLogsPanel = defineAsyncComponent(() => import('./AdminAttendanceLogsPanel.vue'))
const AdminCourseCalendarPanel = defineAsyncComponent(() => import('./AdminCourseCalendarPanel.vue'))
const AdminCourseManagePanel = defineAsyncComponent(() => import('./AdminCourseManagePanel.vue'))
const AdminClassManagePanel = defineAsyncComponent(() => import('./AdminClassManagePanel.vue'))
const AdminStudentManagePanel = defineAsyncComponent(() => import('./AdminStudentManagePanel.vue'))
const AdminUserManagePanel = defineAsyncComponent(() => import('./AdminUserManagePanel.vue'))
const AdminSettingsPanel = defineAsyncComponent(() => import('./AdminSettingsPanel.vue'))

defineProps<AdminWorkspaceProps & {
  activeTab: AppTab
  courseManageRouteCourseId?: number | null
  courseManageRouteGroupId?: number | null
  courseManageRouteLessonId?: number | null
  courseManagePathCommand?: {
    token: number
    target: AdminCourseManagePathTarget
    courseId?: number | null
  } | null
}>()

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
  openAttendanceLogs: [payload: { term: string; courseGroupLessonId: number; studentId?: string }]
  openAttendanceDetail: [sessionId: number]
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
  updateCourseManageView: [view: AdminCourseManageRouteView]
  updateCourseManageRoute: [payload: { view: AdminCourseManageRouteView; courseId?: number | null; groupId?: number | null; lessonId?: number | null }]
}>()

function forwardUserStatus(studentId: string, status: number) {
  emit('setUserStatus', studentId, status)
}

</script>

<template>
  <div class="admin-panel-slot">
    <Transition name="page-fade" mode="out-in">
    <AdminOverviewPanel
      v-if="activeTab === 'overview'"
      key="overview"
      :overview-data="overviewData"
      @open-attendance-detail="emit('openAttendanceDetail', $event)"
    />

    <AdminAttendancePanel
      v-else-if="activeTab === 'attendance'"
      key="attendance"
      :attendance-results="attendanceResults"
      :course-terms="courseTerms"
      :status-name="statusName"
      :status-class="statusClass"
      @open-attendance-detail="emit('openAttendanceDetail', $event)"
    />

    <AdminAttendanceLogsPanel
      v-else-if="activeTab === 'attendance-logs'"
      key="attendance-logs"
      :attendance-logs="attendanceLogs"
      :course-terms="courseTerms"
      :attendance-log-filters="attendanceLogFilters"
      :attendance-logs-page="attendanceLogsPage"
      :attendance-logs-page-size="attendanceLogsPageSize"
      :attendance-logs-total-pages="attendanceLogsTotalPages"
      :attendance-logs-total-items="attendanceLogsTotalItems"
      :attendance-logs-all-items="attendanceLogsAllItems"
      :attendance-logs-page-options="attendanceLogsPageOptions"
      :status-name="statusName"
      @update-attendance-logs-page="emit('updateAttendanceLogsPage', $event)"
      @update-attendance-logs-page-size="emit('updateAttendanceLogsPageSize', $event)"
    />

    <AdminCourseCalendarPanel
      v-else-if="activeTab === 'course-calendar'"
      key="course-calendar"
      :course-calendar="courseCalendar"
      :selected-term="courseCalendarTerm"
      :free-times="freeTimes"
      :course-terms="courseTerms"
      :system-settings="systemSettings"
      @update:selected-term="emit('updateCourseCalendarTerm', $event)"
    />

    <AdminCourseManagePanel
      v-else-if="activeTab === 'course-manage'"
      key="course-manage"
      :courses="courses"
      :course-terms="courseTerms"
      :all-classes="allClasses"
      :course-filters="courseFilters"
      :course-form="courseForm"
      :course-modal-open="courseModalOpen"
      :delete-course-modal-open="deleteCourseModalOpen"
      :bulk-delete-course-modal-open="bulkDeleteCourseModalOpen"
      :course-saving="courseSaving"
      :course-loading="courseLoading"
      :course-deleting="courseDeleting"
      :is-editing-course="isEditingCourse"
      :course-page="coursePage"
      :course-page-size="coursePageSize"
      :course-total-pages="courseTotalPages"
      :course-total-items="courseTotalItems"
      :course-all-items="courseAllItems"
      :course-page-options="coursePageOptions"
      :selected-course-ids="selectedCourseIds"
      :selected-course-count="selectedCourseCount"
      :deleting-course-name="deletingCourseName"
      :course-manage-route-view="courseManageRouteView"
      :course-manage-route-course-id="courseManageRouteCourseId"
      :course-manage-route-group-id="courseManageRouteGroupId"
      :course-manage-route-lesson-id="courseManageRouteLessonId"
      :course-manage-path-command="courseManagePathCommand"
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
      @update-course-manage-view="emit('updateCourseManageView', $event)"
      @update-course-manage-route="emit('updateCourseManageRoute', $event)"
    />

    <AdminClassManagePanel
      v-else-if="activeTab === 'class-manage'"
      key="class-manage"
      :classes="classes"
      :students="students"
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
      :class-total-items="classTotalItems"
      :class-all-items="classAllItems"
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
      @import-class-students="emit('importClassStudents', $event)"
      @start-edit-class-student="emit('startEditClassStudent', $event)"
      @save-editing-class-student="emit('saveEditingClassStudent')"
      @delete-class-student="emit('deleteClassStudent', $event)"
      @update-class-page="emit('updateClassPage', $event)"
      @update-class-page-size="emit('updateClassPageSize', $event)"
      @toggle-class-selection="emit('toggleClassSelection', $event)"
      @toggle-class-page-selection="emit('toggleClassPageSelection')"
      @bulk-delete-classes="emit('bulkDeleteClasses')"
    />

    <AdminStudentManagePanel
      v-else-if="activeTab === 'student'"
      key="student"
      :students="students"
      :all-classes="allClasses"
      :student-form="studentForm"
      :student-filters="studentFilters"
      :student-modal-open="studentModalOpen"
      :delete-student-modal-open="deleteStudentModalOpen"
      :bulk-delete-student-modal-open="bulkDeleteStudentModalOpen"
      :student-saving="studentSaving"
      :student-deleting="studentDeleting"
      :is-editing-student="isEditingStudent"
      :student-page="studentPage"
      :student-page-size="studentPageSize"
      :student-total-pages="studentTotalPages"
      :student-total-items="studentTotalItems"
      :student-all-items="studentAllItems"
      :student-page-options="studentPageOptions"
      :selected-student-ids="selectedStudentIds"
      :selected-student-count="selectedStudentCount"
      :deleting-student-name="deletingStudentName"
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
      @update-student-page="emit('updateStudentPage', $event)"
      @update-student-page-size="emit('updateStudentPageSize', $event)"
      @toggle-student-selection="emit('toggleStudentSelection', $event)"
      @toggle-student-page-selection="emit('toggleStudentPageSelection')"
    />

    <AdminUserManagePanel
      v-else-if="activeTab === 'user-manage'"
      key="user-manage"
      :users="users"
      :all-classes="allClasses"
      :course-terms="courseTerms"
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
      :user-total-items="userTotalItems"
      :user-all-items="userAllItems"
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
    />

    <AdminSettingsPanel
      v-else-if="activeTab === 'settings'"
      key="settings"
      :me="me"
      :course-terms="courseTerms"
      :system-settings="systemSettings"
      :system-setting-saving="systemSettingSaving"
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
    </Transition>
  </div>
</template>
