import type { Ref } from 'vue'

import {
  api,
  type AttendanceRecordLogItem,
  type AttendanceResultItem,
  type ClassItem,
  type CourseCalendarItem,
  type CourseItem,
  type DashboardSummary,
  type FreeTimeItem,
  type MetaTermItem,
  type SessionUser,
  type StudentItem,
  type SystemSetting,
  type UserItem,
} from '../../api'
import type { StatusCode } from '../../constants'
import { createClassForm, createCourseForm, createStudentForm } from './forms'

type UserForm = {
  studentId: string
  realName: string
  password: string
  confirmPassword: string
  role: number
  status: number
  managedClassId: number | ''
}

type ProfileForm = {
  studentId: string
  realName: string
}

type UserPasswordForm = {
  password: string
  confirmPassword: string
}

type CourseForm = {
  termId: number | ''
  grade: number
  courseName: string
  teacherName: string
}

type ClassForm = {
  className: string
  grade: number
  majorName: string
}

type StudentForm = {
  classId: number | ''
  studentId: string
  realName: string
}

export type AdminFlowDeps = {
  me: Ref<SessionUser | null>
  users: Ref<UserItem[]>
  classes: Ref<ClassItem[]>
  students: Ref<StudentItem[]>
  courses: Ref<CourseItem[]>
  courseTerms: Ref<MetaTermItem[]>
  courseCalendar: Ref<CourseCalendarItem[]>
  dashboard: Ref<DashboardSummary | null>
  attendanceResults: Ref<AttendanceResultItem[]>
  freeTimes: Ref<FreeTimeItem[]>
  systemSettings: Ref<SystemSetting | null>
  attendanceLogs: Ref<AttendanceRecordLogItem[]>
  userForm: UserForm
  profileForm: ProfileForm
  userPasswordForm: UserPasswordForm
  courseForm: CourseForm
  classForm: ClassForm
  studentForm: StudentForm
  editingUserStudentId: Ref<string>
  editingCourseId: Ref<number | null>
  editingClassId: Ref<number | null>
  editingStudentId: Ref<number | null>
  passwordTargetStudentId: Ref<string>
  deletingCourseId: Ref<number | null>
  deletingClassId: Ref<number | null>
  deletingStudentId: Ref<number | null>
  userSaving: Ref<boolean>
  passwordResetting: Ref<boolean>
  profileSaving: Ref<boolean>
  courseSaving: Ref<boolean>
  courseDeleting: Ref<boolean>
  classSaving: Ref<boolean>
  classDeleting: Ref<boolean>
  studentSaving: Ref<boolean>
  studentDeleting: Ref<boolean>
  adminError: Ref<string>
  showAdminToast: (message: string) => void
  closeUserModal: () => void
  closeUserPasswordModal: () => void
  closeProfileModal: () => void
  closeCourseModal: () => void
  closeDeleteCourseModal: () => void
  closeClassModal: () => void
  closeDeleteClassModal: () => void
  closeStudentModal: () => void
  closeDeleteStudentModal: () => void
}

