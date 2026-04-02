import type {
  AdminOverviewData,
  AttendanceRecordLogListItem,
  AttendanceResultItem,
  ClassItem,
  ClassStudentItem,
  CourseCalendarItem,
  CourseItem,
  FreeTimeItem,
  MetaTermItem,
  SessionUser,
  StudentItem,
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
  AdminStudentFilters,
  AdminStudentForm,
  AdminUserFilters,
  AdminUserForm,
  AdminUserPasswordForm,
} from './form-types'
import type { AdminClassManageRouteView, AdminRoleName, AdminSlotLabel, AdminStatusClass, AdminStatusName } from './shared-types'

export type AdminAttendanceProps = {
  attendanceResults: AttendanceResultItem[]
  courseTerms: MetaTermItem[]
  statusName: AdminStatusName
  statusClass: AdminStatusClass
}

export type AdminOverviewProps = {
  overviewData: AdminOverviewData | null
}

export type AdminCourseManageProps = {
  courses: CourseItem[]
  courseTerms: MetaTermItem[]
  allClasses: ClassItem[]
  courseFilters: AdminCourseFilters
  courseForm: AdminCourseForm
  courseModalOpen: boolean
  deleteCourseModalOpen: boolean
  bulkDeleteCourseModalOpen: boolean
  courseSaving: boolean
  courseLoading: boolean
  courseDeleting: boolean
  isEditingCourse: boolean
  coursePage: number
  coursePageSize: number
  courseTotalPages: number
  courseTotalItems: number
  courseAllItems: number
  coursePageOptions: number[]
  selectedCourseIds: number[]
  selectedCourseCount: number
  deletingCourseName: string
  courseFocusRowKey?: number | null
  courseFocusToken?: number
}

export type AdminCourseCalendarProps = {
  courseCalendar: CourseCalendarItem[]
  freeTimes: FreeTimeItem[]
  courseTerms: MetaTermItem[]
  systemSettings: SystemSetting | null
}

export type AdminClassManageProps = {
  classes: ClassItem[]
  allClasses: ClassItem[]
  students: StudentItem[]
  classManageRouteView?: AdminClassManageRouteView
  classForm: AdminClassForm
  classFilters: AdminClassFilters
  classStudentForm: AdminClassStudentForm
  editingClassStudentForm: AdminClassStudentForm
  classStudentFilters: AdminClassStudentFilters
  classStudents: ClassStudentItem[]
  classStudentTargetClass: ClassItem | null
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
  classTotalItems: number
  classAllItems: number
  classPageOptions: number[]
  selectedClassIds: number[]
  selectedClassCount: number
  deletingClassName: string
  classFocusRowKey?: number | null
  classFocusToken?: number
}

export type AdminStudentManageProps = {
  students: StudentItem[]
  allClasses: ClassItem[]
  studentForm: AdminStudentForm
  studentFilters: AdminStudentFilters
  studentModalOpen: boolean
  deleteStudentModalOpen: boolean
  bulkDeleteStudentModalOpen: boolean
  studentSaving: boolean
  studentDeleting: boolean
  isEditingStudent: boolean
  studentPage: number
  studentPageSize: number
  studentTotalPages: number
  studentTotalItems: number
  studentAllItems: number
  studentPageOptions: number[]
  selectedStudentIds: number[]
  selectedStudentCount: number
  deletingStudentName: string
  studentFocusRowKey?: number | null
  studentFocusToken?: number
}

export type AdminFreeTimeCalendarProps = {
  freeTimes: FreeTimeItem[]
  slotLabel: AdminSlotLabel
}

export type AdminAttendanceLogsProps = {
  attendanceLogs: AttendanceRecordLogListItem[]
  attendanceLogRows: AttendanceRecordLogListItem[]
  courseTerms: MetaTermItem[]
  attendanceLogFilters: AdminAttendanceLogFilters
  attendanceLogsPage: number
  attendanceLogsPageSize: number
  attendanceLogsTotalPages: number
  attendanceLogsTotalItems: number
  attendanceLogsAllItems: number
  attendanceLogsPageOptions: number[]
  statusName: AdminStatusName
}

export type AdminSettingsProps = {
  me: SessionUser
  courseTerms: MetaTermItem[]
  systemSettings: SystemSetting | null
  systemSettingSaving: boolean
  profileForm: AdminProfileForm
  profileModalOpen: boolean
  profileSaving: boolean
  passwordForm: AdminPasswordForm
  passwordModalOpen: boolean
  changingPassword: boolean
}

export type AdminUserManageProps = {
  users: UserItem[]
  allClasses: ClassItem[]
  courseTerms: MetaTermItem[]
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
  userTotalItems: number
  userAllItems: number
  userPageOptions: number[]
  selectedUserStudentIds: string[]
  userFocusRowKey?: string | null
  userFocusToken?: number
  userPasswordModalOpen: boolean
  userPasswordForm: AdminUserPasswordForm
  passwordTargetStudentId: string
  passwordTargetRealName: string
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

export type AdminUpdateStatusEmit = [sessionId: number, studentRefId: number, status: StatusCode]
