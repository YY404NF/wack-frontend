import type { StatusCode } from '../constants'
import { useAdminBulkActions, type AdminBulkActionsDeps } from './app/useAdminBulkActions'
import { useAdminFlow, type AdminFlowDeps } from './app/useAdminFlow'
import { useAdminWorkspaceHandlers, type AdminWorkspaceHandlersDeps } from './app/useAdminWorkspaceHandlers'
import { useAdminWorkspaceProps, type AdminWorkspacePropsDeps } from './app/useAdminWorkspaceProps'

type AdminScopedToastDeps = {
  showScopedToast: (target: 'admin' | 'student', message: string) => void
}

type AdminFlowInputDeps = Omit<AdminFlowDeps, 'showAdminToast'>

type AdminBulkActionsInputDeps = Omit<AdminBulkActionsDeps, 'loadAdminData'>

type AdminWorkspaceHandlersInputDeps = Omit<
  AdminWorkspaceHandlersDeps,
  | 'saveCourse'
  | 'deleteCourse'
  | 'bulkDeleteCourses'
  | 'updateSystemSettings'
  | 'saveClass'
  | 'deleteClass'
  | 'saveStudent'
  | 'deleteStudent'
  | 'bulkDeleteStudents'
  | 'createClassStudent'
  | 'saveEditingClassStudent'
  | 'deleteClassStudent'
  | 'bulkDeleteClasses'
  | 'saveUserFreeTime'
  | 'resetUserPassword'
  | 'bulkSetUserStatus'
  | 'updateProfile'
  | 'createUser'
  | 'setUserStatus'
  | 'updateAdminStatus'
>

export type UseAdminAppDeps = AdminFlowInputDeps &
  AdminScopedToastDeps &
  AdminBulkActionsInputDeps &
  AdminWorkspacePropsDeps &
  AdminWorkspaceHandlersInputDeps

export function useAdminApp(deps: UseAdminAppDeps) {
  const adminFlow = useAdminFlow({
    ...deps,
    showAdminToast: (message: string) => deps.showScopedToast('admin', message),
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

  async function deleteCourse() {
    await adminFlow.deleteCourse()
  }

  async function saveClass() {
    await adminFlow.saveClass()
  }

  async function deleteClass() {
    await adminFlow.deleteClass()
  }

  async function saveStudent() {
    await adminFlow.saveStudent()
  }

  async function deleteStudent() {
    await adminFlow.deleteStudent()
  }

  async function updateAdminStatus(detailId: number, status: StatusCode) {
    await adminFlow.updateAdminStatus(detailId, status)
  }

  const adminBulkActions = useAdminBulkActions({ ...deps, loadAdminData })

  const adminWorkspaceProps = useAdminWorkspaceProps(deps)

  const adminWorkspaceHandlers = useAdminWorkspaceHandlers({
    ...deps,
    saveCourse,
    deleteCourse,
    bulkDeleteCourses: adminBulkActions.bulkDeleteCourses,
    updateSystemSettings: adminBulkActions.updateSystemSettings,
    saveClass,
    deleteClass,
    saveStudent,
    deleteStudent,
    bulkDeleteStudents: adminBulkActions.bulkDeleteStudents,
    createClassStudent: adminBulkActions.createClassStudent,
    saveEditingClassStudent: adminBulkActions.saveEditingClassStudent,
    deleteClassStudent: adminBulkActions.deleteClassStudent,
    bulkDeleteClasses: adminBulkActions.bulkDeleteClasses,
    saveUserFreeTime: adminBulkActions.saveUserFreeTime,
    resetUserPassword,
    bulkSetUserStatus: adminBulkActions.bulkSetUserStatus,
    updateProfile,
    createUser,
    setUserStatus,
    updateAdminStatus,
  })

  return {
    loadAdminData,
    adminWorkspaceProps,
    adminWorkspaceHandlers,
  }
}
