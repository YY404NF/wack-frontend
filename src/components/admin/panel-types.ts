import type { AttendanceResultItem, CourseCalendarItem, CourseItem, FreeTimeItem, SessionUser, UserItem } from '../../api'
import type { StatusCode } from '../../constants'
import type {
  AdminCourseForm,
  AdminPasswordForm,
  AdminProfileForm,
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

export type AdminFreeTimeCalendarProps = {
  freeTimes: FreeTimeItem[]
  slotLabel: AdminSlotLabel
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
