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
  AdminSystemLogFilters,
  AdminUserFilters,
  AdminUserForm,
  AdminUserPasswordForm,
} from '../../components/admin/form-types'
import { getCurrentAcademicTerm } from '../../utils/free-time'

export function createLoginForm(): { studentId: string; password: string } {
  return {
    studentId: '',
    password: '',
  }
}

export function createSetupForm(): { studentId: string; realName: string; password: string; confirmPassword: string } {
  return {
    studentId: '',
    realName: '',
    password: '',
    confirmPassword: '',
  }
}

export function createPasswordForm(): AdminPasswordForm {
  return {
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  }
}

export function createProfileForm(): AdminProfileForm {
  return {
    studentId: '',
    realName: '',
  }
}

export function createUserPasswordForm(): AdminUserPasswordForm {
  return {
    password: '',
    confirmPassword: '',
  }
}

export function createFreeTimeForm(): { term: string; weekday: number; section: number; freeWeeks: string } {
  return {
    term: getCurrentAcademicTerm(),
    weekday: 1,
    section: 1,
    freeWeeks: '',
  }
}

export function createUserForm(): AdminUserForm {
  return {
    studentId: '',
    realName: '',
    password: '',
    confirmPassword: '',
    role: 2,
    status: 1,
  }
}

export function createUserFilters(): AdminUserFilters {
  return {
    studentId: '',
    realName: '',
    role: '',
    status: '',
  }
}

export function createCourseFilters(): AdminCourseFilters {
  return {
    term: getCurrentAcademicTerm(),
    courseName: '',
    teacherName: '',
    classId: '',
  }
}

export function createCourseForm(): AdminCourseForm {
  return {
    term: getCurrentAcademicTerm(),
    courseName: '',
    teacherName: '',
    weekday: null,
    section: null,
    buildingName: '',
    roomName: '',
    selectedWeeks: [],
    sessions: [],
  }
}

export function createClassForm(): AdminClassForm {
  return {
    className: '',
    grade: new Date().getFullYear(),
    majorName: '',
  }
}

export function createClassFilters(): AdminClassFilters {
  return {
    grade: '',
    majorName: '',
    className: '',
  }
}

export function createClassStudentFilters(): AdminClassStudentFilters {
  return {
    studentId: '',
    realName: '',
  }
}

export function createClassStudentForm(): AdminClassStudentForm {
  return {
    studentId: '',
    realName: '',
  }
}

export function createSystemLogFilters(): AdminSystemLogFilters {
  return {
    operatorStudentId: '',
    targetTable: '',
    actionType: '',
    targetId: '',
    keyword: '',
    createdDate: '',
  }
}

export function createAttendanceLogFilters(): AdminAttendanceLogFilters {
  return {
    studentId: '',
    operatorStudentId: '',
    operationType: '',
    newStatus: '',
    operatedDate: '',
  }
}
