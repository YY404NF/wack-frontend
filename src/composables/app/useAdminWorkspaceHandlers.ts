import type { AppTab, StatusCode } from '../../constants'

export type AdminWorkspaceHandlersDeps = {
  setActiveTab: (tab: AppTab, mode?: 'push' | 'replace') => Promise<void>
  logout: () => void
  openCreateCourseModal: () => void
  openEditCourseModal: (item: any) => Promise<void>
  closeCourseModal: () => void
  openDeleteCourseModal: (item: any) => void
  closeDeleteCourseModal: () => void
  openBulkDeleteCourseModal: () => void
  closeBulkDeleteCourseModal: () => void
  saveCourse: () => Promise<void>
  deleteCourse: () => Promise<void>
  updateCoursePage: (page: number) => void
  updateCoursePageSize: (size: number) => void
  toggleCourseSelection: (courseId: number) => void
  toggleCoursePageSelection: () => void
  bulkDeleteCourses: () => Promise<void>
  updateCourseCalendarTerm: (term: string) => void
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
  openCreateStudentModal: () => void
  openEditStudentModal: (item: any) => void
  closeStudentModal: () => void
  openDeleteStudentModal: (item: any) => void
  closeDeleteStudentModal: () => void
  openBulkDeleteStudentModal: () => void
  closeBulkDeleteStudentModal: () => void
  saveStudent: () => Promise<void>
  deleteStudent: () => Promise<void>
  bulkDeleteStudents: () => Promise<void>
  updateStudentPage: (page: number) => void
  updateStudentPageSize: (size: number) => void
  toggleStudentSelection: (studentId: number) => void
  toggleStudentPageSelection: () => void
  createClassStudent: () => Promise<void>
  importClassStudents: (file: File) => Promise<void>
  startEditClassStudent: (studentId: number) => void
  saveEditingClassStudent: () => Promise<boolean>
  deleteClassStudent: (studentId: number) => Promise<void>
  updateClassPage: (page: number) => void
  updateClassPageSize: (size: number) => void
  toggleClassSelection: (classId: number) => void
  toggleClassPageSelection: () => void
  bulkDeleteClasses: () => Promise<void>
  openCreateUserModal: () => void
  updateAttendanceLogsPage: (page: number) => void
  updateAttendanceLogsPageSize: (size: number) => void
  openEditUserModal: (user: any) => void
  closeUserModal: () => void
  openUserPasswordModal: (user: any) => void
  closeUserPasswordModal: () => void
  openUserFreeTimeModal: (user: any) => Promise<void>
  closeUserFreeTimeModal: () => void
  updateUserFreeTimeTerm: (term: string) => Promise<void>
  toggleUserFreeTimeWeek: (payload: { weekday: number; section: number; weekNo: number }) => void
  toggleUserFreeTimeCell: (payload: { weekday: number; section: number }) => void
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
  updateAdminStatus: (sessionId: number, studentRefId: number, status: StatusCode) => Promise<void>
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
    closeCourseModal: deps.closeCourseModal,
    openDeleteCourseModal: deps.openDeleteCourseModal,
    closeDeleteCourseModal: deps.closeDeleteCourseModal,
    openBulkDeleteCourseModal: deps.openBulkDeleteCourseModal,
    closeBulkDeleteCourseModal: deps.closeBulkDeleteCourseModal,
    saveCourse: deps.saveCourse,
    deleteCourse: deps.deleteCourse,
    updateCoursePage: deps.updateCoursePage,
    updateCoursePageSize: deps.updateCoursePageSize,
    toggleCourseSelection: deps.toggleCourseSelection,
    toggleCoursePageSelection: deps.toggleCoursePageSelection,
    bulkDeleteCourses: deps.bulkDeleteCourses,
    updateCourseCalendarTerm: deps.updateCourseCalendarTerm,
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
    openCreateStudentModal: deps.openCreateStudentModal,
    openEditStudentModal: deps.openEditStudentModal,
    closeStudentModal: deps.closeStudentModal,
    openDeleteStudentModal: deps.openDeleteStudentModal,
    closeDeleteStudentModal: deps.closeDeleteStudentModal,
    openBulkDeleteStudentModal: deps.openBulkDeleteStudentModal,
    closeBulkDeleteStudentModal: deps.closeBulkDeleteStudentModal,
    saveStudent: deps.saveStudent,
    deleteStudent: deps.deleteStudent,
    bulkDeleteStudents: deps.bulkDeleteStudents,
    updateStudentPage: deps.updateStudentPage,
    updateStudentPageSize: deps.updateStudentPageSize,
    toggleStudentSelection: deps.toggleStudentSelection,
    toggleStudentPageSelection: deps.toggleStudentPageSelection,
    createClassStudent: deps.createClassStudent,
    importClassStudents: deps.importClassStudents,
    startEditClassStudent: deps.startEditClassStudent,
    saveEditingClassStudent: deps.saveEditingClassStudent,
    deleteClassStudent: deps.deleteClassStudent,
    updateClassPage: deps.updateClassPage,
    updateClassPageSize: deps.updateClassPageSize,
    toggleClassSelection: deps.toggleClassSelection,
    toggleClassPageSelection: deps.toggleClassPageSelection,
    bulkDeleteClasses: deps.bulkDeleteClasses,
    openCreateUserModal: deps.openCreateUserModal,
    updateAttendanceLogsPage: deps.updateAttendanceLogsPage,
    updateAttendanceLogsPageSize: deps.updateAttendanceLogsPageSize,
    openEditUserModal: deps.openEditUserModal,
    closeUserModal: deps.closeUserModal,
    openUserPasswordModal: deps.openUserPasswordModal,
    closeUserPasswordModal: deps.closeUserPasswordModal,
    openUserFreeTimeModal: deps.openUserFreeTimeModal,
    closeUserFreeTimeModal: deps.closeUserFreeTimeModal,
    updateUserFreeTimeTerm: deps.updateUserFreeTimeTerm,
    toggleUserFreeTimeWeek: deps.toggleUserFreeTimeWeek,
    toggleUserFreeTimeCell: deps.toggleUserFreeTimeCell,
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
