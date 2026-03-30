export type AdminUserForm = {
  studentId: string
  realName: string
  password: string
  confirmPassword: string
  role: number
  status: number
  managedClassId: number | ''
}

export type AdminUserFilters = {
  studentId: string
  realName: string
  managedClassName: string
  role: string
  status: string
}

export type AdminCourseFilters = {
  term: string
  courseName: string
  teacherName: string
  classId: string
}

export type AdminCourseForm = {
  termId: number | ''
  grade: number
  courseName: string
  teacherName: string
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

export type AdminStudentFilters = {
  className: string
  studentId: string
  realName: string
}

export type AdminStudentForm = {
  classId: number | ''
  studentId: string
  realName: string
}

export type AdminAttendanceLogFilters = {
  term: string
  courseGroupLessonId: string
  lessonDate: string
  section: string
  courseName: string
  teacherName: string
  studentId: string
  realName: string
  className: string
  oldStatus: string
  newStatus: string
  operatorName: string
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
