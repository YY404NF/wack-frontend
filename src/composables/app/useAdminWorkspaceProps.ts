import { computed, type ComputedRef, type Ref } from 'vue'

import type { AttendanceResultItem, ClassItem, ClassStudentItem, CourseItem, FreeTimeItem, MetaTermItem, SessionUser, SystemSetting, StudentItem } from '../../api'
import type {
  AdminAttendanceLogFilters,
  AdminClassForm,
  AdminClassFilters,
  AdminClassStudentForm,
  AdminClassStudentFilters,
  AdminCourseForm,
  AdminCourseFilters,
  AdminPasswordForm,
  AdminProfileForm,
  AdminStudentFilters,
  AdminStudentForm,
  AdminUserFilters,
  AdminUserForm,
  AdminUserPasswordForm,
} from '../../components/admin/form-types'
import type { AppTab } from '../../constants'
import { roleName, slotLabel, statusClass, statusName, USER_PAGE_OPTIONS } from './view'

export type AdminWorkspacePropsDeps = {
  me: Ref<SessionUser | null>
  activeTab: Ref<AppTab>
  adminError: Ref<string>
  adminToast: Ref<string>
  adminStats: ComputedRef<Array<{ label: string; value: number; tone: string }>>
  courseCalendar: Ref<any[]>
  courseCalendarTerm: Ref<string>
  freeTimes: Ref<FreeTimeItem[]>
  systemSettings: Ref<SystemSetting | null>
  systemSettingSaving: Ref<boolean>
  paginatedAttendanceLogs: ComputedRef<any[]>
  paginatedClasses: ComputedRef<ClassItem[]>
  classes: Ref<ClassItem[]>
  students: Ref<StudentItem[]>
  paginatedStudents: ComputedRef<StudentItem[]>
  filteredClassStudents: ComputedRef<ClassStudentItem[]>
  paginatedUsers: ComputedRef<any[]>
  currentUserId: ComputedRef<number | undefined>
  paginatedCourses: ComputedRef<CourseItem[]>
  courseTerms: Ref<MetaTermItem[]>
  attendanceResults: Ref<AttendanceResultItem[]>
  userForm: AdminUserForm
  userFilters: AdminUserFilters
  userModalOpen: Ref<boolean>
  isEditingUser: ComputedRef<boolean>
  userSaving: Ref<boolean>
  userStatusUpdating: Ref<boolean>
  userPage: Ref<number>
  userPageSize: Ref<number>
  userTotalPages: Ref<number> | ComputedRef<number>
  selectedUserStudentIds: Ref<string[]>
  userPasswordModalOpen: Ref<boolean>
  userPasswordForm: AdminUserPasswordForm
  passwordTargetName: Ref<string>
  passwordResetting: Ref<boolean>
  userFreeTimeModalOpen: Ref<boolean>
  freeTimeTargetName: Ref<string>
  userFreeTimeTerm: Ref<string>
  userFreeTimeTermOptions: ComputedRef<string[]>
  userFreeTimeLoading: Ref<boolean>
  userFreeTimeSaving: Ref<boolean>
  userFreeTimeDraft: Ref<Record<string, number[]>>
  courseFilters: AdminCourseFilters
  courseForm: AdminCourseForm
  courseModalOpen: Ref<boolean>
  deleteCourseModalOpen: Ref<boolean>
  bulkDeleteCourseModalOpen: Ref<boolean>
  courseSaving: Ref<boolean>
  courseLoading: Ref<boolean>
  courseDeleting: Ref<boolean>
  editingCourseId: Ref<number | null>
  coursePage: Ref<number>
  coursePageSize: Ref<number>
  courseTotalPages: Ref<number> | ComputedRef<number>
  selectedCourseIds: Ref<number[]>
  deletingCourseName: Ref<string>
  classForm: AdminClassForm
  classFilters: AdminClassFilters
  classStudentForm: AdminClassStudentForm
  editingClassStudentForm: AdminClassStudentForm
  classStudentFilters: AdminClassStudentFilters
  studentForm: AdminStudentForm
  studentFilters: AdminStudentFilters
  classStudentModalOpen: Ref<boolean>
  classStudentSaving: Ref<boolean>
  classStudentImporting: Ref<boolean>
  editingClassStudentId: Ref<number | null>
  classStudentTargetName: Ref<string>
  classModalOpen: Ref<boolean>
  deleteClassModalOpen: Ref<boolean>
  bulkDeleteClassModalOpen: Ref<boolean>
  isEditingClass: ComputedRef<boolean>
  classSaving: Ref<boolean>
  classDeleting: Ref<boolean>
  classPage: Ref<number>
  classPageSize: Ref<number>
  classTotalPages: Ref<number> | ComputedRef<number>
  selectedClassIds: Ref<number[]>
  deletingClassName: Ref<string>
  studentModalOpen: Ref<boolean>
  deleteStudentModalOpen: Ref<boolean>
  bulkDeleteStudentModalOpen: Ref<boolean>
  studentSaving: Ref<boolean>
  studentDeleting: Ref<boolean>
  editingStudentId: Ref<number | null>
  studentPage: Ref<number>
  studentPageSize: Ref<number>
  studentTotalPages: Ref<number> | ComputedRef<number>
  selectedStudentIds: Ref<number[]>
  deletingStudentName: Ref<string>
  attendanceLogFilters: AdminAttendanceLogFilters
  attendanceLogsPage: Ref<number>
  attendanceLogsPageSize: Ref<number>
  attendanceLogsTotalPages: Ref<number> | ComputedRef<number>
  profileForm: AdminProfileForm
  profileModalOpen: Ref<boolean>
  profileSaving: Ref<boolean>
  passwordForm: AdminPasswordForm
  passwordModalOpen: Ref<boolean>
  passwordSaving: Ref<boolean>
}

