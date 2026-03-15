import type { Ref } from 'vue'

import { api, type AttendanceResultItem, type ClassItem, type CourseCalendarItem, type CourseItem, type DashboardSummary, type FreeTimeItem, type SessionUser, type UserItem } from '../../api'
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

type ClassForm = {
  className: string
  grade: number
  majorName: string
}

type AdminFlowDeps = {
  me: Ref<SessionUser | null>
  users: Ref<UserItem[]>
  classes: Ref<ClassItem[]>
  courses: Ref<CourseItem[]>
  courseCalendar: Ref<CourseCalendarItem[]>
  dashboard: Ref<DashboardSummary | null>
  attendanceResults: Ref<AttendanceResultItem[]>
  freeTimes: Ref<FreeTimeItem[]>
  userForm: UserForm
  profileForm: ProfileForm
  userPasswordForm: UserPasswordForm
  courseForm: CourseForm
  classForm: ClassForm
  editingUserStudentId: Ref<string>
  editingClassId: Ref<number | null>
  passwordTargetStudentId: Ref<string>
  deletingClassId: Ref<number | null>
  userSaving: Ref<boolean>
  passwordResetting: Ref<boolean>
  profileSaving: Ref<boolean>
  courseSaving: Ref<boolean>
  classSaving: Ref<boolean>
  classDeleting: Ref<boolean>
  adminError: Ref<string>
  showAdminToast: (message: string) => void
  closeUserModal: () => void
  closeUserPasswordModal: () => void
  closeProfileModal: () => void
  closeClassModal: () => void
  closeDeleteClassModal: () => void
}

export function useAdminFlow(deps: AdminFlowDeps) {
  async function loadAdminData() {
    const [userPageResult, classPageResult, coursePage, calendar, summary, resultPage, freeTimeList] = await Promise.all([
      api.listUsers({ page: 1, page_size: 500 }),
      api.listClasses(),
      api.listCourses(),
      api.adminCourseCalendar(),
      api.adminAttendanceDashboard(),
      api.adminAttendanceResults(),
      api.adminFreeTimeCalendar(),
    ])
    deps.users.value = userPageResult.items ?? []
    deps.classes.value = classPageResult.items ?? []
    deps.courses.value = coursePage.items ?? []
    deps.courseCalendar.value = calendar ?? []
    deps.dashboard.value = summary
    deps.attendanceResults.value = resultPage.items ?? []
    deps.freeTimes.value = freeTimeList ?? []
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
          class_ids: [],
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

  async function createCourse() {
    deps.courseSaving.value = true
    deps.adminError.value = ''
    try {
      const courseId = Number(deps.courseForm.courseId)
      const studentIds = deps.courseForm.studentIds
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)

      await api.createCourse({
        id: courseId,
        term: deps.courseForm.term.trim(),
        course_name: deps.courseForm.courseName.trim(),
        teacher_name: deps.courseForm.teacherName.trim(),
        attendance_student_count: 0,
      })
      await api.replaceCourseStudents(courseId, studentIds)
      await api.replaceCourseSessions(courseId, [
        {
          session_no: deps.courseForm.sessionNo,
          week_no: deps.courseForm.weekNo,
          weekday: deps.courseForm.weekday,
          section: deps.courseForm.section,
          building_name: deps.courseForm.buildingName.trim(),
          room_name: deps.courseForm.roomName.trim(),
        },
      ])
      Object.assign(deps.courseForm, createCourseForm())
      await loadAdminData()
      deps.showAdminToast('课程已创建')
    } catch (error) {
      deps.adminError.value = error instanceof Error ? error.message : '创建课程失败'
    } finally {
      deps.courseSaving.value = false
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
    createCourse,
    saveClass,
    deleteClass,
    updateAdminStatus,
  }
}
