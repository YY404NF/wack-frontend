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
}

export interface SessionUser {
  id?: number
  student_id: string
  real_name: string
  role: number
  status: number
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
  current_schedule: 'summer' | 'winter'
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

export interface ClassStudentItem {
  id: number
  class_id: number
  student_id: string
  real_name: string
  created_at?: string
  updated_at?: string
}

export interface ClassStudentCandidateItem extends ClassStudentItem {
  class_name: string
  grade: number
  major_name: string
}

export interface CourseItem {
  id: number
  term: string
  course_name: string
  teacher_name: string
  attendance_student_count: number
  class_names: string[]
  class_ids: number[]
}

export interface CourseSessionItem {
  id: number
  course_id: number
  session_no: number
  week_no: number
  weekday: number
  section: number
  building_name: string
  room_name: string
  created_at?: string
  updated_at?: string
}

export interface CourseStudentDetailItem {
  id: number
  course_id: number
  student_id: string
  real_name: string
  created_at?: string
  updated_at?: string
}

export interface CourseClassItem {
  id: number
  course_id: number
  class_id: number
  created_at?: string
  updated_at?: string
}

export interface CourseDetail {
  course: CourseItem
  students: CourseStudentDetailItem[]
  classes: CourseClassItem[]
  sessions: CourseSessionItem[]
}

export interface CourseCalendarItem {
  id: number
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
  class_names: string[]
  class_ids: number[]
  grades: number[]
  major_names: string[]
}

export interface AdminOperationLogItem {
  id: number
  operator_user_id: number
  operator_student_id: string
  target_table: string
  target_id: number
  action_type: string
  old_value?: string | null
  new_value?: string | null
  created_at: string
}

export interface AttendanceDetailLogItem {
  id: number
  attendance_detail_id: number
  attendance_check_id: number
  student_id: string
  real_name: string
  operator_user_id: number
  operator_student_id: string
  old_status?: number | null
  new_status: number
  operation_type: string
  operated_at: string
  created_at: string
}

export interface DashboardSummary {
  present: number
  late: number
  absent: number
  leave: number
  unset: number
}

export interface AttendanceResultItem {
  attendance_check_id: number
  attendance_detail_id: number
  course_id: number
  course_name: string
  teacher_name: string
  week_no: number
  session_no: number
  student_id: string
  status: number
}

export interface FreeTimeItem {
  id: number
  term: string
  student_id: string
  real_name: string
  weekday: number
  section: number
  free_weeks: string
}

export interface FreeTimeInput {
  term: string
  student_id?: string
  weekday: number
  section: number
  free_weeks: string
}

export interface FreeTimeQuery {
  page?: number
  page_size?: number
  term?: string
  student_id?: string
}

export interface AvailableCourseItem {
  course_session_id: number
  course_id: number
  course_name: string
  teacher_name: string
  week_no: number
  weekday: number
  section: number
  building_name: string
  room_name: string
  started_at?: string | null
  can_enter: boolean
  enter_deadline: string
  attendance_check_id?: number | null
}

export interface AttendanceStudentItem {
  id: number
  attendance_check_id: number
  student_id: string
  real_name: string
  status: number
  status_set_by_user_id?: number | null
  status_set_at?: string | null
}

export interface AttendanceCheckDetail {
  attendance_check: {
    id: number
    course_session_id: number
    started_by_user_id: number
    started_by_student_id: string
    started_at: string
  }
  course_session: {
    id: number
    course_id: number
    week_no: number
    weekday: number
    section: number
    building_name: string
    room_name: string
  }
  course: CourseItem
  students: AttendanceStudentItem[]
}
