import type { Ref } from 'vue'

import { api, type AdminOperationLogItem, type AttendanceDetailLogItem, type AttendanceResultItem, type ClassItem, type ClassStudentCandidateItem, type CourseCalendarItem, type CourseItem, type DashboardSummary, type FreeTimeItem, type SessionUser, type SystemSetting, type UserItem } from '../../api'
import type { StatusCode } from '../../constants'
import { createClassForm, createCourseForm } from './forms'

type UserForm = {
  studentId: string
  realName: string
  password: string
  confirmPassword: string
  role: number
  status: number
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
  term: string
  courseName: string
  teacherName: string
  weekday: number | null
  section: number | null
  buildingName: string
  roomName: string
  selectedWeeks: number[]
  sessions: Array<{
    sessionNo: number
    weekNo: number
    weekday: number
    section: number
    buildingName: string
    roomName: string
  }>
}

type ClassForm = {
  className: string
  grade: number
  majorName: string
}

export type AdminFlowDeps = {
  me: Ref<SessionUser | null>
  users: Ref<UserItem[]>
  classes: Ref<ClassItem[]>
  courseStudentCandidates: Ref<ClassStudentCandidateItem[]>
  courses: Ref<CourseItem[]>
  courseCalendar: Ref<CourseCalendarItem[]>
  dashboard: Ref<DashboardSummary | null>
  attendanceResults: Ref<AttendanceResultItem[]>
  freeTimes: Ref<FreeTimeItem[]>
  systemSettings: Ref<SystemSetting | null>
  logs: Ref<AdminOperationLogItem[]>
  attendanceLogs: Ref<AttendanceDetailLogItem[]>
  userForm: UserForm
  profileForm: ProfileForm
  userPasswordForm: UserPasswordForm
  courseForm: CourseForm
  classForm: ClassForm
  editingUserStudentId: Ref<string>
  editingCourseId: Ref<number | null>
  editingClassId: Ref<number | null>
  passwordTargetStudentId: Ref<string>
  deletingCourseId: Ref<number | null>
  deletingClassId: Ref<number | null>
  courseStudentTargetCourseId: Ref<number | null>
  courseStudentSelectedClassIds: Ref<number[]>
  courseStudentSelectedStudents: Ref<Array<{ student_id: string; real_name: string }>>
  userSaving: Ref<boolean>
  passwordResetting: Ref<boolean>
  profileSaving: Ref<boolean>
  courseSaving: Ref<boolean>
  courseDeleting: Ref<boolean>
  courseStudentSaving: Ref<boolean>
  classSaving: Ref<boolean>
  classDeleting: Ref<boolean>
  adminError: Ref<string>
  showAdminToast: (message: string) => void
  closeUserModal: () => void
  closeUserPasswordModal: () => void
  closeProfileModal: () => void
  closeCourseModal: () => void
  closeCourseStudentModal: () => void
  closeDeleteCourseModal: () => void
  closeClassModal: () => void
  closeDeleteClassModal: () => void
}

export function useAdminFlow(deps: AdminFlowDeps) {
  async function loadAdminData() {
    const [userPageResult, classPageResult, candidateList, coursePage, calendar, summary, resultPage, freeTimeList, logPageResult, attendanceLogPageResult, settings] = await Promise.all([
      api.listUsers({ page: 1, page_size: 500 }),
      api.listClasses(),
      api.listClassStudentCandidates(),
      api.listCourses(),
      api.adminCourseCalendar(),
      api.adminAttendanceDashboard(),
      api.adminAttendanceResults(),
      api.adminFreeTimeCalendar(),
      api.listAdminOperationLogs(),
      api.listAttendanceDetailLogs(),
      api.getSystemSettings(),
    ])
    deps.users.value = userPageResult.items ?? []
    deps.classes.value = classPageResult.items ?? []
    deps.courseStudentCandidates.value = candidateList ?? []
    deps.courses.value = coursePage.items ?? []
    deps.courseCalendar.value = calendar ?? []
    deps.dashboard.value = summary
    deps.attendanceResults.value = resultPage.items ?? []
    deps.freeTimes.value = freeTimeList ?? []
    deps.systemSettings.value = settings
    deps.logs.value = logPageResult.items ?? []
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

  async function createUser() {
    deps.userSaving.value = true
    deps.adminError.value = ''
    try {
      if (!deps.editingUserStudentId.value && deps.userForm.password !== deps.userForm.confirmPassword) {
        throw new Error('两次输入的密码不一致')
      }

      if (deps.editingUserStudentId.value) {
        await api.updateUser(deps.editingUserStudentId.value, {
          student_id: deps.userForm.studentId.trim(),
          real_name: deps.userForm.realName.trim(),
          role: deps.userForm.role,
          status: deps.userForm.status,
        })
        await loadAdminData()
        deps.closeUserModal()
        deps.showAdminToast('用户信息已更新')
        return
      }

      await api.createUser({
        student_id: deps.userForm.studentId.trim(),
        real_name: deps.userForm.realName.trim(),
        password: deps.userForm.password,
        role: deps.userForm.role,
        status: deps.userForm.status,
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
        student_id: deps.profileForm.studentId.trim(),
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
      if (deps.courseForm.sessions.length === 0) {
        throw new Error('请至少添加一个上课时间')
      }
      const sessions = deps.courseForm.sessions.map((session, index) => ({
        session_no: index + 1,
        week_no: session.weekNo,
        weekday: session.weekday,
        section: session.section,
        building_name: session.buildingName.trim(),
        room_name: session.roomName.trim(),
      }))

      const payload = {
        term: deps.courseForm.term.trim(),
        course_name: deps.courseForm.courseName.trim(),
        teacher_name: deps.courseForm.teacherName.trim(),
        attendance_student_count:
          deps.editingCourseId.value === null
            ? 0
            : (deps.courses.value.find((item) => item.id === deps.editingCourseId.value)?.attendance_student_count ?? 0),
      }

      if (deps.editingCourseId.value !== null) {
        await api.updateCourse(deps.editingCourseId.value, payload)
        await api.replaceCourseSessions(deps.editingCourseId.value, sessions)
      } else {
        const created = await api.createCourse(payload)
        await api.replaceCourseSessions(created.id, sessions)
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

  async function saveCourseStudents() {
    if (deps.courseStudentTargetCourseId.value === null) {
      return
    }

    deps.courseStudentSaving.value = true
    deps.adminError.value = ''
    try {
      await api.replaceCourseClasses(deps.courseStudentTargetCourseId.value, deps.courseStudentSelectedClassIds.value)
      await api.replaceCourseStudents(deps.courseStudentTargetCourseId.value, deps.courseStudentSelectedStudents.value)
      await loadAdminData()
      deps.closeCourseStudentModal()
      deps.showAdminToast('课程学生已更新')
    } catch (error) {
      deps.adminError.value = error instanceof Error ? error.message : '保存课程学生失败'
    } finally {
      deps.courseStudentSaving.value = false
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
    saveCourseStudents,
    deleteCourse,
    saveClass,
    deleteClass,
    updateAdminStatus,
  }
}