export function useAdminFlow(deps: AdminFlowDeps) {
  async function loadAdminData() {
    const [users, classes, students, courses, terms, calendar, summary, resultPage, freeTimeList, attendanceLogPageResult, settings] = await Promise.all([
      api.listAllUsers(),
      api.listAllClasses(),
      api.listAllStudents(),
      api.listAllCourses(),
      api.listMetaTerms(),
      api.adminCourseCalendar(),
      api.adminAttendanceDashboard(),
      api.adminAttendanceResults(),
      api.adminFreeTimeCalendar(),
      api.listAttendanceRecordLogs(),
      api.getSystemSettings(),
    ])
    deps.users.value = users
    deps.classes.value = classes
    deps.students.value = students
    deps.courses.value = courses
    deps.courseTerms.value = terms
    deps.courseCalendar.value = calendar ?? []
    deps.dashboard.value = summary
    deps.attendanceResults.value = resultPage.items ?? []
    deps.freeTimes.value = freeTimeList ?? []
    deps.systemSettings.value = settings
    deps.attendanceLogs.value = attendanceLogPageResult.items ?? []
  }

  async function saveClass() {
    deps.classSaving.value = true
    deps.adminError.value = ''
    try {
      const payload = {
        class_name: deps.classForm.className.trim(),
        grade: deps.classForm.grade,
        major_name: deps.classForm.majorName.trim(),
      }

      if (deps.editingClassId.value !== null) {
        await api.updateClass(deps.editingClassId.value, payload)
        Object.assign(deps.classForm, createClassForm())
        await loadAdminData()
        deps.closeClassModal()
        deps.showAdminToast('班级信息已更新')
        return
      }

      await api.createClass(payload)
      Object.assign(deps.classForm, createClassForm())
      await loadAdminData()
      deps.closeClassModal()
      deps.showAdminToast('班级已创建')
    } catch (error) {
      deps.adminError.value = error instanceof Error ? error.message : '保存班级失败'
    } finally {
      deps.classSaving.value = false
    }
  }

  async function saveStudent() {
    deps.studentSaving.value = true
    deps.adminError.value = ''
    try {
      const payload = {
        class_id: deps.studentForm.classId === '' ? null : Number(deps.studentForm.classId),
        student_id: deps.studentForm.studentId.trim(),
        real_name: deps.studentForm.realName.trim(),
      }

      if (deps.editingStudentId.value !== null) {
        await api.updateStudent(deps.editingStudentId.value, payload)
        Object.assign(deps.studentForm, createStudentForm())
        await loadAdminData()
        deps.closeStudentModal()
        deps.showAdminToast('学生信息已更新')
        return
      }

      await api.createStudent(payload)
      Object.assign(deps.studentForm, createStudentForm())
      await loadAdminData()
      deps.closeStudentModal()
      deps.showAdminToast('学生已创建')
    } catch (error) {
      deps.adminError.value = error instanceof Error ? error.message : '保存学生失败'
    } finally {
      deps.studentSaving.value = false
    }
  }

  async function deleteClass() {
    if (deps.deletingClassId.value === null) {
      return
    }

    deps.classDeleting.value = true
    deps.adminError.value = ''
    try {
      await api.deleteClass(deps.deletingClassId.value)
      await loadAdminData()
      deps.closeDeleteClassModal()
      deps.showAdminToast('班级已删除')
    } catch (error) {
      deps.adminError.value = error instanceof Error ? error.message : '删除班级失败'
    } finally {
      deps.classDeleting.value = false
    }
  }

  async function deleteStudent() {
    if (deps.deletingStudentId.value === null) {
      return
    }

    deps.studentDeleting.value = true
    deps.adminError.value = ''
    try {
      await api.deleteStudent(deps.deletingStudentId.value)
      await loadAdminData()
      deps.closeDeleteStudentModal()
      deps.showAdminToast('学生已删除')
    } catch (error) {
      deps.adminError.value = error instanceof Error ? error.message : '删除学生失败'
    } finally {
      deps.studentDeleting.value = false
    }
  }

  async function createUser() {
    deps.userSaving.value = true
    deps.adminError.value = ''
    try {
      if (!deps.editingUserStudentId.value && deps.userForm.password !== deps.userForm.confirmPassword) {
        throw new Error('两次输入的密码不一致')
      }

      if (deps.editingUserStudentId.value) {
        await api.updateUser(deps.editingUserStudentId.value, {
          login_id: deps.userForm.studentId.trim(),
          real_name: deps.userForm.realName.trim(),
          role: deps.userForm.role,
          status: deps.userForm.status,
          managed_class_id: deps.userForm.role === 3 && deps.userForm.managedClassId !== '' ? deps.userForm.managedClassId : null,
        })
        await loadAdminData()
        deps.closeUserModal()
        deps.showAdminToast('用户信息已更新')
        return
      }

      await api.createUser({
        login_id: deps.userForm.studentId.trim(),
        real_name: deps.userForm.realName.trim(),
        password: deps.userForm.password,
        role: deps.userForm.role,
        status: deps.userForm.status,
        managed_class_id: deps.userForm.role === 3 && deps.userForm.managedClassId !== '' ? deps.userForm.managedClassId : null,
      })
      await loadAdminData()
      deps.closeUserModal()
      deps.showAdminToast('用户已创建')
    } catch (error) {
      deps.adminError.value = error instanceof Error ? error.message : '创建用户失败'
    } finally {
      deps.userSaving.value = false
    }
  }

  async function resetUserPassword() {
    if (!deps.passwordTargetStudentId.value) {
      return
    }
    deps.passwordResetting.value = true
    deps.adminError.value = ''
    try {
      if (deps.userPasswordForm.password !== deps.userPasswordForm.confirmPassword) {
        throw new Error('两次输入的新密码不一致')
      }
      await api.resetUserPassword(deps.passwordTargetStudentId.value, deps.userPasswordForm.password)
      deps.closeUserPasswordModal()
      deps.showAdminToast('用户密码已更新')
    } catch (error) {
      deps.adminError.value = error instanceof Error ? error.message : '重置密码失败'
    } finally {
      deps.passwordResetting.value = false
    }
  }

  async function updateProfile() {
    deps.profileSaving.value = true
    deps.adminError.value = ''
    try {
      const user = await api.updateProfile({
        login_id: deps.profileForm.studentId.trim(),
        real_name: deps.profileForm.realName.trim(),
      })
      deps.me.value = user
      deps.closeProfileModal()
      deps.showAdminToast('当前帐号信息已更新')
      await loadAdminData()
    } catch (error) {
      deps.adminError.value = error instanceof Error ? error.message : '更新当前帐号信息失败'
    } finally {
      deps.profileSaving.value = false
    }
  }

  async function setUserStatus(studentId: string, status: number) {
    deps.adminError.value = ''
    try {
      await api.updateUserStatus(studentId, status)
      await loadAdminData()
      deps.showAdminToast(status === 1 ? '用户已解冻' : '用户已冻结')
    } catch (error) {
      deps.adminError.value = error instanceof Error ? error.message : '更新用户状态失败'
    }
  }

  async function saveCourse() {
    deps.courseSaving.value = true
    deps.adminError.value = ''
    try {
      const isEditing = deps.editingCourseId.value !== null
      const payload = {
        term_id: Number(deps.courseForm.termId),
        grade: deps.courseForm.grade,
        course_name: deps.courseForm.courseName.trim(),
        teacher_name: deps.courseForm.teacherName.trim(),
      }

      if (deps.editingCourseId.value !== null) {
        await api.updateCourse(deps.editingCourseId.value, payload)
      } else {
        await api.createCourse(payload)
      }
      Object.assign(deps.courseForm, createCourseForm())
      await loadAdminData()
      deps.closeCourseModal()
      deps.showAdminToast(isEditing ? '课程信息已更新' : '课程已创建')
    } catch (error) {
      deps.adminError.value = error instanceof Error ? error.message : '保存课程失败'
    } finally {
      deps.courseSaving.value = false
    }
  }

  async function deleteCourse() {
    if (deps.deletingCourseId.value === null) {
      return
    }

    deps.courseDeleting.value = true
    deps.adminError.value = ''
    try {
      await api.deleteCourse(deps.deletingCourseId.value)
      await loadAdminData()
      deps.closeDeleteCourseModal()
      deps.showAdminToast('课程已删除')
    } catch (error) {
      deps.adminError.value = error instanceof Error ? error.message : '删除课程失败'
    } finally {
      deps.courseDeleting.value = false
    }
  }

  async function updateAdminStatus(detailId: number, status: StatusCode) {
    deps.adminError.value = ''
    try {
      await api.adminUpdateAttendanceStatus(detailId, status)
      await loadAdminData()
      deps.showAdminToast('管理员修改已提交')
    } catch (error) {
      deps.adminError.value = error instanceof Error ? error.message : '修改查课结果失败'
    }
  }

  return {
    loadAdminData,
    createUser,
    resetUserPassword,
    updateProfile,
    setUserStatus,
    saveCourse,
    deleteCourse,
    saveClass,
    deleteClass,
    saveStudent,
    deleteStudent,
    updateAdminStatus,
  }
}
