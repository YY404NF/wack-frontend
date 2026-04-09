export type AdminStatItem = {
  label: string
  value: number
  tone: string
}

export type AdminStatusName = (status: number) => string
export type AdminStatusClass = (status: number) => Record<string, boolean>
export type AdminSlotLabel = (weekday: number, section: number) => string
export type AdminRoleName = (role?: number) => string
export type AdminCourseManageRouteView = 'courses' | 'groups' | 'lessons' | 'attendance-detail' | 'students'
export type AdminClassManageRouteView = 'classes' | 'students' | 'attendance-detail'
export type AdminStudentManageRouteView = 'students' | 'attendance-detail'
export type AdminAttendanceLogsView = 'list' | 'detail'

export type AdminAttendanceLogsOpenContext = {
  studentId?: string
  realName?: string
  className?: string
  lessonDate?: string
  section?: number
  timeLabel?: string
  courseName?: string
  teacherName?: string
  grade?: number | string
  location?: string
  classSummary?: string
  studentCount?: number
}

export type AdminAttendanceLogsOpenPayload = {
  term: string
  courseGroupLessonId: number
  studentId?: string
  context?: AdminAttendanceLogsOpenContext
}

export type AdminAttendanceLogDetailContext = {
  term: string
  courseGroupLessonId: number
  studentId: string
  realName: string
  className: string
  lessonDate: string
  section: number | null
  timeLabel: string
  location: string
  classSummary: string
  studentCount: number
  courseName: string
  teacherName: string
  grade: number | string
}

export type AdminAttendanceDetailTarget = {
  sessionId: number
  courseId?: number | null
  groupId?: number | null
  focusStudentRefId?: number | null
}
