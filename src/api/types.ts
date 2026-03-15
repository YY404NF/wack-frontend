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

export interface UserPageQuery {
  page?: number
  page_size?: number
  role?: string
  status?: string
  keyword?: string
}

export interface CourseItem {
  id: number
  term: string
  course_name: string
  teacher_name: string
  attendance_student_count: number
}

export interface CourseCalendarItem {
  id: number
  course_id: number
  session_no: number
  week_no: number
  weekday: number
  section: number
  building_name: string
  room_name: string
  course_name: string
  teacher_name: string
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
  user_id?: number
  student_id: string
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
