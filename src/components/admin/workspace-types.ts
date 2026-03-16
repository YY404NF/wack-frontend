import type { AdminOperationLogItem, AttendanceDetailLogItem, AttendanceResultItem, ClassItem, CourseCalendarItem, CourseItem, FreeTimeItem, SessionUser, UserItem } from '../../api'
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

export type AdminWorkspaceProps = {
  me: SessionUser
  pageError: string
  toast: string
  adminStats: AdminStatItem[]
  courseCalendar: CourseCalendarItem[]
  freeTimes: FreeTimeItem[]
  logs: AdminOperationLogItem[]
  attendanceLogs: AttendanceDetailLogItem[]
  classes: ClassItem[]
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
  logFilters: AdminSystemLogFilters
  logsPage: number
  logsPageSize: number
  logsTotalPages: number
  logsPageOptions: number[]
  attendanceLogFilters: AdminAttendanceLogFilters
  attendanceLogsPage: number
  attendanceLogsPageSize: number
  attendanceLogsTotalPages: number
  attendanceLogsPageOptions: number[]
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
