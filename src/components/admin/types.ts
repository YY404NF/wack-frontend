import type { AttendanceResultItem, CourseCalendarItem, CourseItem, FreeTimeItem, SessionUser, UserItem } from '../../api'
import type { StatusCode } from '../../constants'

export type AdminStatItem = {
  label: string
  value: number
  tone: string
}

export type AdminStatusName = (status: number) => string
export type AdminStatusClass = (status: number) => Record<string, boolean>
export type AdminSlotLabel = (weekday: number, section: number) => string
export type AdminRoleName = (role?: number) => string

export type AdminUserForm = {
  studentId: string
  realName: string
  password: string
  confirmPassword: string
  role: number
  status: number
}

export type AdminUserFilters = {
  studentId: string
  realName: string
  role: string
  status: string
}

export type AdminCourseForm = {
  courseId: string
  term: string
  courseName: string
  teacherName: string
  studentIds: string
  sessionNo: number
  weekNo: number
  weekday: number
  section: number
  buildingName: string
  roomName: string
}

export type AdminProfileForm = {
  studentId: string
  realName: string
}

export type AdminUserPasswordForm = {
  password: string
  confirmPassword: string
}

export type AdminPasswordForm = {
  oldPassword: string
  newPassword: string
  confirmNewPassword: string
}

export type AdminWorkspaceProps = {
  me: SessionUser
  pageError: string
  toast: string
  adminActiveNavLabel: string
  adminStats: AdminStatItem[]
  courseCalendar: CourseCalendarItem[]
  freeTimes: FreeTimeItem[]
  users: UserItem[]
  currentUserId?: number
  courses: CourseItem[]
  attendanceResults: AttendanceResultItem[]
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
  courseForm: AdminCourseForm
  creatingCourse: boolean
  profileForm: AdminProfileForm
  profileModalOpen: boolean
  profileSaving: boolean
  passwordForm: AdminPasswordForm
  passwordModalOpen: boolean
  changingPassword: boolean
  roleName: AdminRoleName
  statusName: AdminStatusName
  statusClass: AdminStatusClass
  slotLabel: AdminSlotLabel
}

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
