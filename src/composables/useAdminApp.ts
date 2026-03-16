import { computed } from 'vue'

import { api } from '../api'
import type { AppTab, StatusCode } from '../constants'
import { FREE_TIME_VISIBLE_SECTIONS, FREE_TIME_VISIBLE_WEEKDAYS, buildFreeTimeCellKey, formatFreeWeeks, parseFreeWeeks } from '../utils/free-time'
import { parseImportedClassFile, parseImportedCourseFile } from './app/importers'
import { useAdminFlow } from './app/useAdminFlow'
import { roleName, slotLabel, statusClass, statusName, USER_PAGE_OPTIONS } from './app/view'

type UseAdminAppDeps = any

export function useAdminApp(deps: UseAdminAppDeps) {
  const adminFlow = useAdminFlow({
    me: deps.me,
    users: deps.users,
    classes: deps.classes,
    courseStudentCandidates: deps.courseStudentCandidates,
    courses: deps.courses,
    courseCalendar: deps.courseCalendar,
    dashboard: deps.dashboard,
    attendanceResults: deps.attendanceResults,
    freeTimes: deps.freeTimes,
    systemSettings: deps.systemSettings,
    logs: deps.logs,
    attendanceLogs: deps.attendanceLogs,
    userForm: deps.userForm,
    profileForm: deps.profileForm,
    userPasswordForm: deps.userPasswordForm,
    courseForm: deps.courseForm,
    classForm: deps.classForm,
    editingUserStudentId: deps.editingUserStudentId,
    editingCourseId: deps.editingCourseId,
    editingClassId: deps.editingClassId,
    passwordTargetStudentId: deps.passwordTargetStudentId,
    deletingCourseId: deps.deletingCourseId,
    deletingClassId: deps.deletingClassId,
    courseStudentTargetCourseId: deps.courseStudentTargetCourseId,
    courseStudentSelectedClassIds: deps.courseStudentSelectedClassIds,
    courseStudentSelectedStudents: deps.courseStudentSelectedStudents,
    userSaving: deps.userSaving,
    passwordResetting: deps.passwordResetting,
    profileSaving: deps.profileSaving,
    courseSaving: deps.courseSaving,
    courseDeleting: deps.courseDeleting,
    courseStudentSaving: deps.courseStudentSaving,
    classSaving: deps.classSaving,
    classDeleting: deps.classDeleting,
    adminError: deps.adminError,
    showAdminToast: (message: string) => deps.showScopedToast('admin', message),
    closeUserModal: deps.closeUserModal,
    closeUserPasswordModal: deps.closeUserPasswordModal,
    closeProfileModal: deps.closeProfileModal,
    closeCourseModal: deps.closeCourseModal,
    closeCourseStudentModal: deps.closeCourseStudentModal,
    closeDeleteCourseModal: deps.closeDeleteCourseModal,
    closeClassModal: deps.closeClassModal,
    closeDeleteClassModal: deps.closeDeleteClassModal,
  })

  async function loadAdminData() {
    await adminFlow.loadAdminData()
  }

  async function createUser() {
    await adminFlow.createUser()
  }

  async function resetUserPassword() {
    await adminFlow.resetUserPassword()
  }

  async function updateProfile() {
    await adminFlow.updateProfile()
  }

  async function setUserStatus(studentId: string, status: number) {
    await adminFlow.setUserStatus(studentId, status)
  }

  async function saveCourse() {
    await adminFlow.saveCourse()
  }

  async function saveCourseStudents() {
    await adminFlow.saveCourseStudents()
  }

  async function deleteCourse() {
    await adminFlow.deleteCourse()
  }

  async function saveClass() {
    await adminFlow.saveClass()
  }

  async function deleteClass() {
    await adminFlow.deleteClass()
  }

  async function updateAdminStatus(detailId: number, status: StatusCode) {
    await adminFlow.updateAdminStatus(detailId, status)
  }

  async function importCourses(files: File[]) {
    if (files.length === 0) {
      return
    }
    deps.courseImporting.value = true
    deps.adminError.value = ''
    const errors: string[] = []
    let importedCount = 0

    try {
      for (const file of files) {
        try {
          const course = await parseImportedCourseFile(file)
          const created = await api.createCourse(course)
          try {
            await api.replaceCourseSessions(created.id, course.sessions)
          } catch (error) {
            await api.deleteCourse(created.id).catch(() => undefined)
            throw error
          }
          importedCount += 1
        } catch (error) {
          const message = error instanceof Error ? error.message : '导入失败'
          errors.push(`${file.name}: ${message}`)
        }
      }

      if (importedCount > 0) {
        await loadAdminData()
        deps.showScopedToast('admin', `已导入 ${importedCount} 门课程`)
      }
      if (errors.length > 0) {
        const prefix = importedCount > 0 ? `部分导入失败，共 ${errors.length} 个文件失败：` : `导入课程失败，共 ${errors.length} 个文件失败：`
        deps.adminError.value = [prefix, ...errors.map((item, index) => `${index + 1}. ${item}`)].join('\n')
      }
    } finally {
      deps.courseImporting.value = false
    }
  }

  async function createClassStudent() {
    if (deps.classStudentTargetClassId.value === null) {
      return
    }
    deps.classStudentSaving.value = true
    deps.adminError.value = ''
    try {
      await api.createClassStudent(deps.classStudentTargetClassId.value, {
        student_id: deps.classStudentForm.studentId.trim(),
        real_name: deps.classStudentForm.realName.trim(),
      })
      await deps.loadClassStudents(deps.classStudentTargetClassId.value)
      deps.resetClassStudentForm()
      await loadAdminData()
      deps.showScopedToast('admin', '班级学生已保存')
    } catch (error) {
      deps.adminError.value = error instanceof Error ? error.message : '创建班级学生失败'
    } finally {
      deps.classStudentSaving.value = false
    }
  }

  async function saveEditingClassStudent() {
    if (deps.classStudentTargetClassId.value === null || deps.editingClassStudentId.value === null) {
      return false
    }
    deps.classStudentSaving.value = true
    deps.adminError.value = ''
    try {
      await api.updateClassStudent(deps.classStudentTargetClassId.value, deps.editingClassStudentId.value, {
        student_id: deps.editingClassStudentForm.studentId.trim(),
        real_name: deps.editingClassStudentForm.realName.trim(),
      })
      await deps.loadClassStudents(deps.classStudentTargetClassId.value)
      deps.resetEditingClassStudentForm()
      await loadAdminData()
      deps.showScopedToast('admin', '班级学生已更新')
      return true
    } catch (error) {
      deps.adminError.value = error instanceof Error ? error.message : '更新班级学生失败'
      return false
    } finally {
      deps.classStudentSaving.value = false
    }
  }

  async function deleteClassStudent(studentId: number) {
    if (deps.classStudentTargetClassId.value === null) {
      return
    }
    deps.classStudentSaving.value = true
    deps.adminError.value = ''
    try {
      await api.deleteClassStudent(deps.classStudentTargetClassId.value, studentId)
      if (deps.editingClassStudentId.value === studentId) {
        deps.resetEditingClassStudentForm()
      }
      await deps.loadClassStudents(deps.classStudentTargetClassId.value)
      await loadAdminData()
      deps.showScopedToast('admin', '班级学生已删除')
    } catch (error) {
      deps.adminError.value = error instanceof Error ? error.message : '删除班级学生失败'
    } finally {
      deps.classStudentSaving.value = false
    }
  }

  async function importClasses(files: File[]) {
    if (files.length === 0) {
      return
    }
    deps.classStudentImporting.value = true
    deps.adminError.value = ''
    const errors: string[] = []
    let importedCount = 0

    try {
      for (const file of files) {
        try {
          const payload = await parseImportedClassFile(file)
          const created = await api.createClass(payload)
          try {
            await api.importClassStudents(created.id, payload.students)
          } catch (error) {
            await api.deleteClass(created.id).catch(() => undefined)
            throw error
          }
          importedCount += 1
        } catch (error) {
          const message = error instanceof Error ? error.message : '导入失败'
          errors.push(`${file.name}: ${message}`)
        }
      }

      if (importedCount > 0) {
        await loadAdminData()
        deps.showScopedToast('admin', `已导入 ${importedCount} 个班级`)
      }
      if (errors.length > 0) {
        const prefix = importedCount > 0 ? `部分导入失败，共 ${errors.length} 个文件失败：` : `导入班级失败，共 ${errors.length} 个文件失败：`
        deps.adminError.value = [prefix, ...errors.map((item, index) => `${index + 1}. ${item}`)].join('\n')
      }
    } finally {
      deps.classStudentImporting.value = false
    }
  }

  async function saveUserFreeTime() {
    if (!deps.freeTimeTargetStudentId.value) {
      return
    }
    deps.userFreeTimeSaving.value = true
    deps.adminError.value = ''
    try {
      const term = deps.userFreeTimeTerm.value.trim()
      const originalItems = deps.userFreeTimeItems.value.filter((item: any) => item.term === term)
      const originalMap = new Map(originalItems.map((item: any) => [buildFreeTimeCellKey(item.weekday, item.section), item]))
      const tasks: Promise<unknown>[] = []

      for (const weekday of FREE_TIME_VISIBLE_WEEKDAYS) {
        for (const section of FREE_TIME_VISIBLE_SECTIONS) {
          const key = buildFreeTimeCellKey(weekday, section)
          const weeks = deps.userFreeTimeDraft.value[key] ?? []
          const currentValue = formatFreeWeeks(weeks)
          const currentItem = originalMap.get(key) as any
          const originalValue = currentItem ? formatFreeWeeks(parseFreeWeeks(currentItem.free_weeks)) : ''

          if (!currentValue && currentItem) {
            tasks.push(api.deleteFreeTime(currentItem.id))
            continue
          }

          if (!currentValue) {
            continue
          }

          const payload = {
            term,
            student_id: deps.freeTimeTargetStudentId.value,
            weekday,
            section,
            free_weeks: currentValue,
          }

          if (!currentItem) {
            tasks.push(api.createFreeTime(payload))
            continue
          }

          if (originalValue !== currentValue) {
            tasks.push(api.updateFreeTime(currentItem.id, payload))
          }
        }
      }

      await Promise.all(tasks)
      await deps.loadUserFreeTimeItems(deps.freeTimeTargetStudentId.value)
      await loadAdminData()
      deps.showScopedToast('admin', '空闲时间已保存')
      deps.closeUserFreeTimeModal()
    } catch (error) {
      deps.adminError.value = error instanceof Error ? error.message : '保存空闲时间失败'
    } finally {
      deps.userFreeTimeSaving.value = false
    }
  }

  async function updateSystemSettings(payload: { current_term_start_date: string }) {
    deps.systemSettingSaving.value = true
    deps.adminError.value = ''
    try {
      deps.systemSettings.value = await api.updateSystemSettings(payload)
      deps.showScopedToast('admin', '系统设置已更新')
    } catch (error) {
      deps.adminError.value = error instanceof Error ? error.message : '更新系统设置失败'
    } finally {
      deps.systemSettingSaving.value = false
    }
  }

  async function bulkDeleteCourses() {
    const ids = [...deps.selectedCourseIds.value]
    if (ids.length === 0) {
      return
    }

    deps.courseDeleting.value = true
    deps.adminError.value = ''
    const nameById = new Map(deps.courses.value.map((item: any) => [item.id, item.course_name]))
    const failed: string[] = []
    let deletedCount = 0
    try {
      for (const id of ids) {
        try {
          await api.deleteCourse(id)
          deletedCount += 1
        } catch (error) {
          const label = nameById.get(id) ?? `ID ${id}`
          const message = error instanceof Error ? error.message : '删除失败'
          failed.push(`${label}（${message}）`)
        }
      }
      await loadAdminData()
      deps.closeBulkDeleteCourseModal()
      deps.selectedCourseIds.value = failed.length === 0 ? [] : deps.selectedCourseIds.value.filter((id: number) => ids.includes(id))
      if (deletedCount > 0) {
        deps.showScopedToast('admin', `已删除 ${deletedCount} 门课程`)
      }
      if (failed.length > 0) {
        deps.adminError.value = `部分删除失败：${failed.join('；')}`
      }
    } finally {
      deps.courseDeleting.value = false
    }
  }

  async function bulkDeleteClasses() {
    const ids = [...deps.selectedClassIds.value]
    if (ids.length === 0) {
      return
    }

    deps.classDeleting.value = true
    deps.adminError.value = ''
    const nameById = new Map(deps.classes.value.map((item: any) => [item.id, item.class_name]))
    const failed: string[] = []
    let deletedCount = 0
    try {
      for (const id of ids) {
        try {
          await api.deleteClass(id)
          deletedCount += 1
        } catch (error) {
          const label = nameById.get(id) ?? `ID ${id}`
          const message = error instanceof Error ? error.message : '删除失败'
          failed.push(`${label}（${message}）`)
        }
      }
      await loadAdminData()
      deps.closeBulkDeleteClassModal()
      deps.selectedClassIds.value = failed.length === 0 ? [] : deps.selectedClassIds.value.filter((id: number) => ids.includes(id))
      if (deletedCount > 0) {
        deps.showScopedToast('admin', `已删除 ${deletedCount} 个班级`)
      }
      if (failed.length > 0) {
        deps.adminError.value = `部分删除失败：${failed.join('；')}`
      }
    } finally {
      deps.classDeleting.value = false
    }
  }

  async function bulkSetUserStatus(status: number) {
    const studentIds = [...deps.selectedUserStudentIds.value]
    if (studentIds.length === 0) {
      return
    }

    deps.userStatusUpdating.value = true
    deps.adminError.value = ''
    const actionLabel = status === 1 ? '解冻' : '冻结'
    const nameByStudentId = new Map(deps.users.value.map((item: any) => [item.student_id, item.real_name]))
    const failed: string[] = []
    let updatedCount = 0
    try {
      for (const studentId of studentIds) {
        try {
          await api.updateUserStatus(studentId, status)
          updatedCount += 1
        } catch (error) {
          const label = nameByStudentId.get(studentId) ?? studentId
          const message = error instanceof Error ? error.message : '更新失败'
          failed.push(`${label}（${studentId}，${message}）`)
        }
      }
      await loadAdminData()
      deps.selectedUserStudentIds.value = failed.length === 0 ? [] : deps.selectedUserStudentIds.value.filter((studentId: string) => studentIds.includes(studentId))
      if (updatedCount > 0) {
        deps.showScopedToast('admin', `已${actionLabel} ${updatedCount} 个用户`)
      }
      if (failed.length > 0) {
        deps.adminError.value = `部分${actionLabel}失败：${failed.join('；')}`
      }
    } finally {
      deps.userStatusUpdating.value = false
    }
  }

  const adminWorkspaceProps = computed(() => ({
    me: deps.me.value!,
    activeTab: deps.activeTab.value,
    pageError: deps.adminError.value,
    toast: deps.adminToast.value,
    adminStats: deps.adminStats.value,
    courseCalendar: deps.courseCalendar.value,
    freeTimes: deps.freeTimes.value,
    systemSettings: deps.systemSettings.value,
    systemSettingSaving: deps.systemSettingSaving.value,
    logs: deps.paginatedLogs.value,
    attendanceLogs: deps.paginatedAttendanceLogs.value,
    classes: deps.paginatedClasses.value,
    allClasses: deps.classes.value,
    classStudents: deps.filteredClassStudents.value,
    users: deps.paginatedUsers.value,
    courseStudentCandidates: deps.courseStudentCandidates.value,
    currentUserId: deps.currentUserId.value,
    courses: deps.paginatedCourses.value,
    attendanceResults: deps.attendanceResults.value,
    userForm: deps.userForm,
    userFilters: deps.userFilters,
    userModalOpen: deps.userModalOpen.value,
    isEditingUser: deps.isEditingUser.value,
    creatingUser: deps.userSaving.value,
    userStatusUpdating: deps.userStatusUpdating.value,
    userPage: deps.userPage.value,
    userPageSize: deps.userPageSize.value,
    userTotalPages: deps.userTotalPages.value,
    userPageOptions: USER_PAGE_OPTIONS,
    selectedUserStudentIds: deps.selectedUserStudentIds.value,
    userPasswordModalOpen: deps.userPasswordModalOpen.value,
    userPasswordForm: deps.userPasswordForm,
    passwordTargetName: deps.passwordTargetName.value,
    passwordResetting: deps.passwordResetting.value,
    userFreeTimeModalOpen: deps.userFreeTimeModalOpen.value,
    freeTimeTargetName: deps.freeTimeTargetName.value,
    userFreeTimeTerm: deps.userFreeTimeTerm.value,
    userFreeTimeTermOptions: deps.userFreeTimeTermOptions.value,
    userFreeTimeLoading: deps.userFreeTimeLoading.value,
    userFreeTimeSaving: deps.userFreeTimeSaving.value,
    userFreeTimeDraft: deps.userFreeTimeDraft.value,
    courseFilters: deps.courseFilters,
    courseForm: deps.courseForm,
    courseModalOpen: deps.courseModalOpen.value,
    deleteCourseModalOpen: deps.deleteCourseModalOpen.value,
    bulkDeleteCourseModalOpen: deps.bulkDeleteCourseModalOpen.value,
    courseStudentModalOpen: deps.courseStudentModalOpen.value,
    courseStudentLoading: deps.courseStudentLoading.value,
    courseStudentSaving: deps.courseStudentSaving.value,
    courseImporting: deps.courseImporting.value,
    courseStudentTargetName: deps.courseStudentTargetName.value,
    courseStudentSelectedClassIds: deps.courseStudentSelectedClassIds.value,
    courseStudentSelectedStudentIds: deps.courseStudentSelectedStudentIds.value,
    courseStudentClassStudentMap: deps.courseStudentClassStudentMap.value,
    courseStudentLooseStudents: deps.courseStudentLooseStudents.value,
    courseSaving: deps.courseSaving.value,
    courseLoading: deps.courseLoading.value,
    courseDeleting: deps.courseDeleting.value,
    isEditingCourse: deps.editingCourseId.value !== null,
    coursePage: deps.coursePage.value,
    coursePageSize: deps.coursePageSize.value,
    courseTotalPages: deps.courseTotalPages.value,
    coursePageOptions: USER_PAGE_OPTIONS,
    selectedCourseIds: deps.selectedCourseIds.value,
    selectedCourseCount: deps.selectedCourseIds.value.length,
    deletingCourseName: deps.deletingCourseName.value,
    classForm: deps.classForm,
    classFilters: deps.classFilters,
    classStudentForm: deps.classStudentForm,
    editingClassStudentForm: deps.editingClassStudentForm,
    classStudentFilters: deps.classStudentFilters,
    classStudentModalOpen: deps.classStudentModalOpen.value,
    classStudentSaving: deps.classStudentSaving.value,
    classStudentImporting: deps.classStudentImporting.value,
    editingClassStudentId: deps.editingClassStudentId.value,
    classStudentTargetName: deps.classStudentTargetName.value,
    classModalOpen: deps.classModalOpen.value,
    deleteClassModalOpen: deps.deleteClassModalOpen.value,
    bulkDeleteClassModalOpen: deps.bulkDeleteClassModalOpen.value,
    isEditingClass: deps.isEditingClass.value,
    classSaving: deps.classSaving.value,
    classDeleting: deps.classDeleting.value,
    classPage: deps.classPage.value,
    classPageSize: deps.classPageSize.value,
    classTotalPages: deps.classTotalPages.value,
    classPageOptions: USER_PAGE_OPTIONS,
    selectedClassIds: deps.selectedClassIds.value,
    selectedClassCount: deps.selectedClassIds.value.length,
    deletingClassName: deps.deletingClassName.value,
    logFilters: deps.logFilters,
    logsPage: deps.logsPage.value,
    logsPageSize: deps.logsPageSize.value,
    logsTotalPages: deps.logsTotalPages.value,
    logsPageOptions: USER_PAGE_OPTIONS,
    attendanceLogFilters: deps.attendanceLogFilters,
    attendanceLogsPage: deps.attendanceLogsPage.value,
    attendanceLogsPageSize: deps.attendanceLogsPageSize.value,
    attendanceLogsTotalPages: deps.attendanceLogsTotalPages.value,
    attendanceLogsPageOptions: USER_PAGE_OPTIONS,
    profileForm: deps.profileForm,
    profileModalOpen: deps.profileModalOpen.value,
    profileSaving: deps.profileSaving.value,
    passwordForm: deps.passwordForm,
    passwordModalOpen: deps.passwordModalOpen.value,
    changingPassword: deps.passwordSaving.value,
    roleName,
    statusName,
    statusClass,
    slotLabel,
  }))

  const adminWorkspaceHandlers = {
    'update:activeTab': (value: AppTab) => {
      void deps.setActiveTab(value, 'push')
    },
    logout: deps.logout,
    openCreateCourseModal: deps.openCreateCourseModal,
    openEditCourseModal: deps.openEditCourseModal,
    openCourseStudentModal: deps.openCourseStudentModal,
    closeCourseModal: deps.closeCourseModal,
    closeCourseStudentModal: deps.closeCourseStudentModal,
    openDeleteCourseModal: deps.openDeleteCourseModal,
    closeDeleteCourseModal: deps.closeDeleteCourseModal,
    openBulkDeleteCourseModal: deps.openBulkDeleteCourseModal,
    closeBulkDeleteCourseModal: deps.closeBulkDeleteCourseModal,
    saveCourse,
    importCourses,
    saveCourseStudents,
    addCourseStudentClass: deps.addCourseStudentClass,
    removeCourseStudentClass: deps.removeCourseStudentClass,
    toggleCourseStudentClassSelection: deps.toggleCourseStudentClassSelection,
    toggleCourseStudentSelection: deps.toggleCourseStudentSelection,
    addCourseStudent: deps.addCourseStudent,
    removeCourseStudent: deps.removeCourseStudent,
    deleteCourse,
    setCourseWeekSelected: deps.setCourseWeekSelected,
    addCourseSessions: deps.addCourseSessions,
    editCourseSession: deps.editCourseSession,
    removeCourseSession: deps.removeCourseSession,
    updateCoursePage: deps.updateCoursePage,
    updateCoursePageSize: deps.updateCoursePageSize,
    toggleCourseSelection: deps.toggleCourseSelection,
    toggleCoursePageSelection: deps.toggleCoursePageSelection,
    bulkDeleteCourses,
    updateSystemSettings,
    openCreateClassModal: deps.openCreateClassModal,
    openEditClassModal: deps.openEditClassModal,
    openClassStudentModal: deps.openClassStudentModal,
    closeClassModal: deps.closeClassModal,
    closeClassStudentModal: deps.closeClassStudentModal,
    openDeleteClassModal: deps.openDeleteClassModal,
    closeDeleteClassModal: deps.closeDeleteClassModal,
    openBulkDeleteClassModal: deps.openBulkDeleteClassModal,
    closeBulkDeleteClassModal: deps.closeBulkDeleteClassModal,
    saveClass,
    deleteClass,
    createClassStudent,
    startEditClassStudent: deps.startEditClassStudent,
    saveEditingClassStudent,
    deleteClassStudent,
    importClasses,
    updateClassPage: deps.updateClassPage,
    updateClassPageSize: deps.updateClassPageSize,
    toggleClassSelection: deps.toggleClassSelection,
    toggleClassPageSelection: deps.toggleClassPageSelection,
    bulkDeleteClasses,
    openCreateUserModal: deps.openCreateUserModal,
    updateAttendanceLogsPage: deps.updateAttendanceLogsPage,
    updateAttendanceLogsPageSize: deps.updateAttendanceLogsPageSize,
    updateLogsPage: deps.updateLogsPage,
    updateLogsPageSize: deps.updateLogsPageSize,
    openEditUserModal: deps.openEditUserModal,
    closeUserModal: deps.closeUserModal,
    openUserPasswordModal: deps.openUserPasswordModal,
    closeUserPasswordModal: deps.closeUserPasswordModal,
    openUserFreeTimeModal: deps.openUserFreeTimeModal,
    closeUserFreeTimeModal: deps.closeUserFreeTimeModal,
    updateUserFreeTimeTerm: deps.updateUserFreeTimeTerm,
    toggleUserFreeTimeWeek: deps.toggleUserFreeTimeWeek,
    saveUserFreeTime,
    resetUserPassword,
    updateUserPage: deps.updateUserPage,
    updateUserPageSize: deps.updateUserPageSize,
    toggleUserSelection: deps.toggleUserSelection,
    toggleUserPageSelection: deps.toggleUserPageSelection,
    bulkFreezeUsers: () => bulkSetUserStatus(2),
    bulkUnfreezeUsers: () => bulkSetUserStatus(1),
    openProfileModal: deps.openProfileModal,
    closeProfileModal: deps.closeProfileModal,
    updateProfile,
    openPasswordModal: deps.openPasswordModal,
    closePasswordModal: deps.closePasswordModal,
    createUser,
    setUserStatus,
    updateAdminStatus,
    changePassword: deps.changePassword,
  }

  return {
    loadAdminData,
    adminWorkspaceProps,
    adminWorkspaceHandlers,
  }
}
