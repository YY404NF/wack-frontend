export function createLoginForm() {
  return {
    studentId: '',
    password: '',
  }
}

export function createSetupForm() {
  return {
    studentId: '',
    realName: '',
    password: '',
    confirmPassword: '',
  }
}

export function createPasswordForm() {
  return {
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  }
}

export function createProfileForm() {
  return {
    studentId: '',
    realName: '',
  }
}

export function createUserPasswordForm() {
  return {
    password: '',
    confirmPassword: '',
  }
}

export function createFreeTimeForm() {
  return {
    term: '2025-2026-2',
    weekday: 1,
    section: 1,
    freeWeeks: '',
  }
}

export function createUserForm() {
  return {
    studentId: '',
    realName: '',
    password: '',
    confirmPassword: '',
    role: 2,
    status: 1,
  }
}

export function createUserFilters() {
  return {
    studentId: '',
    realName: '',
    role: '',
    status: '',
  }
}

export function createCourseForm() {
  return {
    courseId: '',
    term: '2025-2026-2',
    courseName: '',
    teacherName: '',
    studentIds: '',
    sessionNo: 1,
    weekNo: 1,
    weekday: 1,
    section: 1,
    buildingName: '教4',
    roomName: '509',
  }
}

export function createClassForm() {
  return {
    className: '',
    grade: new Date().getFullYear(),
    majorName: '',
  }
}

export function createClassFilters() {
  return {
    grade: '',
    majorName: '',
    className: '',
  }
}
