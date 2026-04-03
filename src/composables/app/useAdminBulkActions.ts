import type { Ref } from 'vue'

import { api, type ClassItem, type CourseItem, type FreeTimeEditorItem, type StudentItem, type SystemSetting, type UserItem } from '../../api'
import type { AdminClassStudentForm } from '../../components/admin/form-types'
import { FREE_TIME_VISIBLE_SECTIONS, FREE_TIME_VISIBLE_WEEKDAYS, buildFreeTimeCellKey, formatFreeWeeks, parseFreeWeeks } from '../../utils/free-time'

type AdminBulkActionsCoreDeps = {
  adminError: Ref<string>
  showScopedToast: (target: 'admin' | 'student', message: string) => void
  loadAdminData: () => Promise<void>
  invalidateClassOptionsCache?: () => void
}

type AdminBulkActionsStateDeps = {
  users: Ref<UserItem[]>
  classes: Ref<ClassItem[]>
  students: Ref<StudentItem[]>
  courses: Ref<CourseItem[]>
  systemSettings: Ref<SystemSetting | null>
  freeTimeTargetLoginId: Ref<string>
  userFreeTimeTerm: Ref<string>
  userFreeTimeItems: Ref<FreeTimeEditorItem[]>
  userFreeTimeDraft: Ref<Record<string, number[]>>
  selectedCourseIds: Ref<number[]>
  selectedClassIds: Ref<number[]>
  selectedStudentIds: Ref<number[]>
  selectedUserStudentIds: Ref<string[]>
  classStudentTargetClassId: Ref<number | null>
  editingClassStudentId: Ref<number | null>
  classStudentForm: AdminClassStudentForm
  editingClassStudentForm: AdminClassStudentForm
}

type AdminBulkActionsLoadingDeps = {
  classStudentSaving: Ref<boolean>
  classStudentImporting: Ref<boolean>
  userFreeTimeSaving: Ref<boolean>
  systemSettingSaving: Ref<boolean>
  courseDeleting: Ref<boolean>
  classDeleting: Ref<boolean>
  studentDeleting: Ref<boolean>
  userStatusUpdating: Ref<boolean>
}

type AdminBulkActionsUiDeps = {
  closeBulkDeleteCourseModal: () => void
  closeBulkDeleteClassModal: () => void
  closeBulkDeleteStudentModal: () => void
  closeUserFreeTimeModal: () => void
  loadUserFreeTimeItems: (loginId: string) => Promise<void>
  loadClassStudents: (classId: number) => Promise<void>
  resetClassStudentForm: () => void
  resetEditingClassStudentForm: () => void
}

export type AdminBulkActionsDeps = AdminBulkActionsCoreDeps &
  AdminBulkActionsStateDeps &
  AdminBulkActionsLoadingDeps &
  AdminBulkActionsUiDeps

