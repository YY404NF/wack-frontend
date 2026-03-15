const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'
const TOKEN_KEY = 'wack-token'

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
  student_id: string
  real_name: string
  role: number
  status: number
}

export interface LoginData {
  token: string
  user: SessionUser
}

export interface SetupStatus {
  initialized: boolean
}

export interface UserItem extends SessionUser {
  created_at?: string
  updated_at?: string
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
  student_id: string
  status: number
  status_set_by?: string | null
  status_set_at?: string | null
}

export interface AttendanceCheckDetail {
  attendance_check: {
    id: number
    course_session_id: number
    started_by: string
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

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) ?? ''
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers ?? {})
  const token = getToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (!(init?.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  })

  const payload = (await response.json()) as ApiResponse<T>
  if (!response.ok || payload.code !== 0) {
    throw new Error(payload.message || `request failed: ${response.status}`)
  }
  return payload.data
}

export const api = {
  setupStatus() {
    return request<SetupStatus>('/setup/status')
  },
  initializeSystem(input: { student_id: string; real_name: string; password: string }) {
    return request<{ initialized: boolean }>('/setup/initialize', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  login(studentId: string, password: string) {
    return request<LoginData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, password }),
    })
  },
  me() {
    return request<SessionUser>('/auth/me')
  },
  changePassword(oldPassword: string, newPassword: string) {
    return request<Record<string, never>>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    })
  },
  listUsers() {
    return request<PageResult<UserItem>>('/users?page=1&page_size=50')
  },
  createUser(input: { student_id: string; real_name: string; password: string; role: number; status: number }) {
    return request<UserItem>('/users', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  listCourses() {
    return request<PageResult<CourseItem>>('/courses?page=1&page_size=50')
  },
  createCourse(input: { id: number; term: string; course_name: string; teacher_name: string; attendance_student_count: number }) {
    return request<CourseItem>('/courses', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  replaceCourseStudents(courseId: number, studentIds: string[]) {
    return request<Record<string, never>>(`/courses/${courseId}/students`, {
      method: 'PUT',
      body: JSON.stringify({ student_ids: studentIds }),
    })
  },
  replaceCourseSessions(
    courseId: number,
    sessions: Array<{
      session_no: number
      week_no: number
      weekday: number
      section: number
      building_name: string
      room_name: string
    }>,
  ) {
    return request<Record<string, never>>(`/courses/${courseId}/sessions`, {
      method: 'PUT',
      body: JSON.stringify({ sessions }),
    })
  },
  adminCourseCalendar() {
    return request<CourseCalendarItem[] | null>('/admin/course-calendar')
  },
  adminAttendanceDashboard() {
    return request<DashboardSummary>('/admin/attendance-dashboard')
  },
  adminAttendanceResults() {
    return request<PageResult<AttendanceResultItem>>('/admin/attendance-results?page=1&page_size=50')
  },
  adminFreeTimeCalendar() {
    return request<FreeTimeItem[] | null>('/admin/free-time-calendar')
  },
  listFreeTimes() {
    return request<PageResult<FreeTimeItem>>('/free-times?page=1&page_size=50')
  },
  createFreeTime(input: FreeTimeInput) {
    return request<FreeTimeItem>('/free-times', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  updateFreeTime(id: number, input: FreeTimeInput) {
    return request<Record<string, never>>(`/free-times/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  },
  deleteFreeTime(id: number) {
    return request<Record<string, never>>(`/free-times/${id}`, {
      method: 'DELETE',
    })
  },
  adminUpdateAttendanceStatus(detailId: number, status: number) {
    return request<Record<string, never>>(`/admin/attendance-details/${detailId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
  studentAvailableCourses() {
    return request<AvailableCourseItem[] | null>('/student/courses/available')
  },
  enterAttendanceCheck(courseSessionId: number) {
    return request<AttendanceCheckDetail>('/student/attendance-checks', {
      method: 'POST',
      body: JSON.stringify({ course_session_id: courseSessionId }),
    })
  },
  updateAttendanceStatus(detailId: number, status: number) {
    return request<Record<string, never>>(`/student/attendance-details/${detailId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
  completeAttendanceCheck(checkId: number) {
    return request<Record<string, never>>(`/student/attendance-checks/${checkId}/complete`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
  },
}
