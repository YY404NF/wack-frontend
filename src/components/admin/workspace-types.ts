import type {
  AdminOperationLogItem,
  AttendanceDetailLogItem,
  AttendanceResultItem,
  ClassItem,
  ClassStudentCandidateItem,
  ClassStudentItem,
  CourseCalendarItem,
  CourseItem,
  FreeTimeItem,
  SessionUser,
  SystemSetting,
  UserItem,
} from '../../api'
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

export type AdminWorkspaceProps = {
  me: SessionUser
  pageError: string
  toast: string
  adminStats: AdminStatItem[]
  courseCalendar: CourseCalendarItem[]
  freeTimes: FreeTimeItem[]
  systemSettings: SystemSetting | null
  systemSettingSaving: boolean
  logs: AdminOperationLogItem[]
  attendanceLogs: AttendanceDetailLogItem[]
  classes: ClassItem[]
  allClasses: ClassItem[]
  users: UserItem[]
  courseStudentCandidates: ClassStudentCandidateItem[]
  currentUserId?: number
  courses: CourseItem[]
  attendanceResults: AttendanceResultItem[]
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
  scheduleOptions: Array<{ value: 'summer' | 'winter'; label: string }>
  roleName: AdminRoleName
  statusName: AdminStatusName
  statusClass: AdminStatusClass
  slotLabel: AdminSlotLabel
}
