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

export type AdminCourseForm = {
  courseId: string
  term: string
  courseName: string
  teacherName: string
  studentIds: string
  sessionNo: number
  weekNo: number
  weekday: number
  section: number
  buildingName: string
  roomName: string
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
