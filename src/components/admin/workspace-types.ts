import type { AttendanceResultItem, CourseCalendarItem, CourseItem, FreeTimeItem, SessionUser, UserItem } from '../../api'
import type {
  AdminCourseForm,
  AdminPasswordForm,
  AdminProfileForm,
  AdminUserFilters,
  AdminUserForm,
  AdminUserPasswordForm,
} from './form-types'
import type { AdminRoleName, AdminSlotLabel, AdminStatItem, AdminStatusClass, AdminStatusName } from './shared-types'

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