export function useAdminBulkActions(deps: AdminBulkActionsDeps) {

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
      await deps.loadAdminData()
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
      await deps.loadAdminData()
      deps.showScopedToast('admin', '班级学生已更新')
      return true
    } catch (error) {
      deps.adminError.value = error instanceof Error ? error.message : '更新班级学生失败'
      return false
    } finally {
      deps.classStudentSaving.value = false
    }
  }

  async function importClassStudents(file: File) {
    if (deps.classStudentTargetClassId.value === null) {
      return
    }
    deps.classStudentImporting.value = true
    deps.adminError.value = ''
    try {
      const result = await api.importClassStudents(deps.classStudentTargetClassId.value, file)
      await deps.loadClassStudents(deps.classStudentTargetClassId.value)
      await deps.loadAdminData()
      deps.showScopedToast('admin', `已导入 ${result.imported_count} 个学生`)
    } catch (error) {
      deps.adminError.value = error instanceof Error ? error.message : '导入班级学生失败'
    } finally {
      deps.classStudentImporting.value = false
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
      await deps.loadAdminData()
      deps.showScopedToast('admin', '班级学生已移除')
    } catch (error) {
      deps.adminError.value = error instanceof Error ? error.message : '移除班级学生失败'
    } finally {
      deps.classStudentSaving.value = false
    }
  }

  async function bulkDeleteClassStudents(studentIds: number[]) {
    if (deps.classStudentTargetClassId.value === null || studentIds.length === 0) {
      return
    }
    deps.classStudentSaving.value = true
    deps.adminError.value = ''
    try {
      for (const studentId of studentIds) {
        await api.deleteClassStudent(deps.classStudentTargetClassId.value, studentId)
        if (deps.editingClassStudentId.value === studentId) {
          deps.resetEditingClassStudentForm()
        }
      }
      await deps.loadClassStudents(deps.classStudentTargetClassId.value)
      await deps.loadAdminData()
      deps.showScopedToast('admin', `已移除 ${studentIds.length} 个班级学生`)
    } catch (error) {
      deps.adminError.value = error instanceof Error ? error.message : '批量移除班级学生失败'
    } finally {
      deps.classStudentSaving.value = false
    }
  }

  async function saveUserFreeTime() {
    if (!deps.freeTimeTargetLoginId.value) {
      return
    }
    deps.userFreeTimeSaving.value = true
    deps.adminError.value = ''
    try {
      const term = deps.userFreeTimeTerm.value.trim()
      const originalItems = deps.userFreeTimeItems.value.filter((item) => item.term === term)
      const originalMap = new Map(originalItems.map((item) => [buildFreeTimeCellKey(item.weekday, item.section), item]))
      const tasks: Promise<unknown>[] = []

      for (const weekday of FREE_TIME_VISIBLE_WEEKDAYS) {
        for (const section of FREE_TIME_VISIBLE_SECTIONS) {
          const key = buildFreeTimeCellKey(weekday, section)
          const weeks = deps.userFreeTimeDraft.value[key] ?? []
          const currentValue = formatFreeWeeks(weeks)
          const currentItem = originalMap.get(key)
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
            login_id: deps.freeTimeTargetLoginId.value,
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
      await deps.loadUserFreeTimeItems(deps.freeTimeTargetLoginId.value)
      await deps.loadAdminData()
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
    const nameById = new Map(deps.courses.value.map((item) => [item.id, item.course_name]))
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
      await deps.loadAdminData()
      deps.closeBulkDeleteCourseModal()
      deps.selectedCourseIds.value = failed.length === 0 ? [] : deps.selectedCourseIds.value.filter((id) => ids.includes(id))
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
    const nameById = new Map(deps.classes.value.map((item) => [item.id, item.class_name]))
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
      deps.invalidateClassOptionsCache?.()
      await deps.loadAdminData()
      deps.closeBulkDeleteClassModal()
      deps.selectedClassIds.value = failed.length === 0 ? [] : deps.selectedClassIds.value.filter((id) => ids.includes(id))
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

  async function bulkDeleteStudents() {
    const ids = [...deps.selectedStudentIds.value]
    if (ids.length === 0) {
      return
    }

    deps.studentDeleting.value = true
    deps.adminError.value = ''
    const nameById = new Map(deps.students.value.map((item) => [item.id, `${item.real_name}（${item.student_id}）`]))
    const failed: string[] = []
    const failedIds = new Set<number>()
    let deletedCount = 0
    try {
      for (const id of ids) {
        try {
          await api.deleteStudent(id)
          deletedCount += 1
        } catch (error) {
          failedIds.add(id)
          const label = nameById.get(id) ?? `ID ${id}`
          const message = error instanceof Error ? error.message : '删除失败'
          failed.push(`${label}（${message}）`)
        }
      }
      await deps.loadAdminData()
      deps.closeBulkDeleteStudentModal()
      deps.selectedStudentIds.value = ids.filter((id) => failedIds.has(id))
      if (deletedCount > 0) {
        deps.showScopedToast('admin', `已删除 ${deletedCount} 个学生`)
      }
      if (failed.length > 0) {
        deps.adminError.value = `部分删除失败：${failed.join('；')}`
      }
    } finally {
      deps.studentDeleting.value = false
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
    const nameByStudentId = new Map(deps.users.value.map((item) => [item.login_id, item.real_name]))
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
      await deps.loadAdminData()
      deps.selectedUserStudentIds.value = failed.length === 0 ? [] : deps.selectedUserStudentIds.value.filter((studentId) => studentIds.includes(studentId))
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

  return {
    createClassStudent,
    saveEditingClassStudent,
    importClassStudents,
    deleteClassStudent,
    bulkDeleteClassStudents,
    saveUserFreeTime,
    updateSystemSettings,
    bulkDeleteCourses,
    bulkDeleteClasses,
    bulkDeleteStudents,
    bulkSetUserStatus,
  }
}
