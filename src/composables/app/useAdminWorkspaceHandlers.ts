import type { AppTab, StatusCode } from '../../constants'

export type AdminWorkspaceHandlersDeps = {
  setActiveTab: (tab: AppTab, mode?: 'push' | 'replace') => Promise<void>
  logout: () => void
  openCreateCourseModal: () => void
  openEditCourseModal: (item: any) => Promise<void>
  openCourseStudentModal: (item: any) => Promise<void>
  closeCourseModal: () => void
  closeCourseStudentModal: () => void
  openDeleteCourseModal: (item: any) => void
  closeDeleteCourseModal: () => void
  openBulkDeleteCourseModal: () => void
  closeBulkDeleteCourseModal: () => void
  saveCourse: () => Promise<void>
  importCourses: (files: File[]) => Promise<void>
  saveCourseStudents: () => Promise<void>
  addCourseStudentClass: (classId: number) => Promise<void>
  removeCourseStudentClass: (classId: number) => void
  toggleCourseStudentClassSelection: (classId: number) => void
  toggleCourseStudentSelection: (studentId: string) => void
  addCourseStudent: (studentId: string) => void
  removeCourseStudent: (studentId: string) => void
  deleteCourse: () => Promise<void>
  setCourseWeekSelected: (weekNo: number, selected: boolean) => void
  addCourseSessions: () => void
  editCourseSession: (sessionNo: number) => void
  removeCourseSession: (sessionNo: number) => void
  updateCoursePage: (page: number) => void
  updateCoursePageSize: (size: number) => void
  toggleCourseSelection: (courseId: number) => void
  toggleCoursePageSelection: () => void
  bulkDeleteCourses: () => Promise<void>
  updateSystemSettings: (payload: { current_term_start_date: string }) => Promise<void>
  openCreateClassModal: () => void
  openEditClassModal: (item: any) => void
  openClassStudentModal: (item: any) => Promise<void>
  closeClassModal: () => void
  closeClassStudentModal: () => void
  openDeleteClassModal: (item: any) => void
  closeDeleteClassModal: () => void
  openBulkDeleteClassModal: () => void
  closeBulkDeleteClassModal: () => void
  saveClass: () => Promise<void>
  deleteClass: () => Promise<void>
  createClassStudent: () => Promise<void>
  startEditClassStudent: (studentId: number) => void
  saveEditingClassStudent: () => Promise<boolean>
  deleteClassStudent: (studentId: number) => Promise<void>
  importClasses: (files: File[]) => Promise<void>
  updateClassPage: (page: number) => void
  updateClassPageSize: (size: number) => void
  toggleClassSelection: (classId: number) => void
  toggleClassPageSelection: () => void
  bulkDeleteClasses: () => Promise<void>
  openCreateUserModal: () => void
  updateAttendanceLogsPage: (page: number) => void
  updateAttendanceLogsPageSize: (size: number) => void
  updateLogsPage: (page: number) => void
  updateLogsPageSize: (size: number) => void
  openEditUserModal: (user: any) => void
  closeUserModal: () => void
  openUserPasswordModal: (user: any) => void
  closeUserPasswordModal: () => void
  openUserFreeTimeModal: (user: any) => Promise<void>
  closeUserFreeTimeModal: () => void
  updateUserFreeTimeTerm: (term: string) => void
  toggleUserFreeTimeWeek: (payload: { weekday: number; section: number; weekNo: number }) => void
  saveUserFreeTime: () => Promise<void>
  resetUserPassword: () => Promise<void>
  updateUserPage: (page: number) => void
  updateUserPageSize: (size: number) => void
  toggleUserSelection: (studentId: string) => void
  toggleUserPageSelection: () => void
  bulkSetUserStatus: (status: number) => Promise<void>
  openProfileModal: () => void
  closeProfileModal: () => void
  updateProfile: () => Promise<void>
  openPasswordModal: () => void
  closePasswordModal: () => void
  createUser: () => Promise<void>
  setUserStatus: (studentId: string, status: number) => Promise<void>
  updateAdminStatus: (detailId: number, status: StatusCode) => Promise<void>
  changePassword: () => Promise<void>
}

export function useAdminWorkspaceHandlers(deps: AdminWorkspaceHandlersDeps) {
  return {
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
    saveCourse: deps.saveCourse,
    importCourses: deps.importCourses,
    saveCourseStudents: deps.saveCourseStudents,
    addCourseStudentClass: deps.addCourseStudentClass,
    removeCourseStudentClass: deps.removeCourseStudentClass,
    toggleCourseStudentClassSelection: deps.toggleCourseStudentClassSelection,
    toggleCourseStudentSelection: deps.toggleCourseStudentSelection,
    addCourseStudent: deps.addCourseStudent,
    removeCourseStudent: deps.removeCourseStudent,
    deleteCourse: deps.deleteCourse,
    setCourseWeekSelected: deps.setCourseWeekSelected,
    addCourseSessions: deps.addCourseSessions,
    editCourseSession: deps.editCourseSession,
    removeCourseSession: deps.removeCourseSession,
    updateCoursePage: deps.updateCoursePage,
    updateCoursePageSize: deps.updateCoursePageSize,
    toggleCourseSelection: deps.toggleCourseSelection,
    toggleCoursePageSelection: deps.toggleCoursePageSelection,
    bulkDeleteCourses: deps.bulkDeleteCourses,
    updateSystemSettings: deps.updateSystemSettings,
    openCreateClassModal: deps.openCreateClassModal,
    openEditClassModal: deps.openEditClassModal,
    openClassStudentModal: deps.openClassStudentModal,
    closeClassModal: deps.closeClassModal,
    closeClassStudentModal: deps.closeClassStudentModal,
    openDeleteClassModal: deps.openDeleteClassModal,
    closeDeleteClassModal: deps.closeDeleteClassModal,
    openBulkDeleteClassModal: deps.openBulkDeleteClassModal,
    closeBulkDeleteClassModal: deps.closeBulkDeleteClassModal,
    saveClass: deps.saveClass,
    deleteClass: deps.deleteClass,
    createClassStudent: deps.createClassStudent,
    startEditClassStudent: deps.startEditClassStudent,
    saveEditingClassStudent: deps.saveEditingClassStudent,
    deleteClassStudent: deps.deleteClassStudent,
    importClasses: deps.importClasses,
    updateClassPage: deps.updateClassPage,
    updateClassPageSize: deps.updateClassPageSize,
    toggleClassSelection: deps.toggleClassSelection,
    toggleClassPageSelection: deps.toggleClassPageSelection,
    bulkDeleteClasses: deps.bulkDeleteClasses,
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
    saveUserFreeTime: deps.saveUserFreeTime,
    resetUserPassword: deps.resetUserPassword,
    updateUserPage: deps.updateUserPage,
    updateUserPageSize: deps.updateUserPageSize,
    toggleUserSelection: deps.toggleUserSelection,
    toggleUserPageSelection: deps.toggleUserPageSelection,
    bulkFreezeUsers: () => deps.bulkSetUserStatus(2),
    bulkUnfreezeUsers: () => deps.bulkSetUserStatus(1),
    openProfileModal: deps.openProfileModal,
    closeProfileModal: deps.closeProfileModal,
    updateProfile: deps.updateProfile,
    openPasswordModal: deps.openPasswordModal,
    closePasswordModal: deps.closePasswordModal,
    createUser: deps.createUser,
    setUserStatus: deps.setUserStatus,
    updateAdminStatus: deps.updateAdminStatus,
    changePassword: deps.changePassword,
  }
}
