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
import type { AppTab, StatusCode } from '../../constants'
import { createClassForm, createCourseForm, createStudentForm } from './forms'
import { selectDefaultTermName } from '../../utils/terms'

type UserForm = {
  studentId: string
  realName: string
  password: string
  confirmPassword: string
  role: number
  status: number
  managedClassId: number | ''
}

type UserFilters = {
  studentId: string
  realName: string
  managedClassName: string
  role: string
  status: string
}

type CourseFilters = {
  term: string
  courseName: string
  teacherName: string
  classId: string
}

type ClassFilters = {
  grade: string
  majorName: string
  className: string
}

type StudentFilters = {
  studentId: string
  realName: string
  className: string
}

type AttendanceLogFilters = {
  operatedDate: string
  studentId: string
  operatorStudentId: string
  operationType: string
  newStatus: string
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
  activeTab: Ref<AppTab>
  me: Ref<SessionUser | null>
  users: Ref<UserItem[]>
  classes: Ref<ClassItem[]>
  students: Ref<StudentItem[]>
  userRows: Ref<UserItem[]>
  classRows: Ref<ClassItem[]>
  studentRows: Ref<StudentItem[]>
  courses: Ref<CourseItem[]>
  courseRows: Ref<CourseItem[]>
  courseTerms: Ref<MetaTermItem[]>
  courseCalendar: Ref<CourseCalendarItem[]>
  courseCalendarTerm: Ref<string>
  dashboard: Ref<DashboardSummary | null>
  attendanceResults: Ref<AttendanceResultItem[]>
  freeTimes: Ref<FreeTimeItem[]>
  systemSettings: Ref<SystemSetting | null>
  attendanceLogs: Ref<AttendanceRecordLogItem[]>
  attendanceLogRows: Ref<AttendanceRecordLogItem[]>
  userForm: UserForm
  userFilters: UserFilters
  courseFilters: CourseFilters
  classFilters: ClassFilters
  studentFilters: StudentFilters
  attendanceLogFilters: AttendanceLogFilters
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
  userPage: Ref<number>
  userPageSize: Ref<number>
  userTotalPages: Ref<number>
  coursePage: Ref<number>
  coursePageSize: Ref<number>
  courseTotalPages: Ref<number>
  classPage: Ref<number>
  classPageSize: Ref<number>
  classTotalPages: Ref<number>
  studentPage: Ref<number>
  studentPageSize: Ref<number>
  studentTotalPages: Ref<number>
  attendanceLogsPage: Ref<number>
  attendanceLogsPageSize: Ref<number>
  attendanceLogsTotalPages: Ref<number>
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
  async function loadOverviewData() {
    const [terms, summary, resultPage] = await Promise.all([api.listMetaTerms(), api.adminAttendanceDashboard(), api.adminAttendanceResults()])
    deps.courseTerms.value = terms
    deps.dashboard.value = summary
    deps.attendanceResults.value = resultPage.items ?? []
  }

  async function loadAttendanceData() {
    const resultPage = await api.adminAttendanceResults()
    deps.attendanceResults.value = resultPage.items ?? []
  }

  async function loadAttendanceLogsData() {
    const attendanceLogPageResult = await api.listAttendanceRecordLogs({
      page: deps.attendanceLogsPage.value,
      page_size: deps.attendanceLogsPageSize.value,
      student_id: deps.attendanceLogFilters.studentId,
      operator_login_id: deps.attendanceLogFilters.operatorStudentId,
      operation_type: deps.attendanceLogFilters.operationType,
      new_status: deps.attendanceLogFilters.newStatus,
      operated_date: deps.attendanceLogFilters.operatedDate,
    })
    deps.attendanceLogs.value = attendanceLogPageResult.items ?? []
    deps.attendanceLogRows.value = attendanceLogPageResult.items ?? []
    deps.attendanceLogsTotalPages.value = Math.max(1, Math.ceil((attendanceLogPageResult.total ?? 0) / deps.attendanceLogsPageSize.value))
  }

  async function loadCourseCalendarData() {
    const [terms, settings] = await Promise.all([
      api.listMetaTerms(),
      api.getSystemSettings(),
    ])
    const targetTerm = deps.courseCalendarTerm.value.trim() || selectDefaultTermName(terms) || ''
    const [calendar, freeTimeList] = await Promise.all([
      api.adminCourseCalendar(targetTerm),
      api.adminFreeTimeCalendar(targetTerm),
    ])
    deps.courseTerms.value = terms
    deps.courseCalendarTerm.value = targetTerm
    deps.courseCalendar.value = calendar ?? []
    deps.freeTimes.value = freeTimeList ?? []
    deps.systemSettings.value = settings
  }

  async function loadCourseManageData() {
    const [coursePageResult, terms, classes] = await Promise.all([
      api.listCourses({
        page: deps.coursePage.value,
        page_size: deps.coursePageSize.value,
        term: deps.courseFilters.term,
        course_name: deps.courseFilters.courseName,
        teacher_name: deps.courseFilters.teacherName,
        class_id: deps.courseFilters.classId === '' ? '' : Number(deps.courseFilters.classId),
      }),
      api.listMetaTerms(),
      api.listClassOptions(),
    ])
    deps.courseRows.value = coursePageResult.items ?? []
    deps.courseTerms.value = terms
    deps.classes.value = classes as unknown as ClassItem[]
    deps.courseTotalPages.value = Math.max(1, Math.ceil((coursePageResult.total ?? 0) / deps.coursePageSize.value))
  }

  async function loadClassManageData() {
    const [classPageResult, students] = await Promise.all([
      api.listClasses({
        page: deps.classPage.value,
        page_size: deps.classPageSize.value,
        grade: deps.classFilters.grade,
        major_name: deps.classFilters.majorName,
        class_name: deps.classFilters.className,
      }),
      api.listStudentOptions({ binding: 'unbound' }),
    ])
    deps.classRows.value = classPageResult.items ?? []
    deps.students.value = students as unknown as StudentItem[]
    deps.classTotalPages.value = Math.max(1, Math.ceil((classPageResult.total ?? 0) / deps.classPageSize.value))
  }

  async function loadStudentManageData() {
    const [studentPageResult, classes] = await Promise.all([
      api.listStudents({
        page: deps.studentPage.value,
        page_size: deps.studentPageSize.value,
        student_id: deps.studentFilters.studentId,
        real_name: deps.studentFilters.realName,
        class_name: deps.studentFilters.className,
      }),
      api.listClassOptions(),
    ])
    deps.studentRows.value = studentPageResult.items ?? []
    deps.classes.value = classes as unknown as ClassItem[]
    deps.studentTotalPages.value = Math.max(1, Math.ceil((studentPageResult.total ?? 0) / deps.studentPageSize.value))
  }

  async function loadUserManageData() {
    const [userPageResult, classes, terms] = await Promise.all([
      api.listUsers({
        page: deps.userPage.value,
        page_size: deps.userPageSize.value,
        login_id: deps.userFilters.studentId,
        real_name: deps.userFilters.realName,
        managed_class_name: deps.userFilters.managedClassName,
        role: deps.userFilters.role,
        status: deps.userFilters.status,
      }),
      api.listClassOptions(),
      api.listMetaTerms(),
    ])
    deps.userRows.value = userPageResult.items ?? []
    deps.classes.value = classes as unknown as ClassItem[]
    deps.courseTerms.value = terms
    deps.userTotalPages.value = Math.max(1, Math.ceil((userPageResult.total ?? 0) / deps.userPageSize.value))
  }

  async function loadSettingsData() {
    const terms = await api.listMetaTerms()
    deps.courseTerms.value = terms
  }

  async function loadAdminData(tab: AppTab = deps.activeTab.value) {
    switch (tab) {
      case 'overview':
        await loadOverviewData()
        return
      case 'attendance':
        await loadAttendanceData()
        return
      case 'attendance-logs':
        await loadAttendanceLogsData()
        return
      case 'course-calendar':
        await loadCourseCalendarData()
        return
      case 'course-manage':
        await loadCourseManageData()
        return
      case 'class-manage':
        await loadClassManageData()
        return
      case 'student':
        await loadStudentManageData()
        return
      case 'user-manage':
        await loadUserManageData()
        return
      case 'settings':
        await loadSettingsData()
        return
      default:
        await loadOverviewData()
    }
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

  async function updateAdminStatus(sessionId: number, studentRefId: number, status: StatusCode) {
    deps.adminError.value = ''
    try {
      await api.adminUpdateAttendanceStatus(sessionId, studentRefId, status)
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
