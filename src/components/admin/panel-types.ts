import type {
  AdminOperationLogItem,
  AttendanceDetailLogItem,
  AttendanceResultItem,
  ClassItem,
  ClassStudentCandidateItem,
  ClassStudentItem,
  CourseItem,
  FreeTimeItem,
  SessionUser,
  SystemSetting,
  UserItem,
} from '../../api'
import type { StatusCode } from '../../constants'
import type {
  AdminAttendanceLogFilters,
  AdminClassFilters,
  AdminClassForm,
  AdminClassStudentFilters,
  AdminClassStudentForm,
  AdminCourseFilters,
  AdminCourseForm,
  AdminPasswordForm,
  AdminProfileForm,
  AdminSystemLogFilters,
  AdminUserFilters,
  AdminUserForm,
  AdminUserPasswordForm,
} from './form-types'
import type { AdminRoleName, AdminSlotLabel, AdminStatItem, AdminStatusClass, AdminStatusName } from './shared-types'

export type AdminAttendanceProps = {
  attendanceResults: AttendanceResultItem[]
  statusName: AdminStatusName
  statusClass: AdminStatusClass
}

export type AdminOverviewProps = {
  adminStats: AdminStatItem[]
}

export type AdminCourseManageProps = {
  courses: CourseItem[]
  allClasses: ClassItem[]
  courseStudentCandidates: ClassStudentCandidateItem[]
  courseFilters: AdminCourseFilters
  courseForm: AdminCourseForm
  courseModalOpen: boolean
  deleteCourseModalOpen: boolean
  bulkDeleteCourseModalOpen: boolean
  courseStudentModalOpen: boolean
  courseStudentLoading: boolean
  courseStudentSaving: boolean
  courseImporting: boolean
  courseStudentTargetName: string
  courseStudentSelectedClassIds: number[]
  courseStudentSelectedStudentIds: string[]
  courseStudentClassStudentMap: Record<number, ClassStudentItem[]>
  courseStudentLooseStudents: Array<{ student_id: string; real_name: string }>
  courseSaving: boolean
  courseLoading: boolean
  courseDeleting: boolean
  isEditingCourse: boolean
  coursePage: number
  coursePageSize: number
  courseTotalPages: number
  coursePageOptions: number[]
  selectedCourseIds: number[]
  selectedCourseCount: number
  deletingCourseName: string
}

export type AdminClassManageProps = {
  classes: ClassItem[]
  classForm: AdminClassForm
  classFilters: AdminClassFilters
  classStudentForm: AdminClassStudentForm
  editingClassStudentForm: AdminClassStudentForm
  classStudentFilters: AdminClassStudentFilters
  classStudents: ClassStudentItem[]
  classStudentModalOpen: boolean
  classStudentSaving: boolean
  classStudentImporting: boolean
  editingClassStudentId: number | null
  classStudentTargetName: string
  classModalOpen: boolean
  deleteClassModalOpen: boolean
  bulkDeleteClassModalOpen: boolean
  isEditingClass: boolean
  classSaving: boolean
  classDeleting: boolean
  classPage: number
  classPageSize: number
  classTotalPages: number
  classPageOptions: number[]
  selectedClassIds: number[]
  selectedClassCount: number
  deletingClassName: string
}

export type AdminFreeTimeCalendarProps = {
  freeTimes: FreeTimeItem[]
  slotLabel: AdminSlotLabel
}

export type AdminLogsProps = {
  logs: AdminOperationLogItem[]
  logFilters: AdminSystemLogFilters
  logsPage: number
  logsPageSize: number
  logsTotalPages: number
  logsPageOptions: number[]
}

export type AdminAttendanceLogsProps = {
  attendanceLogs: AttendanceDetailLogItem[]
  attendanceLogFilters: AdminAttendanceLogFilters
  attendanceLogsPage: number
  attendanceLogsPageSize: number
  attendanceLogsTotalPages: number
  attendanceLogsPageOptions: number[]
  statusName: AdminStatusName
}

export type AdminSettingsProps = {
  me: SessionUser
  systemSettings: SystemSetting | null
  systemSettingSaving: boolean
  profileForm: AdminProfileForm
  profileModalOpen: boolean
  profileSaving: boolean
  passwordForm: AdminPasswordForm
  passwordModalOpen: boolean
  changingPassword: boolean
  scheduleOptions: Array<{ value: 'summer' | 'winter'; label: string }>
}

export type AdminUserManageProps = {
  users: UserItem[]
  currentUserId?: number
  userForm: AdminUserForm
  userFilters: AdminUserFilters
  userModalOpen: boolean
  isEditingUser: boolean
  creatingUser: boolean
  userStatusUpdating: boolean
  userPage: number
  userPageSize: number
  userTotalPages: number
  userPageOptions: number[]
  selectedUserStudentIds: string[]
  userPasswordModalOpen: boolean
  userPasswordForm: AdminUserPasswordForm
  passwordTargetName: string
  passwordResetting: boolean
  userFreeTimeModalOpen: boolean
  freeTimeTargetName: string
  userFreeTimeTerm: string
  userFreeTimeTermOptions: string[]
  userFreeTimeLoading: boolean
  userFreeTimeSaving: boolean
  userFreeTimeDraft: Record<string, number[]>
  roleName: AdminRoleName
}

export type AdminUpdateStatusEmit = [detailId: number, status: StatusCode]
