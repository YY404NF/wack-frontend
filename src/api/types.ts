export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface PageResult<T> {
  items: T[] | null
  page: number
  page_size: number
  total: number
  focus_found?: boolean
  focus_page?: number | null
  focus_row_key?: number | null
}

export interface SessionUser {
  id?: number
  login_id: string
  real_name: string
  role: number
  status: number
  managed_class_id?: number | null
  last_login_at?: string | null
}

export interface LoginData {
  token: string
  user: SessionUser
}

export interface SetupStatus {
  initialized: boolean
}

export interface UserItem extends SessionUser {
  id?: number
  created_at?: string
  updated_at?: string
}

export interface SystemSetting {
  id: number
  current_term_start_date: string
  current_schedule: 'summer' | 'autumn'
  created_at?: string
  updated_at?: string
}

export interface MetaSectionItem {
  section: number
  label: string
  start_time: string
  end_time: string
  check_start_time: string
  check_end_time: string
}

export interface MetaSectionsData {
  schedule: 'summer' | 'autumn'
  date: string
  list: MetaSectionItem[]
}

export interface MetaTermItem {
  id: number
  name: string
  term_start_date: string
  created_at?: string
  updated_at?: string
}

export interface UserPageQuery {
  page?: number
  page_size?: number
  role?: string
  status?: string
  keyword?: string
}

export interface ClassItem {
  id: number
  class_name: string
  grade: number
  major_name: string
  student_count: number
  created_at?: string
  updated_at?: string
}

export interface ClassOptionItem {
  id: number
  class_name: string
  grade: number
  major_name: string
}

export interface ClassStudentItem {
  id: number
  class_id: number
  student_id: string
  real_name: string
  created_at?: string
  updated_at?: string
}

export interface ManagedClassSnapshot {
  managed_class: ClassItem | null
  class_students: ClassStudentItem[]
}

export interface ClassStudentCandidateItem extends ClassStudentItem {
  class_name: string
  grade: number
  major_name: string
}

export interface ClassStudentImportResult {
  imported_count: number
}

export interface StudentItem {
  id: number
  class_id?: number | null
  student_id: string
  real_name: string
  class_name?: string | null
  grade?: number | null
  major_name?: string | null
  created_at?: string
  updated_at?: string
}

export interface StudentOptionItem {
  id: number
  student_id: string
  real_name: string
  class_id?: number | null
  class_name?: string | null
  grade?: number | null
  major_name?: string | null
}

export interface CourseItem {
  id: number
  term_id: number
  term: string
  grade: number
  course_name: string
  teacher_name: string
  status: number
  student_count: number
  class_names: string[]
  class_ids: number[]
}

export interface CourseGroupItem {
  id: number
  term_id: number
  course_id: number
  status: number
  class_names: string[]
  class_ids: number[]
  student_count: number
  lesson_count: number
  created_at?: string
  updated_at?: string
}

export interface CourseGroupStudentItem {
  id: number
  term_id: number
  course_group_id: number
  student_id: number
  class_id?: number | null
  status: number
  student_no: string
  student_name: string
  class_name?: string | null
  created_at?: string
  updated_at?: string
}

export interface CourseGroupLessonItem {
  id: number
  term_id: number
  course_group_id: number
  week_no: number
  weekday: number
  section: number
  building_name: string
  room_name: string
  status: number
  created_at?: string
  updated_at?: string
}

export interface AvailableCourseGroupClassItem {
  id: number
  class_name: string
  grade: number
  major_name: string
  student_count: number
}

export interface AvailableCourseGroupStudentItem {
  id: number
  class_id: number
  student_no: string
  student_name: string
  class_name: string
  grade: number
  major_name: string
}

export interface CourseGroupDetail {
  course_group: CourseGroupItem
  students: CourseGroupStudentItem[]
  sessions: CourseGroupLessonItem[]
}

export interface CourseCalendarItem {
  id: number
  course_group_id: number
  course_id: number
  session_no: number
  term: string
  week_no: number
  weekday: number
  section: number
  building_name: string
  room_name: string
  course_name: string
  teacher_name: string
  has_attendance_record: boolean
  class_names: string[]
  class_ids: number[]
  grades: number[]
  major_names: string[]
}

export interface AttendanceRecordLogItem {
  id: number
  attendance_record_id: number
  course_group_lesson_id: number
  student_id: string
  real_name: string
  operator_user_id: number
  operator_login_id: string
  old_status?: number | null
  new_status: number
  operation_type: string
  operated_at: string
  created_at: string
}

