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
import type {
  AdminClassManageRouteView,
  AdminCourseManageRouteView,
  AdminRoleName,
  AdminSlotLabel,
  AdminStatItem,
  AdminStatusClass,
  AdminStatusName,
} from './shared-types'

export type AdminWorkspaceProps = {
  me: SessionUser
  pageError: string
  toast: string
  adminStats: AdminStatItem[]
  courseCalendar: CourseCalendarItem[]
  courseCalendarTerm: string
  freeTimes: FreeTimeItem[]
  systemSettings: SystemSetting | null
  systemSettingSaving: boolean
  overviewData: AdminOverviewData | null
  attendanceLogs: AttendanceRecordLogListItem[]
  attendanceLogRows: AttendanceRecordLogListItem[]
  classes: ClassItem[]
  allClasses: ClassItem[]
  students: StudentItem[]
  users: UserItem[]
  currentUserId?: number
  courses: CourseItem[]
  courseTerms: MetaTermItem[]
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
  courseManageRouteView?: AdminCourseManageRouteView
  courseManageRouteCourseId?: number | null
  courseManageRouteGroupId?: number | null
  courseManageRouteLessonId?: number | null
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
  classManageRouteView?: AdminClassManageRouteView
  classManageRouteClassId?: number | null
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
  attendanceLogFilters: AdminAttendanceLogFilters
  attendanceLogsPage: number
  attendanceLogsPageSize: number
  attendanceLogsTotalPages: number
  attendanceLogsTotalItems: number
  attendanceLogsAllItems: number
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
