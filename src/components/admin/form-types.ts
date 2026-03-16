export type AdminUserForm = {
  studentId: string
  realName: string
  password: string
  confirmPassword: string
  role: number
  status: number
}

export type AdminUserFilters = {
  studentId: string
  realName: string
  role: string
  status: string
}

export type AdminCourseFilters = {
  term: string
  courseName: string
  teacherName: string
  classId: string
}

export type AdminCourseSessionForm = {
  sessionNo: number
  weekNo: number
  weekday: number
  section: number
  buildingName: string
  roomName: string
}

export type AdminCourseForm = {
  term: string
  courseName: string
  teacherName: string
  weekday: number | null
  section: number | null
  buildingName: string
  roomName: string
  selectedWeeks: number[]
  sessions: AdminCourseSessionForm[]
}

export type AdminClassForm = {
  className: string
  grade: number
  majorName: string
}

export type AdminClassFilters = {
  grade: string
  majorName: string
  className: string
}

export type AdminClassStudentFilters = {
  studentId: string
  realName: string
}

export type AdminClassStudentForm = {
  studentId: string
  realName: string
}

export type AdminSystemLogFilters = {
  operatorStudentId: string
  targetTable: string
  actionType: string
  targetId: string
  keyword: string
  createdDate: string
}

export type AdminAttendanceLogFilters = {
  studentId: string
  operatorStudentId: string
  operationType: string
  newStatus: string
  operatedDate: string
}

export type AdminProfileForm = {
  studentId: string
  realName: string
}

export type AdminUserPasswordForm = {
  password: string
  confirmPassword: string
}

export type AdminPasswordForm = {
  oldPassword: string
  newPassword: string
  confirmNewPassword: string
}