export interface AttendanceRecordLogListItem {
  id: number
  attendance_record_id: number
  course_group_lesson_id: number
  term: string
  lesson_date: string
  section: number
  course_name: string
  teacher_name: string
  student_id: string
  real_name: string
  class_name: string
  old_status?: number | null
  new_status: number
  operator_name: string
  operated_at: string
}

export interface DashboardSummary {
  present: number
  late: number
  absent: number
  leave: number
}

export interface OverviewCourseRankingItem {
  course_id: number
  course_name: string
  teacher_name: string
  grade: number
  arrived_count: number
  total_count: number
  attendance_rate: number
}

export interface OverviewClassRankingItem {
  class_id: number
  class_name: string
  major_name: string
  grade: number
  arrived_count: number
  total_count: number
  attendance_rate: number
}

export interface OverviewStudentRankingItem {
  student_ref_id: number
  student_id: string
  real_name: string
  class_name: string
  arrived_count: number
  total_count: number
  attendance_rate: number
}

export interface OverviewRecentSessionItem {
  course_id: number
  course_group_id: number
  course_group_lesson_id: number
  course_name: string
  teacher_name: string
  week_no: number
  weekday: number
  section: number
  building_name: string
  room_name: string
  class_summary: string
  record_count: number
  present_count: number
  late_count: number
  absent_count: number
  leave_count: number
  attendance_rate: number
}

export interface OverviewRecentAbnormalItem {
  attendance_record_id: number
  course_id: number
  course_group_id: number
  course_group_lesson_id: number
  student_ref_id: number
  student_id: string
  real_name: string
  class_name: string
  course_name: string
  teacher_name: string
  grade?: number | null
  status: number
  week_no: number
  weekday: number
  section: number
}

export interface AdminOverviewData {
  term: string
  course_rankings: OverviewCourseRankingItem[]
  class_rankings: OverviewClassRankingItem[]
  student_rankings: OverviewStudentRankingItem[]
  recent_sessions: OverviewRecentSessionItem[]
  recent_abnormal_students: OverviewRecentAbnormalItem[]
}

export interface AttendanceRecordItem {
  course_group_lesson_id: number
  attendance_record_id: number
  course_id: number
  term_id: number
  term: string
  course_name: string
  teacher_name: string
  week_no: number
  session_no: number
  student_id: string
  real_name: string
  class_name: string
  status: number
}

export type AttendanceResultItem = AttendanceRecordItem

export interface FreeTimeItem {
  id: number
  term: string
  login_id: string
  real_name: string
  weekday: number
  section: number
  free_weeks: string
}

export interface FreeTimeEditorItem {
  id: number
  term: string
  weekday: number
  section: number
  free_weeks: string
}

export interface FreeTimeInput {
  term: string
  login_id?: string
  weekday: number
  section: number
  free_weeks: string
}

export interface FreeTimeQuery {
  page?: number
  page_size?: number
  term?: string
  login_id?: string
}

export interface AvailableCourseItem {
  course_group_lesson_id: number
  course_id: number
  course_name: string
  teacher_name: string
  week_no: number
  weekday: number
  section: number
  building_name: string
  room_name: string
  can_enter: boolean
  availability_status: 'open' | 'upcoming' | 'ended'
  enter_deadline: string
}

export interface AttendanceRecordStudentItem {
  id: number
  attendance_record_id?: number | null
  course_group_lesson_id: number
  student_id: string
  real_name: string
  class_id?: number | null
  class_name: string
  status?: number | null
  status_set_by_user_id?: number | null
  status_set_at?: string | null
  operator_name?: string | null
  operated_at?: string | null
}

export interface AttendanceClassGroupItem {
  class_id?: number | null
  class_name: string
  student_count: number
}

export interface AttendanceSessionDetail {
  course_group_lesson: {
    id: number
    course_id: number
    session_no: number
    week_no: number
    weekday: number
    section: number
    building_name: string
    room_name: string
  }
  course: CourseItem
  class_groups: AttendanceClassGroupItem[]
  students: AttendanceRecordStudentItem[]
}

export interface AdminAttendanceSessionPageResult {
  course_group_lesson: {
    id: number
    term_id?: number
    course_group_id?: number
    week_no: number
    weekday: number
    section: number
    building_name: string
    room_name: string
    status?: number
  }
  course: CourseItem
  attendance_records: AttendanceRecordStudentItem[]
  page: number
  page_size: number
  total: number
  focus_found?: boolean
  focus_page?: number | null
  focus_row_key?: number | null
}

export interface SubmitAttendanceStatusesResult {
  accepted_items: number[]
  ignored_items: number[]
  applied_count: number
  ignored_count: number
}
