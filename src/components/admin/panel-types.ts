import type { AdminOperationLogItem, AttendanceDetailLogItem, AttendanceResultItem, ClassItem, CourseItem, FreeTimeItem, SessionUser, UserItem } from '../../api'
import type { StatusCode } from '../../constants'
import type {
  AdminAttendanceLogFilters,
  AdminClassFilters,
  AdminClassForm,
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
  creatingCourse: boolean
  courseForm: AdminCourseForm
}

export type AdminClassManageProps = {
  classes: ClassItem[]
  classForm: AdminClassForm
  classFilters: AdminClassFilters
  classModalOpen: boolean
  deleteClassModalOpen: boolean
  isEditingClass: boolean
  classSaving: boolean
  classDeleting: boolean
  classPage: number
  classPageSize: number
  classTotalPages: number
  classPageOptions: number[]
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
  profileForm: AdminProfileForm
  profileModalOpen: boolean
  profileSaving: boolean
  passwordForm: AdminPasswordForm
  passwordModalOpen: boolean
  changingPassword: boolean
}

export type AdminUserManageProps = {
  users: UserItem[]
  currentUserId?: number
  userForm: AdminUserForm
  userFilters: AdminUserFilters
  userModalOpen: boolean
  isEditingUser: boolean
  creatingUser: boolean
  userPage: number
  userPageSize: number
  userTotalPages: number
  userPageOptions: number[]
  userPasswordModalOpen: boolean
  userPasswordForm: AdminUserPasswordForm
  passwordTargetName: string
  passwordResetting: boolean
  roleName: AdminRoleName
}

export type AdminUpdateStatusEmit = [detailId: number, status: StatusCode]