export function useAdminWorkspaceProps(deps: AdminWorkspacePropsDeps) {
  return computed(() => ({
    me: deps.me.value!,
    activeTab: deps.activeTab.value,
    pageError: deps.adminError.value,
    toast: deps.adminToast.value,
    adminStats: deps.adminStats.value,
    courseCalendar: deps.courseCalendar.value,
    courseCalendarTerm: deps.courseCalendarTerm.value,
    freeTimes: deps.freeTimes.value,
    systemSettings: deps.systemSettings.value,
    systemSettingSaving: deps.systemSettingSaving.value,
    attendanceLogs: deps.paginatedAttendanceLogs.value,
    classes: deps.paginatedClasses.value,
    allClasses: deps.classes.value,
    students: deps.activeTab.value === 'class-manage' ? deps.students.value : deps.paginatedStudents.value,
    classStudents: deps.filteredClassStudents.value,
    users: deps.paginatedUsers.value,
    currentUserId: deps.currentUserId.value,
    courses: deps.paginatedCourses.value,
    courseTerms: deps.courseTerms.value,
    attendanceResults: deps.attendanceResults.value,
    userForm: deps.userForm,
    userFilters: deps.userFilters,
    userModalOpen: deps.userModalOpen.value,
    isEditingUser: deps.isEditingUser.value,
    creatingUser: deps.userSaving.value,
    userStatusUpdating: deps.userStatusUpdating.value,
    userPage: deps.userPage.value,
    userPageSize: deps.userPageSize.value,
    userTotalPages: deps.userTotalPages.value,
    userPageOptions: USER_PAGE_OPTIONS,
    selectedUserStudentIds: deps.selectedUserStudentIds.value,
    userPasswordModalOpen: deps.userPasswordModalOpen.value,
    userPasswordForm: deps.userPasswordForm,
    passwordTargetName: deps.passwordTargetName.value,
    passwordResetting: deps.passwordResetting.value,
    userFreeTimeModalOpen: deps.userFreeTimeModalOpen.value,
    freeTimeTargetName: deps.freeTimeTargetName.value,
    userFreeTimeTerm: deps.userFreeTimeTerm.value,
    userFreeTimeTermOptions: deps.userFreeTimeTermOptions.value,
    userFreeTimeLoading: deps.userFreeTimeLoading.value,
    userFreeTimeSaving: deps.userFreeTimeSaving.value,
    userFreeTimeDraft: deps.userFreeTimeDraft.value,
    courseFilters: deps.courseFilters,
    courseForm: deps.courseForm,
    courseModalOpen: deps.courseModalOpen.value,
    deleteCourseModalOpen: deps.deleteCourseModalOpen.value,
    bulkDeleteCourseModalOpen: deps.bulkDeleteCourseModalOpen.value,
    courseSaving: deps.courseSaving.value,
    courseLoading: deps.courseLoading.value,
    courseDeleting: deps.courseDeleting.value,
    isEditingCourse: deps.editingCourseId.value !== null,
    coursePage: deps.coursePage.value,
    coursePageSize: deps.coursePageSize.value,
    courseTotalPages: deps.courseTotalPages.value,
    coursePageOptions: USER_PAGE_OPTIONS,
    selectedCourseIds: deps.selectedCourseIds.value,
    selectedCourseCount: deps.selectedCourseIds.value.length,
    deletingCourseName: deps.deletingCourseName.value,
    classForm: deps.classForm,
    classFilters: deps.classFilters,
    classStudentForm: deps.classStudentForm,
    editingClassStudentForm: deps.editingClassStudentForm,
    classStudentFilters: deps.classStudentFilters,
    classStudentModalOpen: deps.classStudentModalOpen.value,
    classStudentSaving: deps.classStudentSaving.value,
    classStudentImporting: deps.classStudentImporting.value,
    editingClassStudentId: deps.editingClassStudentId.value,
    classStudentTargetName: deps.classStudentTargetName.value,
    classModalOpen: deps.classModalOpen.value,
    deleteClassModalOpen: deps.deleteClassModalOpen.value,
    bulkDeleteClassModalOpen: deps.bulkDeleteClassModalOpen.value,
    isEditingClass: deps.isEditingClass.value,
    classSaving: deps.classSaving.value,
    classDeleting: deps.classDeleting.value,
    classPage: deps.classPage.value,
    classPageSize: deps.classPageSize.value,
    classTotalPages: deps.classTotalPages.value,
    classPageOptions: USER_PAGE_OPTIONS,
    selectedClassIds: deps.selectedClassIds.value,
    selectedClassCount: deps.selectedClassIds.value.length,
    deletingClassName: deps.deletingClassName.value,
    studentForm: deps.studentForm,
    studentFilters: deps.studentFilters,
    studentModalOpen: deps.studentModalOpen.value,
    deleteStudentModalOpen: deps.deleteStudentModalOpen.value,
    bulkDeleteStudentModalOpen: deps.bulkDeleteStudentModalOpen.value,
    studentSaving: deps.studentSaving.value,
    studentDeleting: deps.studentDeleting.value,
    isEditingStudent: deps.editingStudentId.value !== null,
    studentPage: deps.studentPage.value,
    studentPageSize: deps.studentPageSize.value,
    studentTotalPages: deps.studentTotalPages.value,
    studentPageOptions: USER_PAGE_OPTIONS,
    selectedStudentIds: deps.selectedStudentIds.value,
    selectedStudentCount: deps.selectedStudentIds.value.length,
    deletingStudentName: deps.deletingStudentName.value,
    attendanceLogFilters: deps.attendanceLogFilters,
    attendanceLogsPage: deps.attendanceLogsPage.value,
    attendanceLogsPageSize: deps.attendanceLogsPageSize.value,
    attendanceLogsTotalPages: deps.attendanceLogsTotalPages.value,
    attendanceLogsPageOptions: USER_PAGE_OPTIONS,
    profileForm: deps.profileForm,
    profileModalOpen: deps.profileModalOpen.value,
    profileSaving: deps.profileSaving.value,
    passwordForm: deps.passwordForm,
    passwordModalOpen: deps.passwordModalOpen.value,
    changingPassword: deps.passwordSaving.value,
    roleName,
    statusName,
    statusClass,
    slotLabel,
  }))
}
